'use client'
import dynamic from 'next/dynamic'

const MotionProvider = dynamic(() => import('./MotionProvider'), { ssr: false })

export default function ClientMotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionProvider>{children}</MotionProvider>
}
