'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  useEffect(() => {
    // We'll use this to handle redirections after login
    // This assumes the user is already authenticated at this point
    
    // You can add additional logic here if needed:
    // - Check if user profile is complete
    // - Check user roles for conditional redirects
    // - Show loading state

    // For now, just redirect to the callback URL
    router.push(callbackUrl)
  }, [callbackUrl, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecionando...</h1>
        <p>Você será redirecionado em instantes.</p>
      </div>
    </div>
  )
}