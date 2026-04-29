import { DEFAULT_SUBSCRIBE_COPY, type SubscribePageCopy } from "@/lib/subscribe-page-config"

function pick(key: string, fallback: string): string {
  const v = process.env[key]?.trim()
  return v && v.length > 0 ? v : fallback
}

export function getSubscribePageCopy(): SubscribePageCopy {
  const d = DEFAULT_SUBSCRIBE_COPY
  return {
    heroTitle: pick("NEXT_PUBLIC_HERO_TITLE", d.heroTitle),
    heroSubtitle: pick("NEXT_PUBLIC_HERO_SUBTITLE", d.heroSubtitle),
    formTitle: pick("NEXT_PUBLIC_FORM_TITLE", d.formTitle),
    formSubtitle: pick("NEXT_PUBLIC_FORM_SUBTITLE", d.formSubtitle),
    successTitle: d.successTitle,
    successBody: d.successBody,
    ctaText: d.ctaText,
    privacyText: d.privacyText,
    roles: d.roles,
    networks: d.networks,
  }
}

export function getEmbedHeaderCopy(): { title: string; subtitle: string } {
  const d = DEFAULT_SUBSCRIBE_COPY
  return {
    title: pick("NEXT_PUBLIC_EMBED_TITLE", d.heroTitle),
    subtitle: pick("NEXT_PUBLIC_EMBED_SUBTITLE", d.heroSubtitle),
  }
}
