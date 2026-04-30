import { NewsletterSubscriptionForm } from "@/components/newsletter-subscription-form"
import { getEmbedHeaderCopy, getSubscribePageConfig } from "@/lib/subscribe-copy-server"

export function SubscribePageShell({ variant }: { variant: "full" | "embed" }) {
  const copy = getSubscribePageConfig()
  const logoOrigin = process.env.NEXT_PUBLIC_LOGO_CDN_ORIGIN?.trim() || undefined

  const form = (
    <NewsletterSubscriptionForm
      networks={copy.networks}
      successTitle={copy.successTitle}
      successBody={copy.successBody}
      ctaText={copy.ctaText}
      privacyText={copy.privacyText}
      logoCdnOrigin={logoOrigin}
    />
  )

  if (variant === "embed") {
    const header = getEmbedHeaderCopy()
    return (
      <div className="min-h-screen bg-white text-gray-900 antialiased">
        <div className="mx-auto w-full max-w-2xl px-5 py-8 sm:px-8 sm:py-10">
          <header className="mb-8 border-b border-gray-200 pb-6">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-[1.75rem]">
              {header.title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-600 sm:text-base">{header.subtitle}</p>
          </header>
          <div className="mb-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900">{copy.formTitle}</h2>
            <p className="mt-2 text-gray-600">{copy.formSubtitle}</p>
          </div>
          {form}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{copy.heroTitle}</h2>
            <p className="text-gray-600 text-lg">{copy.heroSubtitle}</p>
          </div>
          <div className="mb-8 text-center">
            <h3 className="text-xl font-semibold text-gray-900">{copy.formTitle}</h3>
            <p className="mt-2 text-gray-600">{copy.formSubtitle}</p>
          </div>
          {form}
        </div>
      </div>
    </div>
  )
}
