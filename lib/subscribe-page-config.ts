export interface SubscribeNetworkOption {
  name: string
  logo?: string
}

export interface SubscribePageConfig {
  heroTitle: string
  heroSubtitle: string
  formTitle: string
  formSubtitle: string
  successTitle: string
  successBody: string
  ctaText: string
  privacyText: string
  networks: SubscribeNetworkOption[]
}

export const DEFAULT_SUBSCRIBE_PAGE_CONFIG: SubscribePageConfig = {
  heroTitle: "Stay Ahead as Markets Move",
  heroSubtitle: "Subscribe to receive investor updates and insights directly in your inbox.",
  formTitle: "Newsletter Sign Up",
  formSubtitle: "Get updates tailored to your company and the ecosystems you care about.",
  successTitle: "You're in.",
  successBody:
    "Welcome to a community of 130,000+ readers across venture capital, institutional finance, protocol teams, and market professionals.",
  ctaText: "Subscribe",
  privacyText: "We respect your privacy. Unsubscribe at any time.",
  networks: [
    { name: "Aptos", logo: "/Aptos.png" },
    { name: "Avalanche", logo: "/Avalanche_Logomark_Red.svg" },
    { name: "Animecoin", logo: "/Animecoin.png" },
    { name: "Chainlink", logo: "/chainlink-link-logo.png" },
    { name: "Chiliz", logo: "/ChilizBlockchain.png" },
    { name: "Core DAO", logo: "/core-dao-core-logo.svg" },
    { name: "DeCharge" },
    { name: "DeFi" },
    { name: "Ethereum", logo: "/ethereum-eth-logo.svg" },
    { name: "Flow", logo: "/images.png" },
    { name: "Hedera", logo: "/images-1.png" },
    { name: "Injective", logo: "/injnew.png" },
    { name: "Matchain" },
    { name: "Mezo", logo: "/Mezo Logo Circle.png" },
    { name: "Movement Network", logo: "/Movement.jpg" },
    { name: "Optimism" },
    { name: "Polygon", logo: "/polygon-matic-logo.svg" },
    { name: "Ripple", logo: "/MyH2IKhR_400x400.jpg" },
    { name: "Sei", logo: "/sei_red_symbol.svg" },
    { name: "Solana", logo: "/Solana Logomark - Color.svg" },
    { name: "Stablecoins" },
    { name: "The Root Network" },
    { name: "Token Relations" },
    { name: "The Market Runup", logo: "/MarketRunup.png" },
    { name: "Talking Tokens", logo: "/TalkingTokens.jpg" },
    { name: "Tokenization" },
  ],
}

/** Client-safe: reads NEXT_PUBLIC_* inlined at build. */
export function getClientPublicSubscribeConfig(): SubscribePageConfig {
  const base = DEFAULT_SUBSCRIBE_PAGE_CONFIG
  return {
    ...base,
    heroTitle: process.env.NEXT_PUBLIC_HERO_TITLE?.trim() || base.heroTitle,
    heroSubtitle: process.env.NEXT_PUBLIC_HERO_SUBTITLE?.trim() || base.heroSubtitle,
    formTitle: process.env.NEXT_PUBLIC_FORM_TITLE?.trim() || base.formTitle,
    formSubtitle: process.env.NEXT_PUBLIC_FORM_SUBTITLE?.trim() || base.formSubtitle,
    successTitle: process.env.NEXT_PUBLIC_SUCCESS_TITLE?.trim() || base.successTitle,
    successBody: process.env.NEXT_PUBLIC_SUCCESS_BODY?.trim() || base.successBody,
    ctaText: process.env.NEXT_PUBLIC_CTA_TEXT?.trim() || base.ctaText,
    privacyText: process.env.NEXT_PUBLIC_PRIVACY_TEXT?.trim() || base.privacyText,
  }
}

export function getEmbedHeaderCopy(): { title: string; subtitle: string } {
  const baseTitle = DEFAULT_SUBSCRIBE_PAGE_CONFIG.heroTitle
  const baseSubtitle = DEFAULT_SUBSCRIBE_PAGE_CONFIG.heroSubtitle
  return {
    title: process.env.NEXT_PUBLIC_EMBED_TITLE?.trim() || baseTitle,
    subtitle: process.env.NEXT_PUBLIC_EMBED_SUBTITLE?.trim() || baseSubtitle,
  }
}

export function getLogoCdnOrigin(): string {
  return process.env.NEXT_PUBLIC_LOGO_CDN_ORIGIN?.replace(/\/$/, "") || ""
}

export function resolveNetworkLogoSrc(logo: string | undefined, logoCdnOrigin: string): string | undefined {
  if (!logo) return undefined
  if (logo.startsWith("http://") || logo.startsWith("https://")) return logo
  if (logoCdnOrigin && logo.startsWith("/")) return `${logoCdnOrigin}${logo}`
  return logo
}
