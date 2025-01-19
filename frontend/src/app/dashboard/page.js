'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import {
  LayoutGrid,
  Package,
  Store,
  NotebookIcon,
  PackageOpen,
  LineChart,
  MessageSquare,
  ExternalLink,
  DollarSign,
  FileText,
  TrendingUp,
  ShoppingCart,
  Boxes,
  Bookmark,
  Heart,
  StoreIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiBaseUrl } from '@/config';
import { useRouter } from 'next/navigation';


const DashboardPage = () => {
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    message: '' 
  });
  const { toast } = useToast();
  const router = useRouter();

  const updateDateTime = () => {
    const now = new Date();
    setCurrentDateTime(now.toLocaleString());
  };

  const fetchMetrics = useCallback(async (activeView = null) => {
    try {
      const token = localStorage.getItem('token'); // Or however you store your auth token
      const response = await fetch(`${apiBaseUrl}/dashboard/metrics?active_view=${activeView}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 401) {
        // Handle unauthorized access - maybe redirect to login
        router.push('/login');
        return;
      }
      
      if (!response.ok) throw new Error('Failed to fetch metrics');
      
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to load dashboard metrics, ${error}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, router, activeView]);

  useEffect(() => {
    const userDataStr = localStorage.getItem('user');
    let active_view = null;

    if (userDataStr) {
      const user = JSON.parse(userDataStr);
      active_view = user.active_view; // Ensure activeView is defined here
      setActiveView(active_view)
    }

    updateDateTime();
    fetchMetrics(active_view);
    
    const timer = setInterval(updateDateTime, 1000);
    // Refresh metrics every 5 minutes
    const metricsTimer = setInterval(fetchMetrics, 300000);
    
    return () => {
      clearInterval(timer);
      clearInterval(metricsTimer);
    };
  }, [fetchMetrics]);

  const businessNews = [
    {
      title: "Global Supply Chain Improvements",
      summary: "Major logistics companies report 30% faster delivery times globally."
    },
    {
      title: "E-commerce Growth Continues",
      summary: "Online retail sales projected to grow by 15% in the next quarter."
    },
    {
      title: "New Sustainability Standards",
      summary: "Industry leaders adopt new eco-friendly packaging requirements."
    }
  ];

  const metricGroups = [
    {
      title: "Inventory Overview",
      icon: Boxes,
      metricsKey: "inventory",
      metrics: [
        { label: "Total Items", key: "total_items" },
        { label: "Low Stock", key: "low_stock" },
        { label: "Out of Stock", key: "out_of_stock" },
        { label: "Categories", key: "categories" }
      ]
    },
    {
      title: "Orders Status",
      icon: ShoppingCart,
      metricsKey: "orders",
      metrics: [
        { label: "New Orders", key: "new_orders" },
        { label: "Processing", key: "processing" },
        { label: "Shipped", key: "shipped" },
        { label: "Returns", key: "returns" }
      ]
    },
    {
      title: "Restock Requests",
      icon: PackageOpen,
      metricsKey: "restock",
      metrics: [
        { label: "New Requests", key: "new_requests" },
        { label: "In Progress", key: "in_progress" },
        { label: "Fulfilled", key: "fulfilled" },
        { label: "Urgent", key: "urgent" }
      ]
    },
    {
      title: "Invoicing",
      icon: FileText,
      metricsKey: "invoicing",
      metrics: [
        { label: "Pending", key: "pending" },
        { label: "Sent", key: "sent" },
        { label: "Paid", key: "paid" },
        { label: "Overdue", key: "overdue" }
      ]
    }
  ];

  const getTrendColor = (metric) => {
    if (!metric) return 'text-gray-600';
    if (metric.status === 'danger') return 'text-red-600';
    if (metric.status === 'warning') return 'text-yellow-600';
    return metric.trend?.startsWith('+') ? 'text-green-600' : 
           metric.trend === '0%' ? 'text-gray-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  const navigationShortcuts = [
    { icon: <LayoutGrid size={20} />, label: 'Dashboard', href: '/dashboard'},
    { icon: <Package size={20} />, label: 'Inventory', href: '/inventory'},
    { icon: <Store size={20} />, label: 'Storefront', href: '/storefront' },
    { icon: <NotebookIcon size={20} />, label: 'Invoicing', href: '/invoicing' },
    { icon: <PackageOpen size={20} />, label: 'Restock', href: '/restock' },
    { icon: <LineChart size={20} />, label: 'Accounting', href: '/accounting'}
  ];

  const handleFeedbackSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBaseUrl}/feedback/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackForm),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      toast({
        title: "Success",
        description: "Thank you for your feedback! We'll get back to you soon.",
      });
      setShowFeedbackModal(false);
      setFeedbackForm({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to submit feedback. Please try again., ${error}`,
        variant: "destructive",
      });
    }
  };

  const personalMetricGroups = [
    {
      title: "Viewing Activity",
      icon: LineChart,
      metricsKey: "viewing",
      metrics: [
        { label: "Total Views", key: "total_views" }
      ]
    },
    {
      title: "Wishlists",
      icon: Package,
      metricsKey: "wishlist",
      metrics: [
        { label: "Total Wishlisted", key: "total_wishlisted" }
      ]
    },
    {
      title: "Reviews",
      icon: MessageSquare,
      metricsKey: "reviews",
      metrics: [
        { label: "Total Reviews", key: "total_reviews" }
      ]
    },
    {
      title: "Purchases",
      icon: ShoppingCart,
      metricsKey: "purchases",
      metrics: [
        { label: "Total Purchases", key: "total_purchases" }
      ]
    }
  ];

  const personalNews = [
    {
      title: "New Collection Launched",
      summary: "Check out the latest summer collection from your favorite brands."
    },
    {
      title: "Special Offers",
      summary: "Exclusive discounts on items in your wishlist."
    },
    {
      title: "Shopping Tips",
      summary: "How to make the most of seasonal sales and promotions."
    }
  ];

  const personalNavigationShortcuts = [
    { icon: <LayoutGrid size={20} />, label: 'Dashboard', href: '/dashboard' },
    { icon: <Package size={20} />, label: 'My Items', href: '/my-items' },
    { icon: <Bookmark size={20} />, label: 'My Orders', href: '/my-items' },
    { icon: <MessageSquare size={20} />, label: 'My Reviews', href: '/my-items' },
    { icon: <Heart size={20} />, label: 'My Wishlist', href: '/my-items' },
    { icon: <StoreIcon size={20} />, label: 'Marketplace', href: '/' }
  ];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome Back!</h1>
            <p className="text-gray-600">{currentDateTime}</p>
          </div>
          <Button onClick={() => setShowFeedbackModal(true)}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Contact Support
          </Button>
        </div>

        {/* Motivation Card */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
          <CardContent className="p-6">
            <p className="text-lg font-medium text-gray-800">
              Success is not final, failure is not fatal: it is the courage to continue that counts.
            </p>
            <p className="text-sm text-gray-600 mt-2">— Winston Churchill</p>
          </CardContent>
        </Card>

        {/* GMV Card */}
        {metrics?.gmv && (
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total GMV</p>
                  <p className="text-3xl font-bold text-green-700">
                    ₦{metrics.gmv.current_month_gmv.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                </div>
                <DollarSign className="h-12 w-12 text-green-500" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-600">
                  {metrics.gmv.growth_percentage > 0 ? '+' : ''}
                  {metrics.gmv.growth_percentage.toFixed(1)}% from last month
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(activeView === 'business' ? metricGroups : personalMetricGroups).map((group, index) => (
            <Card key={index}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center">
                    <group.icon className="h-5 w-5 mr-2" />
                    {group.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {group.metrics.map((metric, idx) => {
                    const metricData = metrics?.[group.metricsKey]?.[metric.key];
                    return (
                      <div key={idx} className="space-y-1">
                        <p className="text-sm text-gray-600">{metric.label}</p>
                        <div className="flex items-center space-x-2">
                          <span className="text-xl font-semibold">
                            {metricData?.value || '0'}
                          </span>
                          <span className={`text-sm ${getTrendColor(metricData)}`}>
                            {metricData?.trend || '0%'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* News Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              {activeView === 'business' ? 'Business News' : 'Shopping Updates'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(activeView === 'business' ? businessNews : personalNews).map((news, index) => (
              <div key={index} className="border-b last:border-0 pb-4 last:pb-0">
                <h3 className="font-medium flex items-center">
                  {news.title}
                  <ExternalLink className="ml-2 h-4 w-4 text-gray-400" />
                </h3>
                <p className="text-sm text-gray-600 mt-1">{news.summary}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Navigation Shortcuts */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {(activeView === 'business' ? navigationShortcuts : personalNavigationShortcuts).map((item, index) => (
            <Link key={index} href={item.href} className="block">
              <Card className="hover:bg-gray-50 cursor-pointer transition-colors duration-200">
                <CardContent className="p-4 text-center">
                  <div className="flex flex-col items-center">
                    {item.icon}
                    <span className="mt-2 text-sm font-medium">{item.label}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Feedback Modal */}
        <Dialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Contact Support</DialogTitle>
              <DialogDescription></DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={feedbackForm.name}
                  onChange={(e) => setFeedbackForm({...feedbackForm, name: e.target.value})}
                  placeholder="Your name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={feedbackForm.email}
                  onChange={(e) => setFeedbackForm({...feedbackForm, email: e.target.value})}
                  placeholder="your.email@example.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={feedbackForm.phone}
                  onChange={(e) => setFeedbackForm({...feedbackForm, phone: e.target.value})}
                  placeholder="Your phone number"
                />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={feedbackForm.message}
                  onChange={(e) => setFeedbackForm({...feedbackForm, message: e.target.value})}
                  rows={4}
                  placeholder="How can we help you?"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowFeedbackModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleFeedbackSubmit}>
                Submit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;