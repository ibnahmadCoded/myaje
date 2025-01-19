'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import DashboardLayout from '@/components/DashboardLayout';
import { Wallet, Search, RefreshCw, Clock, CheckCircle2, Building, PenSquare } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiBaseUrl } from '@/config';

const UserPayoutsPage = () => {
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPayout, setSelectedPayout] = useState(null);
  const { toast } = useToast();
  const [hasBankDetails, setHasBankDetails] = useState(false);
  const [bankDetails, setBankDetails] = useState(null);
  const [showBankDetailsForm, setShowBankDetailsForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchBankDetails();
  }, []);

  const fetchBankDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBaseUrl}/payouts/bank-details`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBankDetails(data);
        setHasBankDetails(true);
      }
    } catch (error) {
      console.error('Error fetching bank details:', error);
    }
  };

  const fetchPayouts = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const url = `${apiBaseUrl}/payouts/get_payouts${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch payouts');

      const data = await response.json();
      setPayouts(data);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to fetch payouts, ${error}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const filteredPayouts = payouts.filter(payout => 
    payout.order_details.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPending = payouts.reduce((sum, payout) => 
    payout.status === 'PENDING' ? sum + payout.amount : sum, 0
  );

  const totalPaid = payouts.reduce((sum, payout) => 
    payout.status === 'PAID' ? sum + payout.amount : sum, 0
  );

  const BankDetailsDisplay = () => {
    if (!bankDetails) return null;

    return (
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center space-x-2">
            <Building className="h-5 w-5 text-gray-500" />
            <CardTitle>Bank Account Details</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsEditing(true);
              setShowBankDetailsForm(true);
            }}
          >
            <PenSquare className="h-4 w-4 mr-2" />
            Edit Details
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Bank Name</p>
              <p className="font-medium">{bankDetails.bank_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Account Number</p>
              <p className="font-medium">{bankDetails.account_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Account Name</p>
              <p className="font-medium">{bankDetails.account_name}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const BankDetailsForm = ({ onSuccess }) => {
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState(
      isEditing ? bankDetails : {
        bank_name: '',
        account_number: '',
        account_name: ''
      }
    );
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setSaving(true);
  
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${apiBaseUrl}/payouts/bank-details`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
  
        if (!response.ok) throw new Error('Failed to save bank details');
  
        toast({
          title: "Success",
          description: "Bank details saved successfully",
        });
        
        await fetchBankDetails(); // Refresh bank details
        if (onSuccess) onSuccess();
        setShowBankDetailsForm(false);
        setIsEditing(false);
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to save bank details, ${error}`,
          variant: "destructive",
        });
      } finally {
        setSaving(false);
      }
    };
  
    return (
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Bank Name</label>
            <Input
              required
              value={formData.bank_name}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                bank_name: e.target.value
              }))}
              placeholder="Enter bank name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Account Number</label>
            <Input
              required
              value={formData.account_number}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                account_number: e.target.value
              }))}
              placeholder="Enter account number"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Account Name</label>
            <Input
              required
              value={formData.account_name}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                account_name: e.target.value
              }))}
              placeholder="Enter account name"
            />
          </div>
        </div>
        <DialogFooter className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowBankDetailsForm(false);
              setIsEditing(false);
            }}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Bank Details'}
          </Button>
        </DialogFooter>
      </form>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Payouts</h1>
        </div>

        {!hasBankDetails ? (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <h3 className="font-medium">Setup Your Payout Account</h3>
                  <p className="text-sm text-gray-500">Please add your bank details to receive payouts</p>
                </div>
                <Button onClick={() => setShowBankDetailsForm(true)}>
                  Add Bank Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <BankDetailsDisplay />
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
              <Wallet className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{totalPending.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{totalPaid.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payouts.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Search by customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PAID">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchPayouts}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        <Card>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Order ID</th>
                <th className="text-left p-4">Customer</th>
                <th className="text-left p-4">Amount</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Date</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center p-4">Loading...</td>
                </tr>
              ) : filteredPayouts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-4">No payouts found</td>
                </tr>
              ) : (
                filteredPayouts.map((payout) => (
                  <tr key={payout.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">#{payout.order_details.id}</td>
                    <td className="p-4">{payout.order_details.customer_name}</td>
                    <td className="p-4">₦{payout.amount.toLocaleString()}</td>
                    <td className="p-4">
                      <Badge variant={payout.status === 'PENDING' ? 'secondary' : 'default'}>
                        {payout.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      {format(new Date(payout.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="p-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPayout(payout)}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>

        <Dialog open={!!selectedPayout} onOpenChange={() => setSelectedPayout(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Payout Details</DialogTitle>
              <DialogDescription></DialogDescription>
            </DialogHeader>
            {selectedPayout && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Order Information</h3>
                    <p className="text-sm text-gray-600">Order ID: #{selectedPayout.order_details.id}</p>
                    <p className="text-sm text-gray-600">Status: {selectedPayout.order_details.status}</p>
                    <p className="text-sm text-gray-600">Amount: ₦{selectedPayout.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Customer Information</h3>
                    <p className="text-sm text-gray-600">Name: {selectedPayout.order_details.customer_name}</p>
                    <p className="text-sm text-gray-600">Email: {selectedPayout.order_details.customer_email}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedPayout(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showBankDetailsForm} onOpenChange={(open) => {
          setShowBankDetailsForm(open);
          if (!open) setIsEditing(false);
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Edit Bank Details' : 'Add Bank Details'}</DialogTitle>
            </DialogHeader>
            <BankDetailsForm onSuccess={() => {
              setShowBankDetailsForm(false);
              setHasBankDetails(true);
            }} />
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
};

export default UserPayoutsPage;