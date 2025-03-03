'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@/context/userContext'
import LoadingPage from '@/app/components/LoadingPage'

export default function LoginRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/chat'
  const { user, userData, loading } = useUser()

  useEffect(() => {
    // We need to wait for userData to be loaded
    if (loading) return
    
    // If we have a user and userData with username, redirect to their area
    if (user && userData?.username) {
      router.push(`/${userData.username}`)
    } else if (user) {
      // If we have a user but no userData yet, wait a bit longer
      // This handles the case where Firebase auth is faster than Firestore
      const timeout = setTimeout(() => {
        router.push(callbackUrl)
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