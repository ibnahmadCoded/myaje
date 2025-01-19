'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
    Building2, CreditCard, Clock, Wallet, Settings,
    ArrowDownCircle, ArrowUpCircle, BanknoteIcon} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from '@/components/DashboardLayout';
import { apiBaseUrl } from '@/config';
import { BankingTransactionsView } from '@/components/BankingTransactionsView'
import { FinancialsTab } from '@/components/FinancialsTab'
import { LoansTab } from '@/components/LoansTab'
import { AutomationTab } from '@/components/AutomationsTab'

const BankingPage = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const userDataStr = localStorage.getItem('user');
    if (userDataStr) {
      const user = JSON.parse(userDataStr);
      const onboardingKey = user.active_view === 'business'
        ? 'businessBankingOnboarded'
        : 'personalBankingOnboarded';
      const isOnboarded = localStorage.getItem(onboardingKey) === 'true';
      setShowOnboarding(!isOnboarded);
    }
  }, []);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [userData, setUserData] = useState(null);
  const [businessAccountDetails, setBusinessAccountDetails] = useState({
    accountName: '',
    accountNumber: '',
    accountType: 'Business',
    balance: 0,
    isActive: ''
  });
  const [personalAccountDetails, setPersonalAccountDetails] = useState({
    accountName: '',
    accountNumber: '',
    accountType: 'Individual',
    balance: 0,
    isActive: ''
  });
  const { toast } = useToast();

  const fetchAccountDetails = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/banking/accounts/${userData?.active_view === 'business' ? 'business' : 'personal'}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const accountData = await response.json();
        const mappedData = {
          accountName: accountData.account_name,
          accountNumber: accountData.account_number,
          accountType: accountData.account_type === 'personal' ? 'Individual' : 'Business',
          balance: accountData.balance,
          isActive: accountData.is_active,
        };

        if (userData?.active_view === 'business') {
          setBusinessAccountDetails(mappedData);
        } else {
          setPersonalAccountDetails(mappedData);
        }
      }
    } catch (error) {
      console.error('Error fetching account details:', error);
    }
  }, [userData]);

  useEffect(() => {
    if (userData) {
      fetchAccountDetails();
    }
  }, [fetchAccountDetails, userData]);
  
  useEffect(() => {
    const userDataStr = localStorage.getItem('user');
    if (userDataStr) {
      const parsedUser = JSON.parse(userDataStr);
      setUserData(parsedUser);
  
      const onboardingKey = parsedUser.active_view === 'business'
        ? 'businessBankingOnboarded'
        : 'personalBankingOnboarded';
  
      const onboardingCompleted = localStorage.getItem(onboardingKey) === 'true';
      if (onboardingCompleted) {
        setShowOnboarding(false);
      }
    }
  }, []); // Initial load

  // Get current account details based on active view
  const getCurrentAccountDetails = () => {
    return userData?.active_view === 'business' ? 
      businessAccountDetails : personalAccountDetails;
  };
  
  const OnboardingContent = () => {
    const [accountName, setAccountName] = useState(getCurrentAccountDetails()?.accountName || "");
    const [bvn, setBvn] = useState("");
    const [bvnError, setBvnError] = useState("");
    const accountDetails = getCurrentAccountDetails();
    const isBusinessView = userData?.active_view === 'business';

    const handleAccountNameChange = (e) => {
      setAccountName(e.target.value); 
    };

    const handleBvnChange = (e) => {
      const value = e.target.value;
      if (/^\d{0,11}$/.test(value)) {
        setBvn(value);
        setBvnError("");
      } else {
        setBvnError("BVN must be exactly 11 digits.");
      }
    };
  
    const validateInputs = () => {
      if (!isBusinessView && bvn.length !== 11) {
        setBvnError("BVN must be exactly 11 digits.");
        return false;
      }
      return true;
    };

    const handleOnboardingComplete = async () => {
      if (onboardingStep === 0) {
        if (!validateInputs()) return;

        // Call the backend immediately after the first step
        try {
          const accountResponse = await fetch(`${apiBaseUrl}/banking/accounts`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              account_name: userData.active_view === 'business' ? userData?.business_name : accountName,
              account_type: userData.active_view === 'business' ? 'business' : 'personal',
              bank_name: 'BAM Bank',
              bvn: bvn,
            })
          });
    
          if (!accountResponse.ok) throw new Error('Failed to create bank account');
    
          // Refresh account details immediately
          await fetchAccountDetails();
    
        } catch (error) {
          console.error('Error during onboarding step 1:', error);
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive"
          });
          return;
        }
      }
    
      if (onboardingStep < 2) {
        setOnboardingStep((prev) => prev + 1);
        return;
      }
    
      // Step 3 completion logic remains the same
      try {
        const onboardingResponse = await fetch(`${apiBaseUrl}/banking/update-banking-onboarding`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            view: userData.active_view
          })
        });
    
        if (!onboardingResponse.ok) throw new Error('Failed to update onboarding status');
    
        const onboardingKey = userData.active_view === 'business' ? 
          'businessBankingOnboarded' : 'personalBankingOnboarded';
        localStorage.setItem(onboardingKey, 'true');
        setShowOnboarding(false);
    
        toast({
          title: "Success",
          description: "BAM setup successfully completed",
        });
    
      } catch (error) {
        console.error('Error completing onboarding:', error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      }
    };
  
    const steps = [
      {
        title: "Welcome to BAM - The Myaje Banking Experience",
        description: "Let's get you started with your new banking experience",
        content: (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium">Your Account Details</p>
              <div className="mt-2 space-y-2">
                <p>Account Number: {isBusinessView ? "To be generated" : userData?.phone.replace(/[^0-9]/g, '')}</p>
                <p>Account Type: {accountDetails.accountType}</p>
              </div>
            </div>
            {!isBusinessView && (
              <div className="space-y-2">
                <Label>Account Name</Label>
                <Input
                  type="text"
                  value={accountName}
                  onChange={handleAccountNameChange}
                  placeholder="Enter your full name"
                  required
                />
                <Label>BVN</Label>
                <Input
                  type="text"
                  value={bvn}
                  onChange={handleBvnChange}
                  placeholder="Enter your 11-digit BVN"
                  maxLength={11}
                  required
                />
                {bvnError && <p className="text-red-500 text-sm">{bvnError}</p>}
              </div>
            )}

            {isBusinessView && (
              <div className="space-y-2">
                <Label>BVN</Label>
                <Input
                  type="text"
                  value={bvn}
                  onChange={handleBvnChange}
                  placeholder="Enter your 11-digit BVN"
                  maxLength={11}
                  required
                />
                {bvnError && <p className="text-red-500 text-sm">{bvnError}</p>}
              </div>
            )}
          </div>
        ),
      },
      {
        title: "Banking Features",
        description: "Explore what BAM Banking has to offer",
        content: (
          <div className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <ArrowDownCircle className="text-green-500 h-5 w-5" />
                <div>
                  <p className="font-medium">Receive Payments</p>
                  <p className="text-sm text-gray-500">Accept payments from customers seamlessly</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <ArrowUpCircle className="text-blue-500 h-5 w-5" />
                <div>
                  <p className="font-medium">Make Transfers</p>
                  <p className="text-sm text-gray-500">Send money to any bank account</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Clock className="text-purple-500 h-5 w-5" />
                <div>
                  <p className="font-medium">Transaction History</p>
                  <p className="text-sm text-gray-500">Track all your financial activities</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Wallet className="text-indigo-500 h-5 w-5" />
                <div>
                  <p className="font-medium">Financial Management</p>
                  <p className="text-sm text-gray-500">Track expenses, budgets, and financial goals</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <CreditCard className="text-emerald-500 h-5 w-5" />
                <div>
                  <p className="font-medium">Loans & Credit</p>
                  <p className="text-sm text-gray-500">Access quick loans and credit facilities</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Settings className="text-amber-500 h-5 w-5" />
                <div>
                  <p className="font-medium">Payment Automation</p>
                  <p className="text-sm text-gray-500">Automate salary, bills, and recurring transfers</p>
                </div>
              </div>
            </div>
          </div>
        )
      },
      {
        title: "Fund Your Account",
        description: "Make your first deposit to start banking",
        content: (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium">Account Details</p>
              <div className="mt-2 space-y-2">
                <p>Bank Name: BAM Bank</p>
                <p>Account Number: {accountDetails.accountNumber}</p>
                <p>Account Name: {accountName || userData?.business_name}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Transfer any amount to your account to start enjoying BAM Banking services
            </p>
          </div>
        ),
      },
    ];
  
    return (
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{steps[onboardingStep].title}</DialogTitle>
            <DialogDescription>{steps[onboardingStep].description}</DialogDescription>
          </DialogHeader>
  
          <div className="py-4">{steps[onboardingStep].content}</div>
  
          <DialogFooter>
            <Button onClick={handleOnboardingComplete}>
              {onboardingStep === 2 ? "Complete Setup" : "Next"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
  
  const PaymentsTab = ({ accountType }) => {
    const [selectedPool, setSelectedPool] = useState('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [activeSubTab, setActiveSubTab] = useState('outgoing');

    // Simulated data for payments
    const initialPaymentsData = {
      upcoming: [
        {
          id: 1,
          type: 'installment',
          amount: 25000,
          due_date: '2025-01-15',
          description: 'iPhone 15 Pro Max - 2/6 installments',
          status: 'pending'
        },
        {
          id: 2,
          type: 'loan',
          amount: 10000,
          due_date: '2025-01-20',
          description: 'Loan Repayment - January',
          status: 'pending'
        }
      ],
      completed: [
        {
          id: 3,
          type: 'purchase',
          amount: 150000,
          date: '2024-12-20',
          description: 'MacBook Air M2',
          status: 'completed'
        },
        {
          id: 4,
          type: 'installment',
          amount: 25000,
          date: '2024-12-15',
          description: 'iPhone 15 Pro Max - 1/6 installments',
          status: 'completed'
        }
      ]
    };
  
    // Simulated incoming payments data
    const incomingPaymentsData = {
      upcoming: [
        {
          id: 1,
          type: 'order_payment',
          amount: 150000,
          due_date: '2025-01-15',
          description: 'Order #12345 Payment',
          customer: 'John Doe',
          status: 'pending'
        },
        {
          id: 2,
          type: 'subscription',
          amount: 75000,
          due_date: '2025-01-20',
          description: 'Monthly Subscription - Premium Plan',
          customer: 'Tech Solutions Ltd',
          status: 'pending'
        }
      ],
      completed: [
        {
          id: 3,
          type: 'order_payment',
          amount: 250000,
          date: '2024-12-20',
          description: 'Order #12340 Payment',
          customer: 'Sarah Smith',
          status: 'completed'
        },
        {
          id: 4,
          type: 'subscription',
          amount: 100000,
          date: '2024-12-15',
          description: 'Annual Subscription Payment',
          customer: 'Global Services Inc',
          status: 'completed'
        }
      ]
    };
  
    const PaymentModal = () => (
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make Payment</DialogTitle>
            <DialogDescription>
              Amount to pay: ₦{selectedPayment?.amount.toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Payment Source</Label>
              <Select value={selectedPool} onValueChange={setSelectedPool}>
                <SelectTrigger>
                  <SelectValue placeholder="Select pool" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="savings">Savings Pool</SelectItem>
                  <SelectItem value="expenses">Expenses Pool</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowPaymentModal(false)}>
              Complete Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  
    const PaymentsList = ({ payments, type }) => (
      <div className="space-y-4">
        {payments.map((payment) => (
          <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">{payment.description}</p>
              {payment.customer && (
                <p className="text-sm text-gray-500">Customer: {payment.customer}</p>
              )}
              <p className="text-sm text-gray-500">
                {type === 'upcoming' ? `Due: ${payment.due_date}` : `Paid: ${payment.date}`}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold">₦{payment.amount.toLocaleString()}</p>
              {type === 'upcoming' && activeSubTab === 'outgoing' && (
                <Button 
                  size="sm" 
                  className="mt-2"
                  onClick={() => {
                    setSelectedPayment(payment);
                    setShowPaymentModal(true);
                  }}
                >
                  Pay Now
                </Button>
              )}
              {type !== 'upcoming' && (
                <Badge variant="success">Completed</Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  
    return (
      <div className="space-y-6">
        {accountType === 'Business' && (
          <Tabs defaultValue="outgoing" className="w-full" onValueChange={setActiveSubTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="outgoing">Outgoing Payments</TabsTrigger>
              <TabsTrigger value="incoming">Incoming Payments</TabsTrigger>
            </TabsList>
  
            <TabsContent value="outgoing">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Payments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PaymentsList 
                      payments={initialPaymentsData.upcoming} 
                      type="upcoming"
                    />
                  </CardContent>
                </Card>
  
                <Card>
                  <CardHeader>
                    <CardTitle>Payment History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PaymentsList 
                      payments={initialPaymentsData.completed} 
                      type="completed"
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
  
            <TabsContent value="incoming">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Expected Payments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PaymentsList 
                      payments={incomingPaymentsData.upcoming} 
                      type="upcoming"
                    />
                  </CardContent>
                </Card>
  
                <Card>
                  <CardHeader>
                    <CardTitle>Received Payments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PaymentsList 
                      payments={incomingPaymentsData.completed} 
                      type="completed"
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
  
        {accountType !== 'Business' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <PaymentsList 
                  payments={initialPaymentsData.upcoming} 
                  type="upcoming"
                />
              </CardContent>
            </Card>
  
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                <PaymentsList 
                  payments={initialPaymentsData.completed} 
                  type="completed"
                />
              </CardContent>
            </Card>
          </>
        )}
  
        <PaymentModal />
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6">
      <OnboardingContent />
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Banking</h1>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Account Name</p>
                    <p className="text-2xl font-bold">
                      {getCurrentAccountDetails().accountName || 'Not Set'}
                    </p>
                  </div>
                  <Building2 className="text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Available Balance</p>
                    <p className="text-2xl font-bold">₦{getCurrentAccountDetails().balance.toLocaleString()}</p>
                  </div>
                  <BanknoteIcon className="text-gray-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Account Number</p>
                    <p className="text-2xl font-bold">{getCurrentAccountDetails().accountNumber}</p>
                  </div>
                  <CreditCard className="text-gray-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Account Type</p>
                    <p className="text-2xl font-bold">{getCurrentAccountDetails().accountType}</p>
                  </div>
                  <Building2 className="text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="transactions">
          <TabsList>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
            <TabsTrigger value="loans">Loans</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions">
            <BankingTransactionsView />
          </TabsContent>

          <TabsContent value="financials">
            <FinancialsTab />
          </TabsContent>

          <TabsContent value="loans">
            <LoansTab accountType={getCurrentAccountDetails().accountType} />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentsTab accountType={getCurrentAccountDetails().accountType} />
          </TabsContent>

          <TabsContent value="automation">
            <AutomationTab accountType={getCurrentAccountDetails().accountType} />
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Settings content */}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default BankingPage;