"use client"

import { useState } from "react"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import type { SubscribeNetworkOption } from "@/lib/subscribe-page-config"

const DEFAULT_NETWORKS: SubscribeNetworkOption[] = [
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
]

const DEFAULT_ROLES = [
  "C-Suite",
  "Developer",
  "FinTech",
  "Founder",
  "Investor / Fund",
  "Protocol Team",
  "Researcher / Analyst",
  "Trader",
]

const FormSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  email: z.string().email({
    message: "Please enter a valid business email address.",
  }),
  role: z.string().min(1, { message: "Please select your role." }),
  networks: z.array(z.string()).refine((value) => value.length > 0, {
    message: "You have to select at least one network.",
  }),
})

function resolveLogoSrc(logo: string | undefined, logoOrigin?: string): string | undefined {
  if (!logo) return undefined
  if (logo.startsWith("http://") || logo.startsWith("https://")) return logo
  if (logoOrigin?.trim()) {
    const base = logoOrigin.replace(/\/$/, "")
    const path = logo.startsWith("/") ? logo : `/${logo}`
    return `${base}${path}`
  }
  return logo
}

function NetworkLogo({
  src,
  alt,
  isSelected,
}: {
  src: string
  alt: string
  isSelected: boolean
}) {
  const cls = `w-5 h-5 object-contain rounded-sm shrink-0 ${isSelected ? "brightness-0 invert" : ""}`
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return <Image src={src} alt={alt} width={20} height={20} className={cls} unoptimized />
  }
  return <img src={src} alt={alt} width={20} height={20} className={cls} />
}

interface NewsletterSubscriptionFormProps {
  roles?: string[]
  networks?: SubscribeNetworkOption[]
  successTitle?: string
  successBody?: string
  ctaText?: string
  privacyText?: string
  logoOrigin?: string
}

export function NewsletterSubscriptionForm({
  roles = DEFAULT_ROLES,
  networks = DEFAULT_NETWORKS,
  successTitle = "You're in.",
  successBody = "Welcome to a community of 130,000+ readers across venture capital, institutional finance, protocol teams, and market professionals.",
  ctaText = "Subscribe",
  privacyText = "We respect your privacy. Unsubscribe at any time.",
  logoOrigin,
}: NewsletterSubscriptionFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      role: "",
      networks: [],
    },
  })

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setLoading(true)
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          role: data.role,
          subscribed_networks: data.networks,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to subscribe")
      }

      setSuccess(true)
      toast({
        title: "Subscribed!",
        description: "You have successfully subscribed to the selected newsletters.",
      })
      form.reset()
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{successTitle}</h3>
        <p className="text-gray-600 mb-1">{successBody}</p>
        <p className="text-sm text-gray-400 mt-3">Your first update is on its way.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input placeholder="" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input placeholder="" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@company.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What is your role?</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="networks"
              render={({ field }) => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">What are you interested in?</FormLabel>
                    <FormDescription>
                      Select the networks, newsletters, and updates you&apos;d like to follow.
                    </FormDescription>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {networks.map((network) => {
                      const isSelected = field.value?.includes(network.name)
                      const logoSrc = resolveLogoSrc(network.logo, logoOrigin)
                      return (
                        <button
                          key={network.name}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              field.onChange(field.value.filter((v) => v !== network.name))
                            } else {
                              field.onChange([...field.value, network.name])
                            }
                          }}
                          className={`
                            inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium
                            border transition-all duration-200 cursor-pointer
                            ${
                              isSelected
                                ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                                : "bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                            }
                          `}
                        >
                          {logoSrc && (
                            <NetworkLogo src={logoSrc} alt={network.name} isSelected={!!isSelected} />
                          )}
                          {network.name}
                        </button>
                      )
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.setValue("networks", networks.map((n) => n.name))
                }}
              >
                Select All
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {ctaText}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{privacyText}</p>
          </form>
        </Form>
      </div>
    </div>
  )
}
