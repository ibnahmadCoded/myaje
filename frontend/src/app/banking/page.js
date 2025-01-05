'use client';

import React, { useState, useEffect } from 'react';
import { 
    Building2, CreditCard, Clock, Wallet, Settings,
    ArrowDownCircle, ArrowUpCircle, BanknoteIcon,
    CalendarIcon, ArrowRightLeft, Pencil, Plus,
    PiggyBank, Trash2, Save, ChevronDown,
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
  
  const TransactionsTab = () => {
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

  const FinancialsTab = () => {
    const [showBalanceModal, setShowBalanceModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [pools, setPools] = useState([]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [newPoolName, setNewPoolName] = useState('');
    const [newPoolPercentage, setNewPoolPercentage] = useState('');
    const [creditPool, setCreditPool] = useState({ name: 'Credit Pool', balance: 100000 }); // should be from backend of course, credit pool holds all incoming payments!
    const [editingPool, setEditingPool] = useState(null);
    const [isUpdatingPools, setIsUpdatingPools] = useState(false);

    // Simulated update pool distributions function
    const updatePoolDistributions = async (updatedPools) => {
      setIsUpdatingPools(true);
      
      // all this should be done in backed, which will just return the pools and their new balances!
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Calculate total available funds
        const totalFunds = pools.reduce((sum, pool) => sum + pool.balance, 0) + creditPool.balance;

        // Redistribute funds based on new percentages
        const redistributedPools = updatedPools.map(pool => ({
          ...pool,
          balance: Math.floor((totalFunds * pool.percentage) / 100)
        }));

        // Update pools with new balances
        setPools(redistributedPools);
        setCreditPool({ ...creditPool, balance: 0 });

        setIsEditMode(false);
        setShowUpdateModal(true);
      } catch (error) {
        console.error('Error updating pool distributions:', error);
      } finally {
        setIsUpdatingPools(false);
      }
    };

    const handleSaveChanges = () => {
      const totalPercentage = getTotalPercentage();
      if (totalPercentage !== 100) {
        alert('Total percentage must equal 100%');
        return;
      }

      updatePoolDistributions(pools);
    };


    const templates = {
      personal: {
        name: 'Personal Template',
        pools: [
          { name: 'Savings Pool', percentage: 30, balance: 0 },
          { name: 'Investments Pool', percentage: 20, balance: 0 },
          { name: 'Expenses Pool', percentage: 40, balance: 0 },
          { name: 'Miscellaneous Pool', percentage: 10, balance: 0 }
        ]
      },
      business: {
        name: 'Business Template',
        pools: [
          { name: 'Operations Pool', percentage: 40, balance: 0 },
          { name: 'Salary Pool', percentage: 30, balance: 0 },
          { name: 'Investment Pool', percentage: 20, balance: 0 },
          { name: 'Emergency Pool', percentage: 10, balance: 0 }
        ]
      }
    };

    const handleTemplateSelect = (value) => {
      setSelectedTemplate(value);
      setPools(templates[value].pools);
      setIsEditMode(false);
    };

    const getTotalPercentage = () => {
      return pools.reduce((sum, pool) => sum + pool.percentage, 0);
    };

    const handleAddPool = () => {
      if (!newPoolName || !newPoolPercentage) return;
      if (getTotalPercentage() + Number(newPoolPercentage) > 100) {
        alert('Total percentage cannot exceed 100%');
        return;
      }

      const newPool = {
        name: newPoolName,
        percentage: Number(newPoolPercentage),
        balance: 0
      };

      setPools([...pools, newPool]);
      setNewPoolName('');
      setNewPoolPercentage('');
    };

    const handleUpdatePool = (index, newPercentage) => {
      const currentTotal = getTotalPercentage() - pools[index].percentage;
      if (currentTotal + Number(newPercentage) > 100) {
        alert('Total percentage cannot exceed 100%');
        return;
      }

      const updatedPools = [...pools];
      updatedPools[index].percentage = Number(newPercentage);
      setPools(updatedPools);
      setEditingPool(null);
    };

    const handleDeletePool = (index) => {
      setPools(pools.filter((_, i) => i !== index));
    };

    const getTotalBalance = () => {
      return pools.reduce((sum, pool) => sum + pool.balance, 0) + creditPool.balance;
    };

    const BalanceModal = () => (
      <Dialog open={showBalanceModal} onOpenChange={setShowBalanceModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Balance Breakdown</DialogTitle>
            <DialogDescription>
              Your total balance is distributed across the following pools
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Credit Pool</p>
                  <p className="text-sm text-gray-500">Incoming funds pool</p>
                </div>
                <p className="font-bold">₦{creditPool.balance.toLocaleString()}</p>
              </div>
            </div>
            
            {pools.map((pool, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{pool.name}</p>
                    <p className="text-sm text-gray-500">{pool.percentage}% of distributions</p>
                  </div>
                  <p className="font-bold">₦{pool.balance.toLocaleString()}</p>
                </div>
              </div>
            ))}

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <p className="font-medium">Total Balance</p>
                <p className="font-bold">₦{getTotalBalance().toLocaleString()}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );

    const UpdateConfirmationModal = () => (
      <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pool Distribution Updated</DialogTitle>
            <DialogDescription>
              Funds have been redistributed according to the new percentages
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {pools.map((pool, index) => (
              <div key={index} className="flex justify-between items-center">
                <span>{pool.name} ({pool.percentage}%)</span>
                <span className="font-bold">₦{pool.balance.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowUpdateModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );  

    return (
      <div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center cursor-pointer" onClick={() => setShowBalanceModal(true)}>
              <div>
                <p className="text-sm text-gray-500">Available Balance</p>
                <p className="text-2xl font-bold">₦{getTotalBalance().toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <BanknoteIcon className="text-gray-400" />
                <ChevronDown className="text-gray-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {pools.length === 0 ? (
          <div className="mt-4 p-6 border-2 border-dashed rounded-lg text-center">
            <PiggyBank className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="font-medium mb-2">No Pools Created</h3>
            <p className="text-gray-500 mb-4">Select a template to start managing your funds</p>
            <Select onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {userData?.active_view === 'business' ? (
                  <SelectItem value="business">Basic Business Template</SelectItem>
                ) : (
                  <SelectItem value="personal">Basic Personal Template</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Pool Distribution</h3>
              <Button 
                variant={isEditMode ? "secondary" : "default"}
                onClick={() => setIsEditMode(!isEditMode)}
              >
                {isEditMode ? (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Pools
                  </>
                )}
              </Button>
            </div>

            {isEditMode && (
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleSaveChanges}
                  disabled={isUpdatingPools}
                >
                  {isUpdatingPools ? (
                    <>
                      <span className="animate-spin mr-2">⌛</span>
                      Updating Pools...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save & Redistribute
                    </>
                  )}
                </Button>
              </div>
            )}

            <UpdateConfirmationModal />

            {getTotalPercentage() > 100 && (
              <Alert variant="destructive">
                <AlertDescription>
                  Total distribution cannot exceed 100%. Current total: {getTotalPercentage()}%
                </AlertDescription>
              </Alert>
            )}

            {isEditMode && (
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label>Pool Name</Label>
                  <Input
                    value={newPoolName}
                    onChange={(e) => setNewPoolName(e.target.value)}
                    placeholder="Enter pool name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Percentage (%)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={newPoolPercentage}
                      onChange={(e) => setNewPoolPercentage(e.target.value)}
                      placeholder="Enter percentage"
                      min="0"
                      max="100"
                    />
                    <Button onClick={handleAddPool}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {pools.map((pool, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <PiggyBank className="text-blue-500" />
                    <div>
                      <p className="font-medium">{pool.name}</p>
                      <p className="text-sm text-gray-500">
                        Balance: ₦{pool.balance.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {editingPool === index ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          className="w-20"
                          value={pool.percentage}
                          onChange={(e) => handleUpdatePool(index, e.target.value)}
                          min="0"
                          max="100"
                        />
                        <Button size="sm" onClick={() => setEditingPool(null)}>
                          Save
                        </Button>
                      </div>
                    ) : (
                      <>
                        <p className="font-medium">{pool.percentage}%</p>
                        {isEditMode && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => setEditingPool(index)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeletePool(index)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <BalanceModal />
      </div>
    );
  };  

  const LoansTab = ({ accountType }) => {
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

  const AutomationTab = () => {
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
            <TransactionsTab />
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