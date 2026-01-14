'use client'

import { usePathname } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdminPage = pathname?.startsWith('/admin')

  if (isAdminPage) {
    return <>{children}</>
  }

  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  )
}
