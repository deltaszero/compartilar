'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@/context/userContext'
import LoadingPage from '@/app/components/LoadingPage'

function LoginRedirectContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl')
  const { user, userData, loading } = useUser()

  useEffect(() => {
    // We need to wait for userData to be loaded
    if (loading) return
    
    // If we have a user and userData with username, redirect to their home page
    if (user && userData?.username) {
      router.push(`/${userData.username}/home`)
    } else if (user) {
      // If we have a user but no userData yet, wait a bit longer
      // This handles the case where Firebase auth is faster than Firestore
      const timeout = setTimeout(() => {
        // If we still don't have userData, use the callback URL or default to /
        if (callbackUrl) {
          router.push(callbackUrl)
        } else {
          router.push('/')
        }
      }, 2000)
      
      return () => clearTimeout(timeout)
    } else {
      // No user, redirect back to login
      router.push('/login')
    }
  }, [callbackUrl, router, user, userData, loading])

  return (
    <LoadingPage />
  )
}

export default function LoginRedirect() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <LoginRedirectContent />
    </Suspense>
  )
}