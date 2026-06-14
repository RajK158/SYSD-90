import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Sysd 90 — Master System Design in 90 Days',
  description: 'A structured 90-day operating system for engineers. Follow a 12-week roadmap, track DSA progress, complete case studies, and become interview-ready.',
  keywords: ['system design', 'DSA', 'interview prep', 'LeetCode', '90 day challenge', 'software engineering'],
  openGraph: {
    title: 'Sysd 90 — Master System Design in 90 Days',
    description: 'The structured 90-day program to go from zero to interview-ready at top tech companies.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
      <body className="bg-[#0C0C0C] text-[#F0EDED] antialiased font-sans">
        {children}
      </body>
    </html>
  )
}
