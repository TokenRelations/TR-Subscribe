const BEEHIIV_API_URL = "https://api.beehiiv.com/v2"

export type SubscribeInboundPayload = {
  email: string
  first_name?: string | null
  last_name?: string | null
  role?: string | null
  subscribed_networks: string[]
}

async function beehiivFetch(path: string, init: RequestInit, apiKey: string) {
  return fetch(`${BEEHIIV_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init.headers as Record<string, string> | undefined),
    },
  })
}

export async function resolvePublicationId(apiKey: string): Promise<string> {
  const explicit = process.env.BEEHIIV_PUBLICATION_ID?.trim()
  if (explicit) return explicit

  const res = await beehiivFetch("/publications", { method: "GET" }, apiKey)
  const raw = await res.text()
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    parsed = raw
  }

  if (!res.ok) {
    throw new Error(
      `Beehiiv publications ${res.status}: ${typeof parsed === "string" ? parsed : JSON.stringify(parsed)}`
    )
  }

  const data = parsed as { data?: { id: string }[] }
  const id = data?.data?.[0]?.id
  if (!id) throw new Error("No publications returned from Beehiiv")
  return id
}

function envBool(name: string): boolean | undefined {
  const v = process.env[name]?.trim().toLowerCase()
  if (v === "true") return true
  if (v === "false") return false
  return undefined
}

function buildCustomFields(payload: SubscribeInboundPayload): { name: string; value: string }[] {
  const out: { name: string; value: string }[] = []
  const fullNameField = process.env.BEEHIIV_CUSTOM_FIELD_FULL_NAME?.trim()
  if (fullNameField) {
    const fn = (payload.first_name || "").trim()
    const ln = (payload.last_name || "").trim()
    const full = [fn, ln].filter(Boolean).join(" ")
    if (full) out.push({ name: fullNameField, value: full })
  }
  const roleField = process.env.BEEHIIV_CUSTOM_FIELD_ROLE?.trim()
  if (roleField && payload.role?.trim()) {
    out.push({ name: roleField, value: payload.role.trim() })
  }
  const netField = process.env.BEEHIIV_CUSTOM_FIELD_NETWORKS?.trim()
  if (netField && payload.subscribed_networks?.length) {
    out.push({ name: netField, value: payload.subscribed_networks.join(", ") })
  }
  return out
}

function isLikelyDuplicateResponse(status: number, body: unknown): boolean {
  if (status === 409) return true
  const s = JSON.stringify(body).toLowerCase()
  if (status !== 400) return false
  return (
    s.includes("already") ||
    s.includes("exists") ||
    s.includes("duplicate") ||
    s.includes("subscribed")
  )
}

export type SyncSubscriberResult =
  | { ok: true; publicationId: string; beehiivStatus: number; duplicate?: boolean }
  | { ok: false; status: number; detail: unknown }

async function postOptionalWebhook(payload: SubscribeInboundPayload) {
  const url = process.env.SUBSCRIBE_WEBHOOK_URL?.trim()
  if (!url) return
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    })
  } catch (e) {
    console.error("SUBSCRIBE_WEBHOOK_URL mirror failed:", e)
  }
}

export async function syncSubscriberToBeehiiv(
  apiKey: string,
  payload: SubscribeInboundPayload
): Promise<SyncSubscriberResult> {
  const publicationId = await resolvePublicationId(apiKey)
  const custom_fields = buildCustomFields(payload)

  const body: Record<string, unknown> = {
    email: payload.email.trim(),
  }
  if (custom_fields.length) body.custom_fields = custom_fields

  const sendWelcome = envBool("BEEHIIV_SEND_WELCOME_EMAIL")
  if (sendWelcome !== undefined) body.send_welcome_email = sendWelcome

  const reactivate = envBool("BEEHIIV_REACTIVATE_EXISTING")
  if (reactivate !== undefined) body.reactivate_existing = reactivate

  const dip = process.env.BEEHIIV_DOUBLE_OPT_OVERRIDE?.trim()
  if (dip === "on" || dip === "off" || dip === "not_set") {
    body.double_opt_override = dip
  }

  const utm = process.env.BEEHIIV_UTM_SOURCE?.trim()
  if (utm) body.utm_source = utm

  const rawAutomation = process.env.BEEHIIV_AUTOMATION_IDS
  const automationIds = rawAutomation
    ? rawAutomation.split(",").map((s) => s.trim()).filter(Boolean)
    : []
  if (automationIds.length) body.automation_ids = automationIds

  const res = await beehiivFetch(
    `/publications/${publicationId}/subscriptions`,
    { method: "POST", body: JSON.stringify(body) },
    apiKey
  )

  let parsed: unknown = null
  try {
    parsed = await res.json()
  } catch {
    parsed = await res.text().catch(() => null)
  }

  if (res.ok) {
    await postOptionalWebhook(payload)
    return { ok: true, publicationId, beehiivStatus: res.status }
  }

  if (isLikelyDuplicateResponse(res.status, parsed)) {
    await postOptionalWebhook(payload)
    return { ok: true, publicationId, beehiivStatus: res.status, duplicate: true }
  }

  return { ok: false, status: res.status, detail: parsed }
}
