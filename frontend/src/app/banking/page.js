'use client';

import React, { useState, useEffect } from 'react';
import { 
    Building2, CreditCard, Clock, Wallet, Settings,
    ArrowDownCircle, ArrowUpCircle, BanknoteIcon,
    CalendarIcon, ArrowRightLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from '@/components/DashboardLayout';
import { apiBaseUrl } from '@/config';

const BankingPage = () => {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [userData, setUserData] = useState(null);
  const [businessAccountDetails, setBusinessAccountDetails] = useState({
    accountName: '',
    accountNumber: '',
    accountType: 'Business',
    balance: 1000000,
    templateType: ''
  });
  const [personalAccountDetails, setPersonalAccountDetails] = useState({
    accountName: '',
    accountNumber: '',
    accountType: 'Individual',
    balance: 100000,
    templateType: ''
  });

  const [accounts, setAccounts] = useState([]);
  const [loans, setLoans] = useState([]);
  const [automations, setAutomations] = useState([]);

  useEffect(() => {
    const userDataStr = localStorage.getItem('user');
    if (userDataStr) {
      const userData = JSON.parse(userDataStr);
      setUserData(userData);
      
      const isBusinessView = userData.active_view === 'business';
      
      // Generate account numbers if not set
      if (!businessAccountDetails.accountNumber) {
        const businessAccNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
        setBusinessAccountDetails(prev => ({
          ...prev,
          accountNumber: businessAccNumber,
          accountName: userData.business_name || ''
        }));
      }
      
      if (!personalAccountDetails.accountNumber) {
        const phoneNumber = userData.phone.replace(/\D/g, '');
        setPersonalAccountDetails(prev => ({
          ...prev,
          accountNumber: phoneNumber.slice(-10),
          accountName: userData.full_name || ''
        }));
      }

      // Check view-specific onboarding status
      const onboardingKey = isBusinessView ? 'businessBankingOnboarded' : 'personalBankingOnboarded';
      const isOnboarded = localStorage.getItem(onboardingKey) === 'true';
      setShowOnboarding(!isOnboarded);
    }
  }, [userData?.active_view]);

  const handleAccountNameChange = (e) => {
      setPersonalAccountDetails(prev => ({
        ...prev,
        accountName: e.target.value
      }));
  };

  const handleOnboardingComplete = async () => {
    if (onboardingStep < 2) {
      setOnboardingStep(prev => prev + 1);
      return;
    }
  
    try {
      const response = await fetch(`${apiBaseUrl}/auth/update-banking-onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          view: userData.active_view
        })
      });
  
      if (!response.ok) throw new Error('Failed to update onboarding status');
  
      const onboardingKey = userData.active_view === 'business' ? 
        'businessBankingOnboarded' : 'personalBankingOnboarded';
      localStorage.setItem(onboardingKey, 'true');
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error updating onboarding status:', error);
      // Optionally show error to user
    }
  };

  // Get current account details based on active view
  const getCurrentAccountDetails = () => {
    return userData?.active_view === 'business' ? 
      businessAccountDetails : personalAccountDetails;
  };

  const OnboardingContent = () => {
    const accountDetails = getCurrentAccountDetails();

    const isBusinessView = userData?.active_view === 'business';
    
    const steps = [
      {
        title: "Welcome to BAM - The Myaje Banking Experience",
        description: "Let's get you started with your new banking experience",
        content: (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium">Your Account Details</p>
              <div className="mt-2 space-y-2">
                <p>Account Number: {accountDetails.accountNumber}</p>
                <p>Account Type: {accountDetails.accountType}</p>
              </div>
            </div>
            {!isBusinessView && (
              <div className="space-y-2">
                <Label>Account Name</Label>
                <Input 
                  type="text" 
                  value={accountDetails.accountName}
                  onChange={handleAccountNameChange}
                  placeholder="Enter your full name"
                  required 
                />
              </div>
            )}
          </div>
        )
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
                <p>Account Name: {accountDetails.accountName || userData?.business_name}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Transfer any amount to your account to start enjoying BAM Banking services
            </p>
          </div>
        )
      }
    ];

    return (
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{steps[onboardingStep].title}</DialogTitle>
            <DialogDescription>{steps[onboardingStep].description}</DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {steps[onboardingStep].content}
          </div>
          
          <DialogFooter>
            <Button onClick={handleOnboardingComplete}>
              {onboardingStep === 2 ? "Complete Setup" : "Next"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Dummy transactions data
  const dummyTransactions = [
    {
      id: 1,
      type: 'credit',
      amount: 150000,
      tag: 'sales',
      description: 'Payment for Order #12345',
      date: '2024-12-15',
      customer: 'John Doe',
      reference: 'SAL-12345'
    },
    {
      id: 2,
      type: 'debit',
      amount: 75000,
      tag: 'restock',
      description: 'Inventory Restock - Electronics',
      date: '2024-12-20',
      supplier: 'Tech Supplies Ltd',
      reference: 'PUR-89012'
    },
    {
      id: 3,
      type: 'debit',
      amount: 25000,
      tag: 'online',
      description: 'Online Purchase - Marketing Tools',
      date: '2024-12-25',
      platform: 'Digital Marketing Hub',
      reference: 'ONL-45678'
    },
    {
      id: 4,
      type: 'debit',
      amount: 50000,
      tag: 'loan',
      description: 'Loan Repayment - December',
      date: '2024-12-30',
      loanId: 'LOAN-789',
      reference: 'LNP-34567'
    },
    {
      id: 5,
      type: 'credit',
      amount: 200000,
      tag: 'sales',
      description: 'Bulk Order Payment #45678',
      date: '2025-01-01',
      customer: 'Sarah Smith',
      reference: 'SAL-67890'
    },
    {
      id: 6,
      type: 'debit',
      amount: 15000,
      tag: 'others',
      description: 'Office Supplies',
      date: '2025-01-02',
      vendor: 'Office Mart',
      reference: 'EXP-12345'
    },
    {
      id: 7,
      type: 'credit',
      amount: 180000,
      tag: 'sales',
      description: 'Payment for Order #56789',
      date: '2025-01-02',
      customer: 'Mike Johnson',
      reference: 'SAL-34567'
    },
    {
      id: 8,
      type: 'debit',
      amount: 100000,
      tag: 'restock',
      description: 'Inventory Restock - Fashion',
      date: '2025-01-02',
      supplier: 'Fashion Wholesale Co',
      reference: 'PUR-67890'
    }
  ];
  
  const TransactionsTab = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [transactionType, setTransactionType] = useState('all');
    const [transactionTag, setTransactionTag] = useState('all-tags');
    const [transactions, setTransactions] = useState(dummyTransactions);
  
    // Get current date in YYYY-MM-DD format
    const currentDate = new Date().toISOString().split('T')[0];
  
    // Calculate total credits and debits
    const totals = transactions.reduce((acc, transaction) => {
      if (transaction.type === 'credit') {
        acc.credits += transaction.amount;
      } else {
        acc.debits += transaction.amount;
      }
      return acc;
    }, { credits: 0, debits: 0 });
  
    // Handle date changes with validation
    const handleStartDateChange = (e) => {
      const newStartDate = e.target.value;
      if (endDate && newStartDate > endDate) {
        alert('Start date cannot be after end date');
        return;
      }
      if (newStartDate > currentDate) {
        alert('Start date cannot be in the future');
        return;
      }
      setStartDate(newStartDate);
    };
  
    const handleEndDateChange = (e) => {
      const newEndDate = e.target.value;
      if (startDate && newEndDate < startDate) {
        alert('End date cannot be before start date');
        return;
      }
      if (newEndDate > currentDate) {
        alert('End date cannot be in the future');
        return;
      }
      setEndDate(newEndDate);
    };
  
    // Filter transactions based on selected criteria
    const filteredTransactions = transactions.filter(transaction => {
      const dateInRange = (!startDate || transaction.date >= startDate) && 
                         (!endDate || transaction.date <= endDate);
      const matchesType = transactionType === 'all' || transaction.type === transactionType;
      const matchesTag = transactionTag === 'all-tags' || transaction.tag === transactionTag;
      
      return dateInRange && matchesType && matchesTag;
    });
  
    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Total Credits</p>
                  <p className="text-2xl font-bold text-green-600">₦{totals.credits.toLocaleString()}</p>
                </div>
                <ArrowDownCircle className="text-green-500 h-8 w-8" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Total Debits</p>
                  <p className="text-2xl font-bold text-red-600">₦{totals.debits.toLocaleString()}</p>
                </div>
                <ArrowUpCircle className="text-red-500 h-8 w-8" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Net Balance</p>
                  <p className={`text-2xl font-bold ${totals.credits - totals.debits >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₦{(totals.credits - totals.debits).toLocaleString()}
                  </p>
                </div>
                <Wallet className="text-gray-400 h-8 w-8" />
              </div>
            </CardContent>
          </Card>
        </div>
  
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Start Date
            </Label>
            <Input
              type="date"
              value={startDate}
              onChange={handleStartDateChange}
              max={currentDate}
            />
          </div>
  
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              End Date
            </Label>
            <Input
              type="date"
              value={endDate}
              onChange={handleEndDateChange}
              max={currentDate}
            />
          </div>
  
          <div className="space-y-2">
            <Label>Transaction Type</Label>
            <Select 
              value={transactionType} 
              onValueChange={setTransactionType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
                <SelectItem value="debit">Debit</SelectItem>
              </SelectContent>
            </Select>
          </div>
  
          <div className="space-y-2">
            <Label>Transaction Tags</Label>
            <Select 
              value={transactionTag} 
              onValueChange={setTransactionTag}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-tags">All Tags</SelectItem>
                <SelectItem value="sales">Sales Payment</SelectItem>
                <SelectItem value="restock">Restock Payment</SelectItem>
                <SelectItem value="online">Online Purchase</SelectItem>
                <SelectItem value="loan">Loan Payment</SelectItem>
                <SelectItem value="others">Others</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
  
        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Transactions</span>
              <span className="text-sm text-gray-500">
                Showing {filteredTransactions.length} of {transactions.length} transactions
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No transactions found for the selected criteria
                </div>
              ) : (
                filteredTransactions.map(transaction => (
                  <div key={transaction.id} 
                       className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      {transaction.type === 'credit' ? 
                        <ArrowDownCircle className="text-green-500 h-5 w-5" /> :
                        <ArrowUpCircle className="text-red-500 h-5 w-5" />
                      }
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{new Date(transaction.date).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{transaction.reference}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={transaction.type === 'credit' ? 'success' : 'destructive'}>
                        {transaction.tag}
                      </Badge>
                      <p className={`font-bold ${transaction.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                        {transaction.type === 'credit' ? '+' : '-'}₦{transaction.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };    

  const FinancialsTab = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Financial Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {accounts.map((account, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <PiggyBank />
                  <div>
                    <p className="font-medium">{account.name}</p>
                    <p className="text-sm text-gray-500">{account.accountNumber}</p>
                  </div>
                </div>
                <p className="font-bold">₦{account.balance.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const LoansTab = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Loan Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-gray-500">Total Loans</p>
              <p className="text-2xl font-bold">₦{loans.reduce((acc, loan) => acc + loan.amount, 0).toLocaleString()}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-gray-500">Total Repayments</p>
              <p className="text-2xl font-bold">₦{loans.reduce((acc, loan) => acc + loan.repaid, 0).toLocaleString()}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-semibold">Loan Availability</h3>
            {accountDetails.accountType === 'individual' ? (
              <div className="space-y-2">
                <p>- 0% interest loans available</p>
                <p>- Min ₦5,000 after 5 purchases</p>
                <p>- ₦10,000 after 10 more purchases</p>
                <p>- Up to ₦50,000 available</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p>- ₦1M after 5 restock orders and ₦1M GMV</p>
                <p>- ₦5M after 20 restock orders and ₦10M GMV</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const AutomationTab = () => (
    <div className="space-y-4">
      <Button>
        <ArrowRightLeft className="mr-2" />
        Add New Automation
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Active Automations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {automations.map((automation, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Clock />
                  <div>
                    <p className="font-medium">{automation.title}</p>
                    <p className="text-sm text-gray-500">{automation.schedule}</p>
                  </div>
                </div>
                <Badge>{automation.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

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
            <TransactionsTab />
          </TabsContent>

          <TabsContent value="financials">
            <FinancialsTab />
          </TabsContent>

          <TabsContent value="loans">
            <LoansTab />
          </TabsContent>

          <TabsContent value="payments">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Upcoming payments content */}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="automation">
            <AutomationTab />
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