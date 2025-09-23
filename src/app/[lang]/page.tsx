// src/app/[lang]/page.tsx
import { redirect } from 'next/navigation'

export default function Page({ params }: { params: { lang: string } }) {
  // ici on est sur /fr (ou /en, /ja... mais ton middleware force "fr")
  redirect(`/${params.lang}/explore`)
}
