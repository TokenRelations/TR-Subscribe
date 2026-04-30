const BEEHIIV_API_URL = "https://api.beehiiv.com/v2"

/**
 * Beehiiv does not accept `segment_id` on "Create subscription".
 * Dynamic segments are rules (e.g. "has tag Solana"). Tags are applied via a
 * separate endpoint after the subscription exists:
 * POST /v2/publications/{pub}/subscriptions/{subId}/tags — tags are created on
 * the publication if missing (see Subscription Tags API).
 */

const VALID_BEEHIIV_SEGMENTS = new Set([
  "Token Relations",
  "Solana",
  "Sei",
  "Ripple",
  "Polygon",
  "Optimism",
  "Movement Network",
  "Mezo",
  "Matchain",
  "Injective",
  "Hedera",
  "Flow",
  "DeCharge",
  "Core DAO",
  "Chainlink",
  "Avalanche",
  "Aptos",
  "Animecoin",
  "Chiliz",
  "DeFi",
  "Stablecoins",
  "The Market Runup",
  "Talking Tokens",
  "Tokenization",
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

function networkTagsFromPayload(payload: SubscribePayload): string[] {
  const raw = payload.subscribed_networks.map((t) => t.trim()).filter(Boolean)
  return [...new Set(raw)]
}

async function addSubscriptionTags(
  apiKey: string,
  publicationId: string,
  subscriptionId: string,
  tags: string[]
): Promise<{ ok: true } | { ok: false; status: number; detail: unknown }> {
  if (tags.length === 0) return { ok: true }
  const res = await fetch(
    `${BEEHIIV_API_URL}/publications/${publicationId}/subscriptions/${subscriptionId}/tags`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ tags }),
    }
  )
  if (res.ok) return { ok: true }
  return { ok: false, status: res.status, detail: await safeJson(res) }
}

async function getSubscriptionIdByEmail(
  apiKey: string,
  publicationId: string,
  email: string
): Promise<string | null> {
  const encoded = encodeURIComponent(email)
  const res = await fetch(
    `${BEEHIIV_API_URL}/publications/${publicationId}/subscriptions/by_email/${encoded}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    }
  )
  if (!res.ok) return null
  try {
    const body = (await res.json()) as { data?: { id?: string } }
    return body.data?.id ?? null
  } catch {
    return null
  }
}

/** Tags = what Beehiiv uses for grouping; dynamic segments often key off tags. */
async function applyInterestTags(
  apiKey: string,
  publicationId: string,
  subscriptionId: string,
  payload: SubscribePayload
): Promise<void> {
  if (!parseBoolEnv(process.env.BEEHIIV_APPLY_NETWORK_TAGS, true)) return
  const tags = networkTagsFromPayload(payload)
  if (tags.length === 0) return
  const tagRes = await addSubscriptionTags(apiKey, publicationId, subscriptionId, tags)
  if (!tagRes.ok) {
    console.error("Beehiiv add subscription tags failed:", tagRes.status, tagRes.detail)
  }
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
    // One custom_field row per name — Beehiiv rejects duplicate `name` entries.
    // Value: comma-separated string (works for string-type fields); arrays are also allowed per API.
    const values = Array.from(segmentsToPush)
    if (values.length > 0) {
      out.push({ name: networksField, value: values.join(", ") })
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

  // Tags / "segments": not on this body — apply via POST .../subscriptions/{id}/tags
  // after create (see applyInterestTags).

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

  if (res.ok) {
    const created = (await res.json()) as { data?: { id?: string } }
    const subscriptionId = created.data?.id
    if (subscriptionId) {
      await applyInterestTags(apiKey, publicationId, subscriptionId, payload)
    } else {
      console.error("Beehiiv create subscription: missing data.id in response", created)
    }
    await postSubscribeMirrorWebhook(payload)
    return { ok: true }
  }

  const detail = await safeJson(res)
  const ignore = process.env.BEEHIIV_IGNORE_ERRORS === "true"
  if (ignore) {
    console.error("Beehiiv create subscription failed (BEEHIIV_IGNORE_ERRORS=true):", res.status, detail)
    return { ok: true }
  }

  if (isLikelyDuplicateResponse(res.status, detail)) {
    const existingId = await getSubscriptionIdByEmail(apiKey, publicationId, payload.email)
    if (existingId) {
      await applyInterestTags(apiKey, publicationId, existingId, payload)
    }
    await postSubscribeMirrorWebhook(payload)
    return { ok: true, duplicate: true }
  }

  const upstreamStatus = res.status
  const status =
    upstreamStatus === 429
      ? 503
      : upstreamStatus >= 500
        ? 502
        : upstreamStatus >= 400
          ? upstreamStatus
          : 502

  console.error("Beehiiv create subscription failed:", upstreamStatus, detail)
  return { ok: false, status, detail: { upstreamStatus, ...((typeof detail === "object" && detail) || { detail }) } }
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
