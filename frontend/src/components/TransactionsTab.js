import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownCircle, ArrowUpCircle, Wallet, CalendarIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { apiBaseUrl } from '@/config';
import { useToast } from "@/hooks/use-toast";

// Define tags to ensure consistency between UI and API
const TRANSACTION_TAGS = {
  ALL: 'ALL_TAGS',
  TRANSFER: 'TRANSFER',
  SALES: 'SALES',
  RESTOCK: 'RESTOCK',
  ONLINE: 'ONLINE',
  LOAN: 'LOAN',
  MONEY_REQUEST: 'MONEY_REQUEST',
  OTHERS: 'OTHERS'
};

// Tag display names for UI
const TAG_DISPLAY_NAMES = {
  [TRANSACTION_TAGS.ALL]: 'All Tags',
  [TRANSACTION_TAGS.TRANSFER]: 'Transfer',
  [TRANSACTION_TAGS.SALES]: 'Sales Payment',
  [TRANSACTION_TAGS.RESTOCK]: 'Restock Payment',
  [TRANSACTION_TAGS.ONLINE]: 'Online Purchase',
  [TRANSACTION_TAGS.LOAN]: 'Loan Payment',
  [TRANSACTION_TAGS.MONEY_REQUEST]: 'Money Request',
  [TRANSACTION_TAGS.OTHERS]: 'Others'
};

export const TransactionsTab = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [transactionType, setTransactionType] = useState('all');
    const [transactionTag, setTransactionTag] = useState(TRANSACTION_TAGS.ALL);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const currentDate = new Date().toISOString().split('T')[0];

    if (loading){
      //console.log("")
    }

    const handleStartDateChange = (e) => {
      const newStartDate = e.target.value;
      if (endDate && newStartDate > endDate) {
        toast({
          title: "Invalid Date Range",
          description: "Start date cannot be after end date",
          variant: "destructive"
        });
        return;
      }
      setStartDate(newStartDate);
    };

    const handleEndDateChange = (e) => {
      const newEndDate = e.target.value;
      if (startDate && newEndDate < startDate) {
        toast({
          title: "Invalid Date Range",
          description: "End date cannot be before start date",
          variant: "destructive"
        });
        return;
      }
      setEndDate(newEndDate);
    };

    const fetchTransactions = useCallback(async () => {
      try {
        const userDataStr = localStorage.getItem('user');
        const userData = JSON.parse(userDataStr);
        const userView = userData.active_view;

        let url = `${apiBaseUrl}/banking/transactions?user_view=${userView}`;
        if (startDate) url += `&start_date=${startDate}`;
        if (endDate) url += `&end_date=${endDate}`;
        if (transactionType !== 'all') url += `&transaction_type=${transactionType}`;
        if (transactionTag !== TRANSACTION_TAGS.ALL) url += `&transaction_tag=${transactionTag}`;

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch transactions');
        
        const data = await response.json();
        setTransactions(data);
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to load transactions, ${error}`,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }, [startDate, endDate, transactionType, transactionTag, toast]);

    useEffect(() => {
      fetchTransactions();
    }, [fetchTransactions]);

    const totals = transactions.reduce((acc, transaction) => {
      if (transaction.type === 'credit') {
        acc.credits += transaction.amount;
      } else {
        acc.debits += transaction.amount;
      }
      return acc;
    }, { credits: 0, debits: 0 });
  
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
                {Object.entries(TRANSACTION_TAGS).map(([key, value]) => (
                  <SelectItem key={key} value={value}>
                    {TAG_DISPLAY_NAMES[value]}
                  </SelectItem>
                ))}
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
                Showing {transactions.length} transactions
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No transactions found for the selected criteria
                </div>
              ) : (
                transactions.map(transaction => (
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
                        {TAG_DISPLAY_NAMES[transaction.tag] ||
                          (transaction.tag.includes('_')
                            ? transaction.tag
                                .split('_')
                                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(' ')
                            : transaction.tag.charAt(0).toUpperCase() + transaction.tag.slice(1))}
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
