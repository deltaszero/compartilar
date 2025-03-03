'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, /* limit, */ Timestamp } from 'firebase/firestore';
import { db } from '@/app/lib/firebaseConfig';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface AnalyticsData {
  visitorsByDevice: { [key: string]: number };
  pageViews: { [key: string]: number };
  conversionRate: number;
  eventCounts: { [key: string]: number };
  ctaClicks: { [key: string]: number };
  featureInteractions: { [key: string]: number };
  timeRange: string;
}

interface Event {
  eventName: string;
  count: number;
  params?: Record<string, string | number | boolean | null | undefined>;
  timestamp: Timestamp;
}

const AnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    visitorsByDevice: {},
    pageViews: {},
    conversionRate: 0,
    eventCounts: {},
    ctaClicks: {},
    featureInteractions: {},
    timeRange: '7d'
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyticsData = async (range: string = '7d') => {
    setLoading(true);
    setError(null);
    
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (range) {
        case '1d':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 7);
      }

      // Create Firestore timestamps
      const startTimestamp = Timestamp.fromDate(startDate);
      const endTimestamp = Timestamp.fromDate(endDate);

      // Query analytics events collection
      const eventsQuery = query(
        collection(db, 'analytics_events'),
        where('timestamp', '>=', startTimestamp),
        where('timestamp', '<=', endTimestamp),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(eventsQuery);
      const events: Event[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        events.push({
          eventName: data.event_name,
          count: 1,
          params: data.params,
          timestamp: data.timestamp
        });
      });

      // Process events data
      const visitorsByDevice: { [key: string]: number } = {};
      const pageViews: { [key: string]: number } = {};
      const eventCounts: { [key: string]: number } = {};
      const ctaClicks: { [key: string]: number } = {};
      const featureInteractions: { [key: string]: number } = {};
      
      let signupEvents = 0;
      let ctaEvents = 0;

      events.forEach(event => {
        // Count events
        eventCounts[event.eventName] = (eventCounts[event.eventName] || 0) + 1;
        
        // Process by event type
        if (event.eventName === 'page_view') {
          const deviceType = String(event.params?.device_type || 'unknown');
          visitorsByDevice[deviceType] = (visitorsByDevice[deviceType] || 0) + 1;
          
          const pagePath = String(event.params?.page_path || 'unknown');
          pageViews[pagePath] = (pageViews[pagePath] || 0) + 1;
        }
        
        if (event.eventName === 'cta_click') {
          ctaEvents++;
          const ctaId = String(event.params?.cta_id || 'unknown');
          ctaClicks[ctaId] = (ctaClicks[ctaId] || 0) + 1;
        }
        
        if (event.eventName === 'feature_click') {
          const featureId = String(event.params?.feature_analytics_id || 'unknown');
          featureInteractions[featureId] = (featureInteractions[featureId] || 0) + 1;
        }
        
        if (event.eventName === 'sign_up') {
          signupEvents++;
        }
      });
      
      // Calculate conversion rate (signups / cta clicks)
      const conversionRate = ctaEvents > 0 ? (signupEvents / ctaEvents) * 100 : 0;

      setAnalyticsData({
        visitorsByDevice,
        pageViews,
        conversionRate,
        eventCounts,
        ctaClicks,
        featureInteractions,
        timeRange: range
      });
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);
  
  const handleTimeRangeChange = (range: string) => {
    fetchAnalyticsData(range);
  };

  // Prepare chart data
  const deviceData = {
    labels: Object.keys(analyticsData.visitorsByDevice),
    datasets: [
      {
        label: 'Visitors by Device',
        data: Object.values(analyticsData.visitorsByDevice),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const featuresData = {
    labels: Object.keys(analyticsData.featureInteractions),
    datasets: [
      {
        label: 'Feature Interactions',
        data: Object.values(analyticsData.featureInteractions),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="p-4 bg-white rounded shadow-md">
      <h2 className="text-2xl font-bold mb-4">Analytics Dashboard</h2>
      
      {/* Time range selector */}
      <div className="mb-6">
        <div className="flex space-x-2">
          {['1d', '7d', '30d', '90d'].map(range => (
            <button
              key={range}
              onClick={() => handleTimeRangeChange(range)}
              className={`px-3 py-1 rounded ${
                analyticsData.timeRange === range 
                  ? 'bg-primary text-primary-content' 
                  : 'bg-base-200'
              }`}
            >
              {range === '1d' ? 'Today' : range === '7d' ? 'Week' : range === '30d' ? 'Month' : '3 Months'}
            </button>
          ))}
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Summary cards */}
          <div className="stats shadow">
            <div className="stat">
              <div className="stat-title">Total Page Views</div>
              <div className="stat-value">{Object.values(analyticsData.pageViews).reduce((a, b) => a + b, 0)}</div>
            </div>
            
            <div className="stat">
              <div className="stat-title">Conversion Rate</div>
              <div className="stat-value">{analyticsData.conversionRate.toFixed(1)}%</div>
            </div>
          </div>
          
          {/* Device distribution chart */}
          <div className="bg-base-100 p-4 rounded-box shadow-md">
            <h3 className="text-lg font-medium mb-2">Device Distribution</h3>
            <div className="h-64 w-full">
              <Pie data={deviceData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
          
          {/* Feature interactions chart */}
          <div className="bg-base-100 p-4 rounded-box shadow-md">
            <h3 className="text-lg font-medium mb-2">Feature Interactions</h3>
            <div className="h-64 w-full">
              <Bar 
                data={featuresData} 
                options={{ 
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }} 
              />
            </div>
          </div>
          
          {/* Popular pages table */}
          <div className="bg-base-100 p-4 rounded-box shadow-md">
            <h3 className="text-lg font-medium mb-2">Popular Pages</h3>
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Page</th>
                    <th>Views</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(analyticsData.pageViews)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([page, views]) => (
                      <tr key={page}>
                        <td>{page}</td>
                        <td>{views}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* CTA clicks table */}
          <div className="bg-base-100 p-4 rounded-box shadow-md">
            <h3 className="text-lg font-medium mb-2">CTA Performance</h3>
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>CTA</th>
                    <th>Clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(analyticsData.ctaClicks)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cta, clicks]) => (
                      <tr key={cta}>
                        <td>{cta}</td>
                        <td>{clicks}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;