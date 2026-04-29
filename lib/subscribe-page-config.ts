export interface SubscribeNetworkOption {
  name: string
  logo?: string
}

export interface SubscribePageCopy {
  heroTitle: string
  heroSubtitle: string
  formTitle: string
  formSubtitle: string
  successTitle: string
  successBody: string
  ctaText: string
  privacyText: string
  roles: string[]
  networks: SubscribeNetworkOption[]
}

export const DEFAULT_SUBSCRIBE_COPY: SubscribePageCopy = {
  heroTitle: "Stay Ahead as Markets Move",
  heroSubtitle: "Subscribe to receive investor updates and insights directly in your inbox.",
  formTitle: "Newsletter Sign Up",
  formSubtitle: "Get updates tailored to your role and the ecosystems you care about.",
  successTitle: "You're in.",
  successBody:
    "Welcome to a community of 130,000+ readers across venture capital, institutional finance, protocol teams, and market professionals.",
  ctaText: "Subscribe",
  privacyText: "We respect your privacy. Unsubscribe at any time.",
  roles: [
    "C-Suite",
    "Developer",
    "FinTech",
    "Founder",
    "Investor / Fund",
    "Protocol Team",
    "Researcher / Analyst",
    "Trader",
  ],
  networks: [
    { name: "Aptos", logo: "/Aptos.png" },
    { name: "Avalanche", logo: "/Avalanche_Logomark_Red.svg" },
    { name: "Animecoin", logo: "/Animecoin.png" },
    { name: "Chainlink", logo: "/chainlink-link-logo.png" },
    { name: "Chiliz", logo: "/ChilizBlockchain.png" },
    { name: "Core DAO", logo: "/core-dao-core-logo.svg" },
    { name: "DeFi" },
    { name: "Ethereum", logo: "/ethereum-eth-logo.svg" },
    { name: "Flow", logo: "/images.png" },
    { name: "Hedera", logo: "/images-1.png" },
    { name: "Injective", logo: "/injnew.png" },
    { name: "Mezo", logo: "/Mezo Logo Circle.png" },
    { name: "Movement Network", logo: "/Movement.jpg" },
    { name: "Polygon", logo: "/polygon-matic-logo.svg" },
    { name: "Ripple", logo: "/MyH2IKhR_400x400.jpg" },
    { name: "Sei", logo: "/sei_red_symbol.svg" },
    { name: "Solana", logo: "/Solana Logomark - Color.svg" },
    { name: "Stablecoins" },
    { name: "The Market Runup", logo: "/MarketRunup.png" },
    { name: "Talking Tokens", logo: "/TalkingTokens.jpg" },
    { name: "Tokenization" },
  ],
}
