import type { Metadata } from "next"

import { Toaster } from "@/components/ui/toaster"

import "./globals.css"

export const metadata: Metadata = {
  title: "Subscribe | Token Relations",
  description:
    "Subscribe to receive investor updates and insights directly in your inbox.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
