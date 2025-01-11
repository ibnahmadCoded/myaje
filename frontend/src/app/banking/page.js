'use client';

import React, { useState, useEffect } from 'react';
import { 
    Building2, CreditCard, Clock, Wallet, Settings,
    ArrowDownCircle, ArrowUpCircle, BanknoteIcon,
    Pencil, Plus, Trash2, 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

  const fetchAccountDetails = async () => {
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
  };
  
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
  
  useEffect(() => {
    if (userData) {
      fetchAccountDetails();
    }
  }, [userData]);

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

  const LoanssTab = ({ accountType }) => {
    // Simulated data for loans
    const initialLoansData = {
      personal: {
        total_loans: 75000,
        total_repayments: 45000,
        loan_history: [
          {
            id: 1,
            amount: 25000,
            date_requested: '2024-12-15',
            status: 'completed',
            purpose: 'Product Purchase',
            repayment_status: 'fully_paid'
          },
          {
            id: 2,
            amount: 50000,
            date_requested: '2025-01-02',
            status: 'active',
            purpose: 'Product Purchase',
            repayment_status: 'ongoing',
            remaining: 30000
          }
        ],
        eligibility: {
          total_purchases: 15,
          available_amount: 10000,
          next_milestone: {
            purchases_needed: 35,
            amount_unlock: 50000
          }
        }
      },
      business: {
        total_loans: 2000000,
        total_repayments: 1000000,
        loan_history: [
          {
            id: 1,
            amount: 2000000,
            date_requested: '2024-12-01',
            status: 'active',
            purpose: 'Inventory Restock',
            repayment_status: 'ongoing',
            remaining: 1000000,
            equity_share: '2%'
          }
        ],
        eligibility: {
          restock_orders: 8,
          total_gmv: 2500000,
          available_amount: 1000000,
          next_milestone: {
            orders_needed: 12,
            gmv_needed: 7500000,
            amount_unlock: 5000000
          }
        }
      }
    };

    const [showLoanForm, setShowLoanForm] = useState(false);
    const [loanAmount, setLoanAmount] = useState('');
    const [loanPurpose, setLoanPurpose] = useState('');
    
    const loansData = accountType === 'Individual' ? 
      initialLoansData.personal : initialLoansData.business;
  
    const LoanForm = () => (
      <Dialog open={showLoanForm} onOpenChange={setShowLoanForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request a Loan</DialogTitle>
            <DialogDescription>
              Available amount: ₦{loansData.eligibility.available_amount.toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Loan Amount</Label>
              <Input
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                max={loansData.eligibility.available_amount}
                placeholder="Enter amount"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Purpose</Label>
              <Select value={loanPurpose} onValueChange={setLoanPurpose}>
                <SelectTrigger>
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product_purchase">Product Purchase</SelectItem>
                  <SelectItem value="inventory_restock">Inventory Restock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowLoanForm(false)}>
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Total Loans</p>
                  <p className="text-2xl font-bold">₦{loansData.total_loans.toLocaleString()}</p>
                </div>
                <BanknoteIcon className="text-gray-400" />
              </div>
            </CardContent>
          </Card>
  
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Total Repayments</p>
                  <p className="text-2xl font-bold">₦{loansData.total_repayments.toLocaleString()}</p>
                </div>
                <ArrowUpCircle className="text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>
  
        <Card>
          <CardHeader>
            <CardTitle>Loan Availability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {accountType === 'Individual' ? (
              <>
                <div className="space-y-2">
                  <p className="font-medium">Current Status:</p>
                  <p>• Total Purchases: {loansData.eligibility.total_purchases}</p>
                  <p>• Available Loan Amount: ₦{loansData.eligibility.available_amount.toLocaleString()}</p>
                  <p>• Next Milestone: {loansData.eligibility.next_milestone.purchases_needed} more purchases for ₦{loansData.eligibility.next_milestone.amount_unlock.toLocaleString()}</p>
                </div>
                
                <div className="space-y-2">
                  <p className="font-medium">Loan Tiers:</p>
                  <p>• ₦5,000 - After 5 purchases</p>
                  <p>• ₦10,000 - After 15 purchases</p>
                  <p>• ₦50,000 - After 50 purchases</p>
                  <p>• ₦100,000 - After 100 purchases (Maximum)</p>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <p className="font-medium">Current Status:</p>
                  <p>• Total Restock Orders: {loansData.eligibility.restock_orders}</p>
                  <p>• Total GMV: ₦{loansData.eligibility.total_gmv.toLocaleString()}</p>
                  <p>• Available Loan Amount: ₦{loansData.eligibility.available_amount.toLocaleString()}</p>
                </div>
                
                <div className="space-y-2">
                  <p className="font-medium">Loan Tiers:</p>
                  <p>• ₦1,000,000 - After 5 restock orders and ₦1M GMV</p>
                  <p>• ₦5,000,000 - After 20 restock orders and ₦10M GMV</p>
                  <Alert>
                    <AlertDescription>
                      Business loans require equity sharing in either company or product sales profit
                    </AlertDescription>
                  </Alert>
                </div>
              </>
            )}
            
            {loansData.eligibility.available_amount > 0 && (
              <Button className="w-full" onClick={() => setShowLoanForm(true)}>
                Request a Loan
              </Button>
            )}
          </CardContent>
        </Card>
  
        <Card>
          <CardHeader>
            <CardTitle>Loan History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loansData.loan_history.map((loan) => (
                <div key={loan.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">₦{loan.amount.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">{loan.purpose}</p>
                    <p className="text-sm text-gray-500">{loan.date_requested}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={loan.status === 'completed' ? 'success' : 'default'}>
                      {loan.status}
                    </Badge>
                    {loan.status === 'active' && (
                      <p className="text-sm text-gray-500 mt-1">
                        Remaining: ₦{loan.remaining.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
  
        <LoanForm />
      </div>
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

  const AutomationsTab = () => {
    // Simulated data for automations
    const initialAutomationsData = [
      {
        id: 1,
        name: 'Monthly Savings Transfer',
        type: 'transfer',
        amount: 50000,
        source_pool: 'Credit Pool',
        destination: '0123456789',
        schedule: 'Monthly',
        next_run: '2025-02-01',
        status: 'active'
      },
      {
        id: 2,
        name: 'Weekly Pool Distribution',
        type: 'pool_distribution',
        source_pool: 'Credit Pool',
        schedule: 'Weekly',
        next_run: '2025-01-11',
        status: 'active'
      }
    ];

    const [showAutomationForm, setShowAutomationForm] = useState(false);
    const [automations, setAutomations] = useState(initialAutomationsData);
    const [newAutomation, setNewAutomation] = useState({
      name: '',
      type: '',
      amount: '',
      source_pool: '',
      destination: '',
      schedule: '',
      recurrence: ''
    });
  
    const scheduleOptions = [
      { value: 'daily', label: 'Daily' },
      { value: 'weekly', label: 'Weekly' },
      { value: 'biweekly', label: 'Bi-weekly' },
      { value: 'monthly', label: 'Monthly' },
      { value: 'instant', label: 'Instant (For pool distributions)' }
    ];
  
    const poolOptions = [
      { value: 'credit', label: 'Credit Pool' },
      { value: 'savings', label: 'Savings Pool' },
      { value: 'expenses', label: 'Expenses Pool' },
      { value: 'investment', label: 'Investment Pool' }
    ];
  
    const handleNewAutomation = () => {
      if (!newAutomation.name || !newAutomation.type) return;
  
      const automation = {
        id: automations.length + 1,
        ...newAutomation,
        status: 'active',
        next_run: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
  
      setAutomations([...automations, automation]);
      setShowAutomationForm(false);
      setNewAutomation({
        name: '',
        type: '',
        amount: '',
        source_pool: '',
        destination: '',
        schedule: '',
        recurrence: ''
      });
    };
  
    const AutomationForm = () => (
      <Dialog open={showAutomationForm} onOpenChange={setShowAutomationForm}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Automation</DialogTitle>
            <DialogDescription>
              Set up automatic transfers or pool distributions
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Automation Name</Label>
              <Input
                value={newAutomation.name}
                onChange={(e) => setNewAutomation({...newAutomation, name: e.target.value})}
                placeholder="E.g., Monthly Savings Transfer"
              />
            </div>
  
            <div className="space-y-2">
              <Label>Automation Type</Label>
              <Select
                value={newAutomation.type}
                onValueChange={(value) => setNewAutomation({...newAutomation, type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transfer">Bank Transfer</SelectItem>
                  <SelectItem value="pool_distribution">Pool Distribution</SelectItem>
                </SelectContent>
              </Select>
            </div>
  
            {newAutomation.type === 'transfer' && (
              <>
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    value={newAutomation.amount}
                    onChange={(e) => setNewAutomation({...newAutomation, amount: e.target.value})}
                    placeholder="Enter amount"
                  />
                </div>
  
                <div className="space-y-2">
                  <Label>Destination Account</Label>
                  <Input
                    value={newAutomation.destination}
                    onChange={(e) => setNewAutomation({...newAutomation, destination: e.target.value})}
                    placeholder="Enter account number"
                  />
                </div>
              </>
            )}
  
            <div className="space-y-2">
              <Label>Source Pool</Label>
              <Select
                value={newAutomation.source_pool}
                onValueChange={(value) => setNewAutomation({...newAutomation, source_pool: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source pool" />
                </SelectTrigger>
                <SelectContent>
                  {poolOptions.map((pool) => (
                    <SelectItem key={pool.value} value={pool.value}>
                      {pool.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
  
            <div className="space-y-2">
              <Label>Schedule</Label>
              <Select
                value={newAutomation.schedule}
                onValueChange={(value) => setNewAutomation({...newAutomation, schedule: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select schedule" />
                </SelectTrigger>
                <SelectContent>
                  {scheduleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={handleNewAutomation}>
              Create Automation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Automations</h2>
          <Button onClick={() => setShowAutomationForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Automation
          </Button>
        </div>
  
        <Card>
          <CardHeader>
            <CardTitle>Active Automations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {automations.map((automation) => (
                <div key={automation.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Clock className="text-blue-500" />
                    <div>
                      <p className="font-medium">{automation.name}</p>
                      <p className="text-sm text-gray-500">
                        {automation.type === 'transfer' ? 
                          `₦${Number(automation.amount).toLocaleString()} - ${automation.schedule}` :
                          `Pool Distribution - ${automation.schedule}`
                        }
                      </p>
                      <p className="text-sm text-gray-500">Next run: {automation.next_run}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={automation.status === 'active' ? 'success' : 'default'}>
                      {automation.status}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
  
        <AutomationForm />
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