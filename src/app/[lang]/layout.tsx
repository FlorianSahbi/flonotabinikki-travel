import { Geist, Geist_Mono } from 'next/font/google'
import '../styles/globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params

  return (
    <html lang={lang}>
      <body className={`${geist.variable} ${mono.variable}`}>{children}</body>
    </html>
  )
}
