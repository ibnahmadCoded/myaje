import React, { useState, useEffect, useCallback } from 'react';
import { ArrowUpCircle, BanknoteIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiBaseUrl } from '@/config';
import { Alert, AlertDescription } from "@/components/ui/alert";

const CurrencyInput = ({ value, onChange, ...props }) => {
  const formatNumber = (num) => {
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const unformatNumber = (str) => {
    return str.replace(/,/g, '');
  };

  const handleChange = (e) => {
    const input = e.target.value;
    const digits = input.replace(/[^\d,]/g, ''); // Allow only digits and commas
    const unformatted = unformatNumber(digits); // Remove commas for raw numeric value

    if (unformatted === '' || /^\d+$/.test(unformatted)) {
      //const formatted = formatNumber(unformatted); // Add commas for display
      onChange(unformatted); // Pass the raw numeric value to parent
    }
  };

  return (
    <Input
      type="text"
      value={formatNumber(value)} // Format the displayed value with commas
      onChange={handleChange}
      placeholder="Enter amount"
      {...props}
    />
  );
};

export const LoanForm = ({ 
  accountType,
  showLoanForm, 
  setShowLoanForm, 
  loanAmount, 
  setLoanAmount,
  loanPurpose,
  setLoanPurpose,
  availableAmount,
  onSubmit 
}) => {
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!loanAmount || !loanPurpose) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(loanAmount);

    if (amount > availableAmount) {
      toast({
        title: "Error",
        description: `Maximum loan amount is ₦${availableAmount.toLocaleString()}`,
        variant: "destructive"
      });
      return;
    }

    onSubmit();
  };

  return (
    <Dialog open={showLoanForm} onOpenChange={setShowLoanForm}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request a Loan</DialogTitle>
          <DialogDescription>
            Available amount: ₦{availableAmount.toLocaleString()}
          </DialogDescription>
        </DialogHeader>
    
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Loan Amount</Label>
            <CurrencyInput
              value={loanAmount}
              onChange={setLoanAmount} // Pass the raw numeric value directly
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
                {accountType === 'Individual' ? (
                  <SelectItem value="product_purchase">Product Purchase</SelectItem>
                ) : (
                  <SelectItem value="inventory_restock">Inventory Restock</SelectItem>
                )}
            </SelectContent>
            </Select>
          </div>
        </div>
    
        <DialogFooter>
          <Button onClick={handleSubmit}>
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const LoansTab = ({ accountType }) => {
    const [loansData, setLoansData] = useState({
        total_loans: 0,
        total_repayments: 0,
        loan_history: [],
        eligibility: {
          total_purchases: 0,
          restock_orders: 0,
          total_gmv: 0,
          available_amount: 0,
          next_milestone: null
        }
    });
    const [showLoanForm, setShowLoanForm] = useState(false);
    // Replace formData with specific state variables for better control
    const [loanAmount, setLoanAmount] = useState('');
    const [loanPurpose, setLoanPurpose] = useState('');
    const { toast } = useToast();
    
    const fetchLoansData = useCallback(async () => {
        try {
            const token = localStorage.getItem('token'); // Retrieve token from localStorage

            const activeView = accountType === "Individual" ? "personal" : "business";
    
            const [availabilityRes, historyRes] = await Promise.all([
                fetch(`${apiBaseUrl}/banking/loans/availability?active_view=${activeView}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json' // Optional, but good practice
                    }
                }),
                fetch(`${apiBaseUrl}/banking/loans/history?active_view=${activeView}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json' // Optional
                    }
                })
            ]);
    
            if (!availabilityRes.ok || !historyRes.ok) {
                throw new Error('Failed to fetch loans data');
            }
    
            const availability = await availabilityRes.json();
            const history = await historyRes.json();
    
            const totalLoans = history.reduce((sum, loan) => sum + loan.amount, 0);
            const totalRepayments = history.reduce((sum, loan) => {
                return sum + (loan.amount - loan.remaining_amount);
            }, 0);
    
            setLoansData({
                total_loans: totalLoans,
                total_repayments: totalRepayments,
                loan_history: history,
                eligibility: availability
            });
        } catch (error) {
            console.error('Error fetching loans data:', error);
            toast({
                title: "Error",
                description: "Failed to fetch loans data",
                variant: "destructive"
            });
        }
    }, [accountType, toast]);
    
    const handleLoanRequest = async () => {
        try {
            const activeView = accountType === "Individual" ? "personal" : "business";

            const response = await fetch(`${apiBaseUrl}/banking/loans/request?active_view=${activeView}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    amount: parseFloat(loanAmount),
                    purpose: loanPurpose
                })
            });
    
            if (!response.ok) {
                throw new Error('Failed to submit loan request');
            }
    
            toast({
                title: "Success",
                description: "Loan request submitted successfully"
            });
    
            setShowLoanForm(false);
            setLoanAmount('');
            setLoanPurpose('');
            fetchLoansData();
        } catch (error) {
            console.error('Error submitting loan request:', error);
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    useEffect(() => {
      fetchLoansData();
  }, [fetchLoansData]);
  
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
                  <p>• Next Milestone: {loansData.eligibility.next_milestone?.purchases_needed} more purchases for ₦{loansData.eligibility.next_milestone?.amount_unlock.toLocaleString()}</p>
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
                    <Badge variant={loan.status === 'completed' ? 'success' : 'waiting'}>
                      {loan.status}
                    </Badge>
                    {loan.status === 'active' && (
                      <p className="text-sm text-gray-500 mt-1">
                        Remaining: ₦{loan.amount?.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
  
        <LoanForm
          accountType={accountType}
          showLoanForm={showLoanForm}
          setShowLoanForm={setShowLoanForm}
          loanAmount={loanAmount}
          setLoanAmount={setLoanAmount}
          loanPurpose={loanPurpose}
          setLoanPurpose={setLoanPurpose}
          availableAmount={loansData.eligibility.available_amount}
          onSubmit={handleLoanRequest}
        />
      </div>
    );
  };