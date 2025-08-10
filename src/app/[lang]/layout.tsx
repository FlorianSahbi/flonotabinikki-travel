import { Geist, Geist_Mono } from 'next/font/google'
import '../styles/globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { lang: string }
}) {
  return (
    <html lang={params.lang}>
      <body className={`${geist.variable} ${mono.variable}`}>{children}</body>
    </html>
  )
}
