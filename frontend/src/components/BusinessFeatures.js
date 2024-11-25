'use client';

import React, { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { Brain, ArrowRight } from 'lucide-react';

const HeroStats = () => (
  <div className="bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-green-100 transform hover:scale-105 transition-all duration-300">
    <div className="grid grid-cols-2 gap-8">
      <div className="text-center">
        <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">24/7</div>
        <div className="text-sm text-gray-600 font-medium mt-1">Support</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">10+</div>
        <div className="text-sm text-gray-600 font-medium mt-1">Features</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">99%</div>
        <div className="text-sm text-gray-600 font-medium mt-1">Accuracy</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">50k+</div>
        <div className="text-sm text-gray-600 font-medium mt-1">Users</div>
      </div>
    </div>
  </div>
);

const BusinessFeatures = () => {
  const [activeFeature, setActiveFeature] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Features data remains the same as in your original code
  const features = {
    inventory: {
      iconName: 'Package',
      title: "Inventory Management",
      description: "Smart stock tracking and management system",
      details: [
        {
          title: "Real-time Tracking",
          description: "Monitor stock levels across all locations in real-time",
          benefits: [
            "Automatic low stock alerts",
            "Predictive inventory forecasting",
            "Stock movement history",
            "Barcode/QR code scanning"
          ]
        },
        {
          title: "Smart Categorization",
          description: "Organize products with intelligent categorization",
          benefits: [
            "Custom attributes and tags",
            "Bulk product management",
            "Variant handling",
            "Category performance analytics"
          ]
        }
      ]
    },
    storefront: {
      iconName: 'Store',
      title: "Smart Storefront",
      description: "Professional online store with AI integration",
      details: [
        {
          title: "Professional Templates",
          description: "Beautiful, mobile-responsive store designs",
          benefits: [
            "Custom domain support",
            "Mobile optimization",
            "SEO-friendly structure",
            "Custom branding options"
          ]
        },
        {
          title: "AI-Powered Features",
          description: "Intelligent tools to boost sales",
          benefits: [
            "Product recommendations",
            "Dynamic pricing",
            "Customer behavior analysis",
            "Automated marketing"
          ]
        }
      ]
    },
    restocking: {
      iconName: 'RefreshCcw',
      title: "Next-Day Restocking",
      description: "Automated inventory replenishment service",
      details: [
        {
          title: "Smart Reordering",
          description: "AI-powered restock recommendations",
          benefits: [
            "Automated purchase orders",
            "Demand forecasting",
            "Seasonal adjustment",
            "Budget optimization"
          ]
        },
        {
          title: "Express Delivery",
          description: "Next-day delivery guarantee",
          benefits: [
            "Priority handling",
            "Real-time tracking",
            "Flexible delivery windows",
            "Quality guarantee"
          ]
        }
      ]
    },
    payments: {
      iconName: 'Wallet',
      title: "Payment Processing",
      description: "Secure and flexible payment solutions",
      details: [
        {
          title: "Multiple Payment Options",
          description: "Accept various payment methods",
          benefits: [
            "Credit/Debit cards",
            "Bank transfers",
            "Mobile money",
            "Payment links"
          ]
        }
      ]
    },
    accounting: {
      iconName: 'Calculator',
      title: "Automated Accounting",
      description: "Streamlined financial management",
      details: [
        {
          title: "Financial Tracking",
          description: "Comprehensive financial management",
          benefits: [
            "Automated bookkeeping",
            "Tax calculations",
            "Financial reports",
            "Expense tracking"
          ]
        }
      ]
    },
    invoicing: {
      iconName: 'Receipt',
      title: "Automatic Invoicing",
      description: "Professional invoice generation",
      details: [
        {
          title: "Smart Invoicing",
          description: "Automated invoice management",
          benefits: [
            "Customizable templates",
            "Recurring invoices",
            "Automatic reminders",
            "Payment tracking"
          ]
        }
      ]
    },
    logistics: {
      iconName: 'Truck',
      title: "Logistics & Delivery",
      description: "End-to-end delivery management",
      details: [
        {
          title: "Delivery Management",
          description: "Comprehensive delivery solutions",
          benefits: [
            "Route optimization",
            "Real-time tracking",
            "Delivery scheduling",
            "Proof of delivery"
          ]
        }
      ]
    },
    support: {
      iconName: 'Phone',
      title: "24/7 Customer Support",
      description: "Round-the-clock customer assistance",
      details: [
        {
          title: "Always Available",
          description: "Continuous support for your business",
          benefits: [
            "24/7 phone support",
            "Live chat assistance",
            "Email support",
            "Priority handling"
          ]
        }
      ]
    },
    ai: {
      iconName: 'Robot',
      title: "AI Integration",
      description: "Advanced AI tools for your storefront",
      details: [
        {
          title: "Smart Assistant",
          description: "AI-powered customer interaction",
          benefits: [
            "Instant customer responses",
            "Automated price negotiation",
            "Product recommendations",
            "Personalized experience"
          ]
        },
        {
          title: "Business Intelligence",
          description: "AI-driven insights and automation",
          benefits: [
            "Sales forecasting",
            "Customer behavior analysis",
            "Inventory optimization",
            "Pricing strategy"
          ]
        }
      ]
    },
    reports: {
      iconName: 'BarChart2',
      title: "Business Reports",
      description: "Comprehensive monthly analytics",
      details: [
        {
          title: "Monthly Analytics",
          description: "Detailed business performance insights",
          benefits: [
            "Sales analytics",
            "Customer insights",
            "Inventory reports",
            "Financial statements"
          ]
        }
      ]
    }
  };

  const renderIcon = (iconName, props) => {
    const Icon = LucideIcons[iconName];
    return Icon ? <Icon {...props} /> : null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-amber-50">
      

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {/* Features Grid */}
        <section id="features" className="pt-32 px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-green-700 mb-4">
              All-in-One Business Solutions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to manage and grow your business, all in one place.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Object.entries(features).map(([key, feature]) => (
              <button
                key={key}
                onClick={() => setActiveFeature(key)}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left group"
              >
                <div className="flex items-center gap-4 mb-4">
                  {renderIcon(feature.iconName, {
                    size: 32,
                    className: "text-green-600 group-hover:scale-110 transition-transform"
                  })}
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                </div>
                <p className="text-gray-600">{feature.description}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Feature Detail Modal */}
        {activeFeature && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    {renderIcon(features[activeFeature].iconName, {
                      size: 32,
                      className: "text-green-600"
                    })}
                    <div>
                      <h2 className="text-2xl font-bold">{features[activeFeature].title}</h2>
                      <p className="text-gray-600">{features[activeFeature].description}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveFeature(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-8">
                  {features[activeFeature].details.map((detail, index) => (
                    <div key={index} className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-xl font-semibold mb-2">{detail.title}</h3>
                      <p className="text-gray-600 mb-4">{detail.description}</p>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {detail.benefits.map((benefit, benefitIndex) => (
                          <li key={benefitIndex} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex justify-end space-x-4">
                  <button
                    onClick={() => setActiveFeature(null)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6 mt-24">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <Brain className="h-8 w-8 text-green-400" />
              <span className="text-2xl font-bold">Business Suite</span>
            </div>
            <p className="text-gray-400">
              Complete business management solution for modern enterprises.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Features</h3>
            <ul className="space-y-2 text-gray-400">
              <li>Inventory Management</li>
              <li>Smart Storefront</li>
              <li>Payment Processing</li>
              <li>Business Reports</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-gray-400">
              <li>About Us</li>
              <li>Careers</li>
              <li>Blog</li>
              <li>Contact</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-gray-400">
              <li>Help Center</li>
              <li>Documentation</li>
              <li>API Reference</li>
              <li>Status</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
          <p>&copy; 2024 Business Suite. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default BusinessFeatures;