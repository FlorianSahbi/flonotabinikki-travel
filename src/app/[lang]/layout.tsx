// @path: src/app/[lang]/layout.tsx
import { Geist, Geist_Mono } from 'next/font/google'
import '../../shared/styles/globals.css'
import GlobalMenu from '@/shared/ui/GlobalMenu'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const resolvedParams = await params
  const { lang } = resolvedParams

  return (
    <html lang={lang}>
      <body className={`${geist.variable} ${mono.variable}`}>
        <GlobalMenu />
        {children}
      </body>
    </html>
  )
}
