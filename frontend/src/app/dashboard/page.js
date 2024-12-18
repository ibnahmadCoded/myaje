'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";


const DashboardPage = () => {
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ name: '', email: '', message: '' });
  const { toast } = useToast();

  useEffect(() => {
    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const updateDateTime = () => {
    const now = new Date();
    setCurrentDateTime(now.toLocaleString());
  };

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
      metrics: [
        { label: "Total Items", value: "1,234", trend: "+12%" },
        { label: "Low Stock", value: "12", trend: "-3%", status: "warning" },
        { label: "Out of Stock", value: "5", trend: "-2%", status: "danger" },
        { label: "Categories", value: "28", trend: "0%" }
      ]
    },
    {
      title: "Orders Status",
      icon: ShoppingCart,
      metrics: [
        { label: "New Orders", value: "45", trend: "+8%" },
        { label: "Processing", value: "23", trend: "+5%" },
        { label: "Shipped", value: "18", trend: "+12%" },
        { label: "Returns", value: "4", trend: "-1%", status: "warning" }
      ]
    },
    {
      title: "Restock Requests",
      icon: PackageOpen,
      metrics: [
        { label: "New Requests", value: "8", trend: "+3%" },
        { label: "In Progress", value: "12", trend: "+2%" },
        { label: "Fulfilled", value: "25", trend: "+15%" },
        { label: "Urgent", value: "3", trend: "-1%", status: "warning" }
      ]
    },
    {
      title: "Invoicing",
      icon: FileText,
      metrics: [
        { label: "Pending", value: "28", trend: "+5%" },
        { label: "Sent", value: "156", trend: "+12%" },
        { label: "Paid", value: "142", trend: "+18%" },
        { label: "Overdue", value: "14", trend: "-2%", status: "danger" }
      ]
    }
  ];

  const navigationShortcuts = [
    { icon: <LayoutGrid size={20} />, label: 'Dashboard', href: '/dashboard'},
    { icon: <Package size={20} />, label: 'Inventory', href: '/inventory'},
    { icon: <Store size={20} />, label: 'Storefront', href: '/storefront' },
    { icon: <NotebookIcon size={20} />, label: 'Invoicing', href: '/invoicing' },
    { icon: <PackageOpen size={20} />, label: 'Restock', href: '/restock' },
    { icon: <LineChart size={20} />, label: 'Accounting', href: '/accounting'}
  ];

  const handleFeedbackSubmit = () => {
    toast({
      title: "Feedback Submitted",
      description: "Thank you for your feedback! We'll get back to you soon.",
    });
    setShowFeedbackModal(false);
    setFeedbackForm({ name: '', email: '', message: '' });
  };

  const getTrendColor = (trend, status) => {
    if (status === 'danger') return 'text-red-600';
    if (status === 'warning') return 'text-yellow-600';
    return trend.startsWith('+') ? 'text-green-600' : trend === '0%' ? 'text-gray-600' : 'text-red-600';
  };

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
              "Success is not final, failure is not fatal: it is the courage to continue that counts."
            </p>
            <p className="text-sm text-gray-600 mt-2">— Winston Churchill</p>
          </CardContent>
        </Card>

        {/* GMV Card */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total GMV</p>
                <p className="text-3xl font-bold text-green-700">₦4,678,639.87</p>
              </div>
              <DollarSign className="h-12 w-12 text-green-500" />
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+12.5% from last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metricGroups.map((group, index) => (
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
                  {group.metrics.map((metric, idx) => (
                    <div key={idx} className="space-y-1">
                      <p className="text-sm text-gray-600">{metric.label}</p>
                      <div className="flex items-center space-x-2">
                        <span className="text-xl font-semibold">{metric.value}</span>
                        <span className={`text-sm ${getTrendColor(metric.trend, metric.status)}`}>
                          {metric.trend}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Business News */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Business News
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {businessNews.map((news, index) => (
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
          {navigationShortcuts.map((item, index) => (
            <Link key={index} href={item.href} className="block">
              <Card className="hover:bg-gray-50 cursor-pointer transition-colors duration-200">
                <CardContent className="p-4 text-center">
                  <div className="flex flex-col items-center">
                    {item.icon}
                    <span className="mt-2 text-sm font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {item.badge}
                      </span>
                    )}
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
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={feedbackForm.name}
                  onChange={(e) => setFeedbackForm({...feedbackForm, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={feedbackForm.email}
                  onChange={(e) => setFeedbackForm({...feedbackForm, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={feedbackForm.message}
                  onChange={(e) => setFeedbackForm({...feedbackForm, message: e.target.value})}
                  rows={4}
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