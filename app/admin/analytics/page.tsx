'use client';

import React from 'react';
import { useUser } from '@context/userContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AnalyticsDashboard from '@/app/components/AnalyticsDashboard';
import Analytics from '@/app/components/Analytics';

export default function AdminAnalyticsPage() {
  const { user, userData, loading } = useUser();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login'); // Redirect to login if not authenticated
      } else {
        // Check if user is admin (you might have a different way to determine this)
        const checkAdmin = async () => {
          try {
            // For this example, we're checking if the email contains "admin"
            // In a real application, you should have proper admin role management
            if (userData && userData.email && (
              userData.email.includes('admin') || 
              // userData.email === 'admin@compartilar.com.br'
              userData.email === 'duartesthiago@gmail.com'
            )) {
              setIsAdmin(true);
            } else {
              router.push('/'); // Redirect to home if not admin
            }
          } catch (error) {
            console.error('Error checking admin status:', error);
            router.push('/');
          } finally {
            setPageLoading(false);
          }
        };
        
        checkAdmin();
      }
    }
  }, [user, userData, loading, router]);

  if (loading || pageLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // This will never render due to the redirect, but TypeScript requires it
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Analytics /> {/* To track admin dashboard views */}
      
      <h1 className="text-3xl font-bold mb-8">CompartiLar Analytics Dashboard</h1>
      
      <div className="bg-base-100 p-6 rounded-lg shadow">
        <AnalyticsDashboard />
      </div>
    </div>
  );
}