import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DATA UPLOAD PORTAL",
  description: "National Open Data Portal - Pakistan Institute of Education",
  icons: {
    icon: "/pie-logo.png",
    shortcut: "/pie-logo.png",
    apple: "/pie-logo.png",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/pie-logo.png" />
        <link rel="shortcut icon" type="image/png" href="/pie-logo.png" />
        <link rel="apple-touch-icon" type="image/png" href="/pie-logo.png" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        <div className="relative">
          {children}
        </div>
      </body>
    </html>
  )
}
