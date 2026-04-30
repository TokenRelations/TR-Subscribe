import { NextResponse } from "next/server"
import { z } from "zod"

import { getBeehiivApiKey, syncSubscriberToBeehiiv } from "@/lib/beehiiv-subscribe"

const bodySchema = z.object({
  email: z.string().email(),
  subscribed_networks: z.array(z.string()).min(1, "Select at least one network."),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
})

export async function POST(request: Request) {
  const apiKey = getBeehiivApiKey()
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server misconfigured", detail: "BEEHIIV_API_KEY is not set." },
      { status: 503 }
    )
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", detail: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const payload = {
    email: parsed.data.email,
    subscribed_networks: parsed.data.subscribed_networks,
    first_name: parsed.data.first_name ?? null,
    last_name: parsed.data.last_name ?? null,
    role: parsed.data.role ?? null,
  }

  try {
    const result = await syncSubscriberToBeehiiv(payload)

    if (result.ok) {
      return NextResponse.json({
        success: true,
        duplicate: result.duplicate === true,
      })
    }

    const ignore = process.env.BEEHIIV_IGNORE_ERRORS?.trim().toLowerCase() === "true"
    if (ignore) {
      console.error("Beehiiv subscribe failed (ignored):", result.status, result.detail)
      return NextResponse.json({ success: true, ignored: true })
    }

    const upstream = result.status >= 400 && result.status < 600 ? result.status : 502

    // Beehiiv returns 401/403 for bad or revoked keys — don’t forward as HTTP 401 on our route
    // (browsers and embed tooling treat that as “this app requires login”).
    if (upstream === 401 || upstream === 403) {
      return NextResponse.json(
        {
          error:
            "Beehiiv rejected the API key. In Vercel → Settings → Environment Variables, set BEEHIIV_API_KEY to the v2 API key from Beehiiv (app.beehiiv.com → Settings → API), then redeploy.",
          detail: result.detail,
        },
        { status: 502 }
      )
    }

    const status = upstream === 429 ? 503 : upstream >= 500 ? 502 : upstream
    return NextResponse.json(
      { error: "Beehiiv request failed", detail: result.detail },
      { status }
    )
  } catch (e) {
    console.error("subscribe route error:", e)
    const ignore = process.env.BEEHIIV_IGNORE_ERRORS?.trim().toLowerCase() === "true"
    if (ignore) {
      return NextResponse.json({ success: true, ignored: true })
    }
    return NextResponse.json(
      {
        error: "Subscription failed",
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 503 }
    )
  }
}
