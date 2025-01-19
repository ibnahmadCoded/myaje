'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from '@/components/admin/DashboardLayout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { apiBaseUrl } from '@/config';

export default function AdminPayoutManagement() {
  const [payouts, setPayouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [selectedMarketplaceOrder, setSelectedMarketplaceOrder] = useState(null);
  const [relatedOrders, setRelatedOrders] = useState([]);
  const [relatedPayouts, setRelatedPayouts] = useState([]);
  const router = useRouter();
  const { toast } = useToast();

  const fetchPayouts = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = `${apiBaseUrl}/admin/payouts${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }

      const data = await response.json();
      setPayouts(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to fetch payouts, ${error}`,
        variant: "destructive",
      });
      setPayouts([]);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, router, toast]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const markPayoutAsCompleted = async (payoutId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBaseUrl}/admin/payouts/${payoutId}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Update failed');

      toast({
        title: "Success",
        description: "Payout marked as completed",
      });
      
      fetchPayouts();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update payout status, ${error}`,
        variant: "destructive",
      });
    }
  };

  const fetchMarketplaceOrderDetails = async (marketplaceOrderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBaseUrl}/admin/payouts/marketplace-orders/${marketplaceOrderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
  
      if (!response.ok) throw new Error('Failed to fetch marketplace order details');
  
      const data = await response.json();
      setSelectedMarketplaceOrder(data);
      setRelatedOrders(data.orders || []);
      setRelatedPayouts(data.payouts || []);
    } catch (error) {
      console.error('Error:', error); // Add this debug log
      toast({
        title: "Error",
        description: "Failed to fetch marketplace order details",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Payout Management</h1>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PAID">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marketplace Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : payouts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No payouts found
                  </td>
                </tr>
              ) : (
                payouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(payout.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>{payout.seller_email}</div>
                      <div className="text-gray-500">{payout.seller_phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₦{payout.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Button 
                        variant="link" 
                        onClick={() => setSelectedPayout(payout)}
                      >
                        #{payout.order_id}
                      </Button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Button 
                        variant="link"
                        onClick={() => fetchMarketplaceOrderDetails(payout.marketplace_order_id)}
                      >
                        #{payout.marketplace_order_id}
                      </Button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Badge variant={payout.status === 'PENDING' ? 'secondary' : 'default'}>
                        {payout.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {payout.status === 'PENDING' && (
                        <Button
                          variant="outline"
                          onClick={() => markPayoutAsCompleted(payout.id)}
                        >
                          Mark as Paid
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Payout Details Dialog */}
        <Dialog open={!!selectedPayout} onOpenChange={() => setSelectedPayout(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Payout Details</DialogTitle>
              <DialogDescription>
                Order #{selectedPayout?.order_id}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Seller Information</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Email:</strong> {selectedPayout?.seller_email}</p>
                    <p><strong>Phone:</strong> {selectedPayout?.seller_phone}</p>
                    {selectedPayout?.bank_details && (
                      <>
                        <p><strong>Bank:</strong> {selectedPayout.bank_details.bank_name}</p>
                        <p><strong>Account:</strong> {selectedPayout.bank_details.account_number}</p>
                        <p><strong>Account Name:</strong> {selectedPayout.bank_details.account_name}</p>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Order Information</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Order Amount:</strong> ₦{selectedPayout?.amount.toLocaleString()}</p>
                    <p><strong>Created:</strong> {selectedPayout?.created_at && 
                      new Date(selectedPayout.created_at).toLocaleDateString()}</p>
                    <p><strong>Status:</strong> {selectedPayout?.status}</p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedPayout(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Marketplace Order Details Dialog */}
        <Dialog 
          open={!!selectedMarketplaceOrder} 
          onOpenChange={() => setSelectedMarketplaceOrder(null)}
        >
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Marketplace Order Details</DialogTitle>
              <DialogDescription>
                Order #{selectedMarketplaceOrder?.id}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-3">Customer Information</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Name:</strong> {selectedMarketplaceOrder?.customer_name}</p>
                  <p><strong>Email:</strong> {selectedMarketplaceOrder?.customer_email}</p>
                  <p><strong>Phone:</strong> {selectedMarketplaceOrder?.customer_phone}</p>
                  <p><strong>Address:</strong> {selectedMarketplaceOrder?.shipping_address}</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">Related Orders</h3>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Order ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Seller</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {relatedOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-4 py-2 text-sm">#{order.id}</td>
                        <td className="px-4 py-2 text-sm">{order.seller_email}</td>
                        <td className="px-4 py-2 text-sm">₦{order.total_amount.toLocaleString()}</td>
                        <td className="px-4 py-2 text-sm">
                          <Badge variant={order.status === 'pending' ? 'secondary' : 'default'}>
                            {order.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h3 className="font-medium mb-3">Related Payouts</h3>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Payout ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Seller</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {relatedPayouts.map((payout) => (
                      <tr key={payout.id}>
                        <td className="px-4 py-2 text-sm">#{payout.id}</td>
                        <td className="px-4 py-2 text-sm">{payout.seller_email}</td>
                        <td className="px-4 py-2 text-sm">₦{payout.amount.toLocaleString()}</td>
                        <td className="px-4 py-2 text-sm">
                          <Badge variant={payout.status === 'PENDING' ? 'secondary' : 'default'}>
                            {payout.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedMarketplaceOrder(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}