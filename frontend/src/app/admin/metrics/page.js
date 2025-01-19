'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/admin/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
    Users, 
    ShoppingBag, 
    DollarSign, 
    Package, 
    FileText,
    CreditCard,
    AlertTriangle,
    CheckCircle,
    RefreshCw,
  } from 'lucide-react';
import { apiBaseUrl } from '@/config';

export default function AdminMetrics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const fetchMetrics = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBaseUrl}/admin/metrics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }
      
      if (!response.ok) throw new Error('Failed to fetch metrics');
      
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to load admin metrics, ${error}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, router]);

  useEffect(() => {
    fetchMetrics();
    // Refresh metrics every 5 minutes
    const metricsTimer = setInterval(fetchMetrics, 300000);
    return () => clearInterval(metricsTimer);
  }, [fetchMetrics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  const getTrendColor = (trend) => {
    if (!trend || trend === 'N/A') return 'text-gray-600';
    return trend.startsWith('+') ? 'text-green-600' : 'text-red-600';
  };

  const getStatusColor = (status) => {
    if (!status) return 'text-gray-600';
    switch (status) {
      case 'danger': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'normal': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Platform Metrics</h1>
        </div>

        {/* Users Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              User Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics?.users && Object.entries(metrics.users).map(([key, data]) => (
              <div key={key} className="space-y-1">
                <p className="text-sm text-gray-600">{key.replace('_', ' ').toUpperCase()}</p>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-semibold">{data.value}</span>
                  <span className={`text-sm ${getTrendColor(data.trend)}`}>
                    {data.trend}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Platform Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Platform Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics?.platform && (
              <>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">TOTAL GMV</p>
                  <p className="text-2xl font-semibold">
                    ₦{metrics.platform.total_gmv.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">MONTHLY GMV</p>
                  <p className="text-2xl font-semibold">
                    ₦{metrics.platform.monthly_gmv.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">TOTAL ORDERS</p>
                  <p className="text-2xl font-semibold">
                    {metrics.platform.total_orders.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">CONVERSION RATE</p>
                  <p className="text-2xl font-semibold">
                    {metrics.platform.conversion_rate}%
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Inventory Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Inventory Health
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics?.inventory && Object.entries(metrics.inventory).map(([key, data]) => (
              <div key={key} className="space-y-1">
                <p className="text-sm text-gray-600">{key.replace('_', ' ').toUpperCase()}</p>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-semibold">{data.value}</span>
                  {data.trend && (
                    <span className={`text-sm ${getTrendColor(data.trend)}`}>
                      {data.trend}
                    </span>
                  )}
                  {data.status && (
                    <span className={`text-sm ${getStatusColor(data.status)}`}>
                      {data.status === 'danger' ? <AlertTriangle className="h-4 w-4" /> :
                       data.status === 'normal' ? <CheckCircle className="h-4 w-4" /> :
                       <AlertTriangle className="h-4 w-4" />}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Financial Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5" />
              Financial Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics?.financial && Object.entries(metrics.financial).map(([key, data]) => (
              <div key={key} className="space-y-1">
                <p className="text-sm text-gray-600">{key.replace('_', ' ').toUpperCase()}</p>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-semibold">
                  {typeof data === 'object' ? data.value : 
                     key.includes('revenue') ? `₦${data.toLocaleString()}` : 
                     data.toLocaleString()}
                  </span>
                  {data.trend && (
                    <span className={`text-sm ${getTrendColor(data.trend)}`}>
                      {data.trend}
                    </span>
                  )}
                  {data.status && (
                    <span className={`text-sm ${getStatusColor(data.status)}`}>
                      {data.status === 'danger' ? <AlertTriangle className="h-4 w-4" /> :
                       data.status === 'normal' ? <CheckCircle className="h-4 w-4" /> :
                       <AlertTriangle className="h-4 w-4" />}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Invoice Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Invoice Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics?.invoices && Object.entries(metrics.invoices).map(([key, data]) => (
              <div key={key} className="space-y-1">
                <p className="text-sm text-gray-600">{key.replace(/_/g, ' ').toUpperCase()}</p>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-semibold">
                    {typeof data === 'object' ? 
                      (key.includes('volume') ? `₦${data.toLocaleString()}` : data.value) : 
                      (key.includes('rate') ? `${data}%` : data.toLocaleString())}
                  </span>
                  {data.trend && (
                    <span className={`text-sm ${getTrendColor(data.trend)}`}>
                      {data.trend}
                    </span>
                  )}
                  {data.status && (
                    <span className={`text-sm ${getStatusColor(data.status)}`}>
                      {data.status === 'danger' ? <AlertTriangle className="h-4 w-4" /> :
                       data.status === 'normal' ? <CheckCircle className="h-4 w-4" /> :
                       <AlertTriangle className="h-4 w-4" />}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Payment Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              Payment Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics?.payments && Object.entries(metrics.payments).map(([key, data]) => (
              <div key={key} className="space-y-1">
                <p className="text-sm text-gray-600">{key.replace(/_/g, ' ').toUpperCase()}</p>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-semibold">
                    {typeof data === 'object' ? 
                      (key.includes('volume') ? `₦${data.toLocaleString()}` : data.value) : 
                      (key.includes('rate') ? `${data}%` : data.toLocaleString())}
                  </span>
                  {data.trend && (
                    <span className={`text-sm ${getTrendColor(data.trend)}`}>
                      {data.trend}
                    </span>
                  )}
                  {data.status && (
                    <span className={`text-sm ${getStatusColor(data.status)}`}>
                      {data.status === 'danger' ? <AlertTriangle className="h-4 w-4" /> :
                       data.status === 'normal' ? <CheckCircle className="h-4 w-4" /> :
                       <AlertTriangle className="h-4 w-4" />}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Restock Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <RefreshCw className="mr-2 h-5 w-5" />
              Restock Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics?.restock && Object.entries(metrics.restock).map(([key, data]) => (
              <div key={key} className="space-y-1">
                <p className="text-sm text-gray-600">{key.replace(/_/g, ' ').toUpperCase()}</p>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-semibold">{data.value}</span>
                  {data.trend && (
                    <span className={`text-sm ${getTrendColor(data.trend)}`}>
                      {data.trend}
                    </span>
                  )}
                  {data.status && (
                    <span className={`text-sm ${getStatusColor(data.status)}`}>
                      {data.status === 'danger' ? <AlertTriangle className="h-4 w-4" /> :
                       data.status === 'normal' ? <CheckCircle className="h-4 w-4" /> :
                       <AlertTriangle className="h-4 w-4" />}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}