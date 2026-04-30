const BEEHIIV_API_URL = "https://api.beehiiv.com/v2"

const VALID_BEEHIIV_SEGMENTS = new Set([
  "Token Relations", "Solana", "Sei", "Ripple", "Polygon", "Optimism",
  "Movement Network", "Mezo", "Matchain", "Injective", "Hedera", "Flow",
  "DeCharge", "Core DAO", "Chainlink", "Avalanche", "Aptos", "Animecoin"
])

export type SubscribePayload = {
  email: string
  first_name: string | null
  last_name: string | null
  role: string | null
  subscribed_networks: string[]
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    return { message: await res.text().catch(() => "") }
  }
}

function parseBoolEnv(v: string | undefined, defaultVal: boolean): boolean {
  if (v === undefined || v === "") return defaultVal
  return v === "1" || v.toLowerCase() === "true"
}

export async function resolvePublicationId(apiKey: string): Promise<string> {
  const fromEnv = process.env.BEEHIIV_PUBLICATION_ID?.trim()
  if (fromEnv) return fromEnv

  const res = await fetch(`${BEEHIIV_API_URL}/publications`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
  })

  if (!res.ok) {
    const detail = await safeJson(res)
    throw new Error(`Beehiiv publications ${res.status}: ${JSON.stringify(detail)}`)
  }

  const data = (await res.json()) as { data?: Array<{ id: string }> }
  const id = data.data?.[0]?.id
  if (!id) throw new Error("No publications found for this API key")
  return id
}

function buildCustomFields(payload: SubscribePayload): Array<{ name: string; value: string | string[] }> {
  const out: Array<{ name: string; value: string | string[] }> = []
  const fullNameField = process.env.BEEHIIV_CUSTOM_FIELD_FULL_NAME?.trim()
  const roleField = process.env.BEEHIIV_CUSTOM_FIELD_ROLE?.trim()
  const networksField = process.env.BEEHIIV_CUSTOM_FIELD_NETWORKS?.trim()

  const full = [payload.first_name, payload.last_name].filter(Boolean).join(" ").trim()
  if (fullNameField && full) out.push({ name: fullNameField, value: full })
  if (roleField && payload.role) out.push({ name: roleField, value: payload.role })
  if (networksField && payload.subscribed_networks.length > 0) {
    const segmentsToPush = new Set<string>()
    for (const network of payload.subscribed_networks) {
      if (VALID_BEEHIIV_SEGMENTS.has(network)) {
        segmentsToPush.add(network)
      } else {
        segmentsToPush.add("Token Relations")
      }
    }
    for (const segment of segmentsToPush) {
      out.push({ name: networksField, value: segment })
    }
  }
  return out
}

export type BeehiivSyncResult = { ok: true; duplicate?: boolean } | { ok: false; status: number; detail: unknown }

export async function syncSubscriberToBeehiiv(payload: SubscribePayload): Promise<BeehiivSyncResult> {
  const apiKey = process.env.BEEHIIV_API_KEY?.trim()
  if (!apiKey) {
    return { ok: false, status: 503, detail: { error: "BEEHIIV_API_KEY is not configured" } }
  }

  let publicationId: string
  try {
    publicationId = await resolvePublicationId(apiKey)
  } catch (e) {
    console.error("Beehiiv publication resolution:", e)
    return {
      ok: false,
      status: 503,
      detail: { error: e instanceof Error ? e.message : "Failed to resolve publication" },
    }
  }

  const custom_fields = buildCustomFields(payload)

  const requestBody: Record<string, unknown> = {
    email: payload.email,
    reactivate_existing: parseBoolEnv(process.env.BEEHIIV_REACTIVATE_EXISTING, false),
    send_welcome_email: parseBoolEnv(process.env.BEEHIIV_SEND_WELCOME_EMAIL, false),
  }

  if (custom_fields.length > 0) requestBody.custom_fields = custom_fields

  if (payload.subscribed_networks && payload.subscribed_networks.length > 0) {
    const mappedTags = new Set<string>()
    for (const network of payload.subscribed_networks) {
      if (VALID_BEEHIIV_SEGMENTS.has(network)) {
        mappedTags.add(network)
      } else {
        mappedTags.add("Token Relations")
      }
    }
    requestBody.tags = Array.from(mappedTags)
  }

  const utm = process.env.BEEHIIV_UTM_SOURCE?.trim()
  if (utm) requestBody.utm_source = utm

  const dopt = process.env.BEEHIIV_DOUBLE_OPT_OVERRIDE?.trim()
  if (dopt === "on" || dopt === "off" || dopt === "not_set") {
    requestBody.double_opt_override = dopt
  }

  const automationRaw = process.env.BEEHIIV_AUTOMATION_IDS?.trim()
  if (automationRaw) {
    requestBody.automation_ids = automationRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  }

  const res = await fetch(`${BEEHIIV_API_URL}/publications/${publicationId}/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(requestBody),
  })

  if (res.ok) return { ok: true }

  const detail = await safeJson(res)
  const ignore = process.env.BEEHIIV_IGNORE_ERRORS === "true"
  if (ignore) {
    console.error("Beehiiv create subscription failed (BEEHIIV_IGNORE_ERRORS=true):", res.status, detail)
    return { ok: true }
  }

  // Map upstream errors to 502/503 for operators
  const upstreamStatus = res.status
  const status =
    upstreamStatus === 429 ? 503 : upstreamStatus >= 500 ? 502 : 502

  console.error("Beehiiv create subscription failed:", upstreamStatus, detail)
  return { ok: false, status, detail: { upstreamStatus, ...((typeof detail === "object" && detail) || { detail }) } }
}

export async function postSubscribeMirrorWebhook(body: unknown): Promise<void> {
  const url = process.env.SUBSCRIBE_WEBHOOK_URL?.trim()
  if (!url) return
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    })
  } catch (e) {
    console.error("SUBSCRIBE_WEBHOOK_URL mirror failed:", e)
  }
}
