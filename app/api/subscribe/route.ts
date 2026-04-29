import { NextResponse } from "next/server"
import { z } from "zod"

import { syncSubscriberToBeehiiv } from "@/lib/beehiiv-subscribe"

const bodySchema = z.object({
  email: z.string().email(),
  subscribed_networks: z.array(z.string()).min(1, "Select at least one network."),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
})

export async function POST(request: Request) {
  const apiKey = process.env.BEEHIIV_API_KEY?.trim()
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
    const result = await syncSubscriberToBeehiiv(apiKey, payload)

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

    const status = result.status >= 400 && result.status < 600 ? result.status : 502
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
