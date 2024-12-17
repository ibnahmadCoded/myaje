'use client';

import React, { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { Brain, ArrowRight, Users, Zap, Building2, Clock, Check, X, HelpCircle, PackageSearch, Shield, Building, Landmark } from 'lucide-react';

// Enhanced HeroStats with better design
const HeroStats = () => (
  <div className="absolute -bottom-12 -right-12 bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-green-100 transform hover:scale-105 transition-all duration-300">
    <div className="grid grid-cols-2 gap-8">
      <div className="text-center">
        <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">99.9%</div>
        <div className="text-sm text-gray-600 font-medium mt-1">Uptime</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">2.5x</div>
        <div className="text-sm text-gray-600 font-medium mt-1">ROI</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">10k+</div>
        <div className="text-sm text-gray-600 font-medium mt-1">Users</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">95%</div>
        <div className="text-sm text-gray-600 font-medium mt-1">Satisfaction</div>
      </div>
    </div>
  </div>
);

// Enhanced Hero Section with 3D-like elements
const HeroSection = () => (
  <div className="relative">
    <div className="absolute bg-gradient-to-br from-green-100/50 to-amber-100/50 opacity-50" />
    <div className="absolute">
      <div className="absolute bg-[radial-gradient(circle_at_center,rgba(104,211,145,0.15)_0%,rgba(255,255,255,0)_100%)]" />
    </div>
    <div className="relative">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center px-4 py-2 bg-green-100 rounded-full text-green-700 text-sm font-medium">
            <Zap className="h-4 w-4 mr-2" />
            Trusted by small and medium businesses worldwide
          </div>
          <h1 className="text-6xl font-bold text-green-800 leading-tight">
            Empower Your Business with{' '}
            <span className="relative inline-block">
              Smart Solutions
              <div className="absolute -bottom-2 left-0 right-0 h-3 bg-amber-200/50 -rotate-2 transform" />
            </span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Manage your inventory, streamline operations, and grow your sales 
            with our all-in-one platform. From smart storefronts to automated 
            accounting, we have everything your business needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="px-8 py-4 bg-green-700 text-white rounded-xl hover:bg-green-600 transition-all duration-300 flex items-center justify-center group shadow-lg shadow-green-700/20">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-4 bg-white text-green-700 rounded-xl hover:bg-green-50 transition-all duration-300 flex items-center justify-center border border-green-200">
              Learn More
            </button>
          </div>
        </div>
        <div className="relative">
          <HeroIllustration />
          <HeroStats />
        </div>
      </div>
    </div>
  </div>
);

// Hero Section SVG
const HeroIllustration = () => (
  <svg viewBox="0 0 600 400" className="w-full h-full rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-300">
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style={{ stopColor: '#34D399', stopOpacity: 0.2 }} />
        <stop offset="100%" style={{ stopColor: '#FCD34D', stopOpacity: 0.2 }} />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="600" height="400" fill="url(#grad1)" rx="20" />
    <circle cx="300" cy="200" r="80" fill="#34D399" fillOpacity="0.3" />
    <path d="M250 180 Q300 120 350 180 T450 180" stroke="#059669" strokeWidth="4" fill="none" />
    <rect x="150" y="250" width="300" height="40" fill="#059669" fillOpacity="0.1" rx="8" />
    <rect x="150" y="300" width="200" height="40" fill="#059669" fillOpacity="0.1" rx="8" />
  </svg>
);

// Enhanced MetricCard with better animation and design
const MetricCard = ({ value, label, icon: Icon }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className={`bg-white/90 backdrop-blur-sm p-8 rounded-2xl text-center transform transition-all duration-700 hover:scale-105 border border-green-100 ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
    }`}>
      <div className="relative">
        <div className="absolute -inset-4 bg-green-100 rounded-full opacity-20" />
        <Icon className="h-10 w-10 text-green-600 mx-auto mb-4 relative" />
      </div>
      <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent mb-2">{value}</div>
      <div className="text-sm text-gray-600 font-medium">{label}</div>
    </div>
  );
};

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
    },
    banking: {
      iconName: 'Building',
      title: "Business Banking",
      description: "Integrated banking solutions for your business",
      details: [
        {
          title: "Smart Banking",
          description: "Comprehensive banking solutions",
          benefits: [
            "Business accounts",
            "Payment processing",
            "Multi-currency support",
            "International transfers"
          ]
        },
        {
          title: "Financial Tools",
          description: "Advanced banking features",
          benefits: [
            "Expense cards",
            "Automated reconciliation",
            "Payment scheduling",
            "Integration with accounting"
          ]
        }
      ]
    },
    financing: {
      iconName: 'Landmark',
      title: "Business Financing",
      description: "Flexible financing solutions for growth",
      details: [
        {
          title: "Invoice Financing",
          description: "Get paid early on your invoices",
          benefits: [
            "Same-day funding",
            "Competitive rates",
            "No collateral required",
            "Simple application"
          ]
        },
        {
          title: "Business Loans",
          description: "Growth capital for your business",
          benefits: [
            "Flexible terms",
            "Quick approval",
            "Custom payment plans",
            "No hidden fees"
          ]
        }
      ]
    }
  };

  const plans = [
    {
      name: "Free Plan",
      price: "₦0",
      description: "Perfect for individuals just starting their business journey",
      icon: <PackageSearch className="w-8 h-8 text-green-600" />,
      popular: false,
      features: {
        users: "1 user",
        inventory: true,
        storefront: true,
        invoicing: false,
        support: false,
        restocking: false,
        payment: true,
        delivery: "Pay per trip",
        financing: false,
        accounting: false,
        banking: true,
        analytics: false,
        sms: false
      }
    },
    {
      name: "Basic Plan",
      price: "₦10,000",
      description: "Great for small businesses looking to grow",
      icon: <Users className="w-8 h-8 text-green-600" />,
      popular: false,
      features: {
        users: "1 user",
        inventory: true,
        storefront: true,
        invoicing: true,
        support: false,
        restocking: true,
        payment: true,
        delivery: "Pay per trip",
        financing: false,
        accounting: false,
        banking: true,
        analytics: false,
        sms: false
      }
    },
    {
      name: "Small Plan",
      price: "₦50,000",
      description: "Perfect for growing businesses with a small team",
      icon: <Clock className="w-8 h-8 text-green-600" />,
      popular: true,
      features: {
        users: "3 users",
        inventory: true,
        storefront: true,
        invoicing: true,
        support: "Chat support",
        restocking: true,
        payment: true,
        delivery: "3 deliveries/month",
        financing: false,
        accounting: false,
        banking: true,
        analytics: false,
        sms: true
      }
    },
    {
      name: "Medium Plan",
      price: "₦250,000",
      description: "Ideal for established businesses seeking growth",
      icon: <Shield className="w-8 h-8 text-green-600" />,
      popular: false,
      features: {
        users: "5 users",
        inventory: true,
        storefront: true,
        invoicing: true,
        support: "Chat & call support",
        restocking: true,
        payment: true,
        delivery: "10 deliveries/month",
        financing: true,
        accounting: true,
        banking: true,
        analytics: false,
        sms: true
      }
    },
    {
      name: "Enterprise Plan",
      price: "Custom",
      description: "For large businesses requiring complete customization",
      icon: <Shield className="w-8 h-8 text-green-600" />,
      popular: false,
      features: {
        users: "Unlimited users",
        inventory: true,
        storefront: true,
        invoicing: true,
        support: "Dedicated support officer",
        restocking: true,
        payment: true,
        delivery: "Unlimited deliveries",
        financing: true,
        accounting: true,
        banking: true,
        analytics: true,
        sms: true
      }
    }
  ];

  const featureDescriptionsForPlan = {
    users: "The number of users supported",
    inventory: "Manage your stock levels, track items, and get low stock alerts",
    storefront: "Custom digital storefront to showcase your products online",
    invoicing: "Automatically generate and send professional invoices",
    support: "Access to customer support services",
    restocking: "Make requests to restock your existing products or stock a new product. Automated inventory replenishment suggestions",
    payment: "Accept various payment methods from customers",
    delivery: "Access to delivery services for your products",
    financing: "Get financing based on your invoice history",
    accounting: "Automated bookkeeping and financial reporting",
    banking: "Business banking services and account management",
    analytics: "Detailed business insights and performance reports",
    sms: "receive notifications via SMS messages. No need to always have internet connection to recive orders."
  };

  // Add Trusted By section data
  const trustedCompanies = [
    { name: "TechCorp", logo: "/api/placeholder/150/50" },
    { name: "Global Industries", logo: "/api/placeholder/150/50" },
    { name: "Innovation Ltd", logo: "/api/placeholder/150/50" },
    { name: "Future Systems", logo: "/api/placeholder/150/50" },
    { name: "Smart Solutions", logo: "/api/placeholder/150/50" },
    { name: "Digital Ventures", logo: "/api/placeholder/150/50" }
  ];

  const renderIcon = (iconName, props) => {
    const Icon = LucideIcons[iconName];
    return Icon ? <Icon {...props} /> : null;
  };

  // Company Logo Placeholder SVG
  const CompanyLogoPlaceholder = ({ name }) => (
    <div className="w-40 h-12 bg-gradient-to-r from-green-100 to-green-50 rounded-lg flex items-center justify-center group transition-all hover:scale-105">
      <Building2 className="w-6 h-6 text-green-600 mr-2 group-hover:scale-110 transition-transform" />
      <span className="text-green-700 font-medium">{name}</span>
    </div>
  );

  // Enhanced Tooltip styling
  const Tooltip = ({ content, children }) => (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="bg-gray-900 text-white p-3 rounded-lg shadow-xl max-w-xs w-64">
          <div className="text-sm leading-relaxed">{content}</div>
        </div>
        <div className="w-3 h-3 bg-gray-900 transform rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-amber-50">
      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <HeroSection />
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-16 px-6 bg-gradient-to-b from-green-50/80 to-amber-50/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-12">
            Trusted By Industry Leaders
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
            {trustedCompanies.map((company, index) => (
              <CompanyLogoPlaceholder key={index} name={company.name} />
            ))}
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="py-16 px-6 bg-gradient-to-r from-green-100 to-amber-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <MetricCard value="95%" label="User Satisfaction" icon={Users} />
            <MetricCard value="30%" label="Efficiency Increase" icon={Zap} />
            <MetricCard value="500+" label="Enterprise Clients" icon={Building2} />
            <MetricCard value="24/7" label="AI Support" icon={Clock} />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">

        {/* Features Grid */}
        <section id="features" className="pt-32 px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-green-700 to-green-500 bg-clip-text text-transparent mb-4">
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
                className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-green-100 hover:border-green-200 shadow-sm hover:shadow-lg transition-all duration-300 text-left group"
              >
                <div className="flex items-center gap-4 mb-4">
                  {renderIcon(feature.iconName, {
                    size: 32,
                    className: "text-green-600 group-hover:scale-110 transition-transform duration-300"
                  })}
                  <h3 className="text-lg font-semibold group-hover:text-green-700 transition-colors">{feature.title}</h3>
                </div>
                <p className="text-gray-600 group-hover:text-gray-700 transition-colors">{feature.description}</p>
              </button>
            ))}
          </div>
        </section>

        {activeFeature && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-green-100 shadow-2xl">
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    {renderIcon(features[activeFeature].iconName, {
                      size: 40,
                      className: "text-green-600"
                    })}
                    <div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-green-700 to-green-500 bg-clip-text text-transparent">
                        {features[activeFeature].title}
                      </h2>
                      <p className="text-gray-600 text-lg">{features[activeFeature].description}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveFeature(null)}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-8">
                  {features[activeFeature].details.map((detail, index) => (
                    <div key={index} className="bg-gradient-to-r from-green-50 to-amber-50/30 p-8 rounded-xl border border-green-100">
                      <h3 className="text-xl font-semibold mb-3 text-green-700">{detail.title}</h3>
                      <p className="text-gray-600 mb-6 text-lg">{detail.description}</p>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {detail.benefits.map((benefit, benefitIndex) => (
                          <li key={benefitIndex} className="flex items-center gap-3 group">
                            <div className="w-2 h-2 rounded-full bg-green-600 group-hover:scale-150 transition-transform" />
                            <span className="text-gray-700 group-hover:text-green-700 transition-colors">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex justify-end space-x-4">
                  <button
                    onClick={() => setActiveFeature(null)}
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 transition-colors font-medium"
                  >
                    Close
                  </button>
                  <button
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 rounded-xl text-white transition-colors font-medium"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Pricing Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-green-700 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Scale your business with our flexible pricing options. All plans include core features to help you grow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {plans.map((plan) => (
              <div 
                key={plan.name} 
                className={`bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all relative ${
                  plan.popular ? 'border-2 border-green-600' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className="mx-auto mb-4">{plan.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <p className="text-gray-600 min-h-12">{plan.description}</p>
                  <div className="mt-4">
                    <div className="text-3xl font-bold text-green-700">{plan.price}</div>
                    {plan.price !== "Custom" && plan.price !== "Free" && (
                      <div className="text-sm text-gray-500">per month</div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  {Object.entries(plan.features).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 text-gray-700">
                      {typeof value === 'boolean' ? (
                        value ? (
                          <Check className="text-green-600" size={20} />
                        ) : (
                          <X className="text-gray-300" size={20} />
                        )
                      ) : (
                        <Check className="text-green-600" size={20} />
                      )}
                      <div className="flex items-center gap-1">
                        <span className="capitalize">
                          {typeof value === 'string' ? value : key.replace(/_/g, ' ')}
                        </span>
                        <Tooltip 
                          content={featureDescriptionsForPlan[key]}
                        >
                          <HelpCircle size={14} className="text-gray-400 hover:text-gray-600 transition-colors" />
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  className={`w-full py-3 px-4 rounded-lg transition-colors ${
                    plan.popular 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-white text-green-600 border-2 border-green-600 hover:bg-green-50'
                  }`}
                >
                  {plan.price === "Custom" ? "Contact Sales" : "Get Started"}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600">
              Need help choosing the right plan?{' '}
              <button className="text-green-600 font-medium hover:underline">
                Contact our sales team
              </button>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6 mt-24">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <Brain className="h-8 w-8 text-green-400" />
              <span className="text-2xl font-bold">Myaje</span>
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
          <p>&copy; 2024 Myaje. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default BusinessFeatures;