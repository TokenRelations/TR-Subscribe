import type { Metadata } from "next"

import { SubscribePageShell } from "@/components/subscribe-page-shell"

export const metadata: Metadata = {
  title: "Subscribe | Investor updates",
  description:
    "Subscribe to receive investor updates and insights directly in your inbox.",
  robots: { index: false, follow: false },
}

export default function EmbedPage() {
  return <SubscribePageShell variant="embed" />
}
