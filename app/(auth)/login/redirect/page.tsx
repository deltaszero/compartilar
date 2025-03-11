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
    
    // Verify the user is authenticated and has a valid token
    const verifyAuth = async () => {
      if (user) {
        try {
          // Get a fresh token to ensure we have the latest claims
          // This is a security measure to ensure token is valid
          await user.getIdToken(true)
          
          // Check if we have user data with username
          if (userData?.username) {
            // User is fully authenticated and has a profile, go to home
            router.push(`/${userData.username}/home`)
          } else {
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
          }
        } catch (error) {
          console.error('Auth verification failed:', error)
          // Token refresh failed, send user back to login
          router.push('/login')
        }
      } else {
        // No user, redirect back to login
        router.push('/login')
      }
    }
    
    verifyAuth()
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