'use client';

import DashboardLayout from '@/components/DashboardLayout';
import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Table } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Invoice Management Page Component
const InvoicingPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await fetch('http://localhost:8000/invoicing/requests', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();

      console.log(data)
  
      // Ensure the data is an array before setting state
      if (Array.isArray(data)) {
        setInvoices(data);
      } else {
        console.error('API did not return an array of invoices:', data);
        setInvoices([]);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setInvoices([]); // Fallback to an empty array
    }
  };

  const handleGenerateInvoice = async (requestId) => {
    setIsGenerating(true);
    try {
      const response = await fetch(`http://localhost:8000/api/invoices/generate/${requestId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      fetchInvoices(); // Refresh the list
      setIsGenerating(false);
    } catch (error) {
      console.error('Error generating invoice:', error);
      setIsGenerating(false);
    }
  };

  const handleMarkAsPaid = async (invoiceId) => {
    try {
      await fetch(`http://localhost:8000/api/invoices/${invoiceId}/mark-paid`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      fetchInvoices(); // Refresh the list
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoice Management</h1>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Input
            type="text"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="generated">Generated</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <thead>
            <tr>
              <th className="p-4 text-left">Invoice #</th>
              <th className="p-4 text-left">Customer</th>
              <th className="p-4 text-left">Amount</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Date</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.id} className="border-t">
                <td className="p-4">{invoice.invoice_number || 'Not Generated'}</td>
                <td className="p-4">{invoice.customer_name}</td>
                <td className="p-4">₦{invoice.amount.toLocaleString()}</td>
                <td className="p-4">
                  <Badge variant={
                    invoice.status === 'paid' ? 'deafult' :
                    invoice.status === 'sent' ? 'waiting' :
                    invoice.status === 'pending' ? 'destructive' : 'default'
                  }>
                    {invoice.status}
                  </Badge>
                </td>
                <td className="p-4">{new Date(invoice.created_at).toLocaleDateString()}</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    {invoice.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => handleGenerateInvoice(invoice.id)}
                        disabled={isGenerating}
                      >
                        Generate
                      </Button>
                    )}
                    {invoice.status === 'generated' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAsPaid(invoice.id)}
                      >
                        Mark as Paid
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedInvoice(invoice);
                        setShowInvoiceDialog(true);
                      }}
                    >
                      View
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Invoice Information</h3>
                  <p>Invoice #: {selectedInvoice.invoice_number || 'Not Generated'}</p>
                  <p>Status: {selectedInvoice.status}</p>
                  <p>Date: {new Date(selectedInvoice.date).toLocaleDateString()}</p>
                  <p>Amount: ₦{selectedInvoice.amount.toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Customer Information</h3>
                  <p>Name: {selectedInvoice.customer_name}</p>
                  <p>Email: {selectedInvoice.customer_email}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Items</h3>
                <Table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td>₦{item.price.toLocaleString()}</td>
                        <td>₦{(item.quantity * item.price).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvoiceDialog(false)}>
              Close
            </Button>
            {selectedInvoice?.status === 'generated' && (
              <Button onClick={() => window.print()}>
                Print Invoice
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </DashboardLayout>
  );
};

export default InvoicingPage;