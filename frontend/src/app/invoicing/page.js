'use client';

import DashboardLayout from '@/components/DashboardLayout';
import React, { useState, useEffect, useCallback, memo } from 'react';
import { Search, FileText, Mail, Download, Loader2, PenLine, AlertCircle, RefreshCw, Building, Building2, CreditCard, Hash, Wallet } from 'lucide-react';
import { Table } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast"
import { apiBaseUrl } from '@/config';

const InvoicingPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generateInvoiceId, setGenerateInvoiceId] = useState(null);
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [dueDate, setDueDate] = useState('');
  const [accountDetails, setAccountDetails] = useState({
    bankName: '',
    accountName: '',
    accountNumber: '',
    sortCode: '',
    accountType: ''
  });
  const [isEditingAccount, setIsEditingAccount] = useState(false);

  const { toast } = useToast();


  useEffect(() => {
    fetchInvoices();
    fetchBankDetails();
  }, []); 

  const fetchInvoices = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/invoicing/requests`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setInvoices(data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch invoices. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchBankDetails = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/invoicing/get_bank_details`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      console.log(data)
      setAccountDetails(data);
      console.log(accountDetails)

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch account. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateInvoice = async (requestId) => {
    setGenerateInvoiceId(requestId);
    setShowGenerateDialog(true);
  };

  const handleGenerateConfirm = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`${apiBaseUrl}/invoicing/generate/${generateInvoiceId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_terms: paymentTerms,
          due_date: dueDate || undefined,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        toast({
          title: "Success",
          description: "Invoice generated successfully",
        });
        setShowGenerateDialog(false);
        fetchInvoices();
      } else {
        throw new Error(data.detail);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate invoice",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResendEmail = async (invoiceId) => {
    setIsSendingEmail(true);
    try {
      const response = await fetch(`${apiBaseUrl}/invoicing/${invoiceId}/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to send email');
      
      toast({
        title: "Success",
        description: "Invoice sent to customer's email",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const getStatusBadgeVariant = (status) => {
    const variants = {
      'paid': 'default',
      'sent': 'waiting',
      'generated': 'secondary',
      'pending': 'destructive'
    };
    return variants[status] || 'default';
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Function to generate PDF from invoice data
  const handleDownloadPDF = (invoice) => {
    // Create a printable div
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoice_number}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .invoice-details { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px; border: 1px solid #ddd; }
            .footer { margin-top: 30px; }
            .account-details { margin-top: 20px; border-top: 1px solid #ddd; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>INVOICE</h1>
            <p>Invoice #: ${invoice.invoice_number}</p>
            <p>Date: ${new Date(invoice.created_at).toLocaleDateString()}</p>
          </div>
          
          <div class="invoice-details">
            <h3>Bill To:</h3>
            <p>${invoice.customer_name}</p>
            <p>${invoice.customer_email}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>₦${item.price.toLocaleString()}</td>
                  <td>₦${(item.quantity * item.price).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <h3>Total Amount: ₦${invoice.amount.toLocaleString()}</h3>
          </div>

          <div class="account-details">
            <h3>Payment Details:</h3>
            <p>Account Name: ${accountDetails.accountName}</p>
            <p>Account Number: ${accountDetails.accountNumber}</p>
            <p>Bank Name: ${accountDetails.bankName}</p>
          </div>
        </body>
      </html>
    `;

    // Create a Blob
    const blob = new Blob([printContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Create an iframe to print
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute';
    printFrame.style.top = '-9999px';
    document.body.appendChild(printFrame);
    
    printFrame.contentWindow.document.open();
    printFrame.contentWindow.document.write(printContent);
    printFrame.contentWindow.document.close();

    // Wait for content to load then print
    printFrame.onload = () => {
      printFrame.contentWindow.print();
      document.body.removeChild(printFrame);
      URL.revokeObjectURL(url);
    };
  };

  const StatusCard = ({ title, count, color, icon: Icon }) => (
    <Card className={`p-4 bg-${color}-50 hover:bg-${color}-100 transition-colors cursor-pointer`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full bg-${color}-100`}>
          <Icon className={`h-5 w-5 text-${color}-600`} />
        </div>
        <div>
          <div className="text-sm font-medium text-gray-600">{title}</div>
          <div className={`text-2xl font-bold text-${color}-600`}>{count}</div>
        </div>
      </div>
    </Card>
  );

  const handleAccountUpdate = async (formData) => {
    try {
      const response = await fetch(`${apiBaseUrl}/invoicing/save_bank_details`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) throw new Error('Failed to update account details');
      
      //const data = await response.json();
      fetchBankDetails();
      setIsEditingAccount(false);
      toast({
        title: "Success",
        description: "Account details updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update account details",
        variant: "destructive",
      });
    }
  };

  const AccountDetailsForm = ({ onSubmit, onCancel, initialData }) => {
    const [formData, setFormData] = useState({
      accountName: initialData.accountName || "",
      accountNumber: initialData.accountNumber || "",
      bankName: initialData.bankName || "",
      sortCode: initialData.sortCode || "",
      accountType: initialData.accountType || "",
    });
  
    const handleChange = (field) => (e) => {
      setFormData(prev => ({
        ...prev,
        [field]: e.target.value
      }));
    };
  
    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
    };
  
    return (
      <form onSubmit={handleSubmit}>
        <Card className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="relative">
              <Label htmlFor="accountName" className="flex items-center gap-2 text-gray-600">
                <Building className="h-4 w-4" />
                Account Name
              </Label>
              <Input
                id="accountName"
                value={formData.accountName}
                onChange={handleChange("accountName")}
                className="mt-1"
              />
            </div>
            <div className="relative">
              <Label htmlFor="accountNumber" className="flex items-center gap-2 text-gray-600">
                <CreditCard className="h-4 w-4" />
                Account Number
              </Label>
              <Input
                id="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange("accountNumber")}
                className="mt-1"
              />
            </div>
            <div className="relative">
              <Label htmlFor="bankName" className="flex items-center gap-2 text-gray-600">
                <Building2 className="h-4 w-4" />
                Bank Name
              </Label>
              <Input
                id="bankName"
                value={formData.bankName}
                onChange={handleChange("bankName")}
                className="mt-1"
              />
            </div>
            <div className="relative">
              <Label htmlFor="sortCode" className="flex items-center gap-2 text-gray-600">
                <Hash className="h-4 w-4" />
                Sort Code
              </Label>
              <Input
                id="sortCode"
                value={formData.sortCode}
                onChange={handleChange("sortCode")}
                className="mt-1"
              />
            </div>
            <div className="relative">
              <Label htmlFor="accountType" className="flex items-center gap-2 text-gray-600">
                <Wallet className="h-4 w-4" />
                Account Type
              </Label>
              <Input
                id="accountType"
                value={formData.accountType}
                onChange={handleChange("accountType")}
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              Save Changes
            </Button>
          </div>
        </Card>
      </form>
    );
  };

  const AccountDetailsView = ({ accountDetails, onEdit }) => (
    <Card className="p-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="relative">
          <Label className="flex items-center gap-2 text-gray-600">
            <Building className="h-4 w-4" />
            Account Name
          </Label>
          <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
            <p className="font-medium">{accountDetails.accountName || "Not set"}</p>
          </div>
        </div>
        <div className="relative">
          <Label className="flex items-center gap-2 text-gray-600">
            <CreditCard className="h-4 w-4" />
            Account Number
          </Label>
          <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
            <p className="font-medium">{accountDetails.accountNumber || "Not set"}</p>
          </div>
        </div>
        <div className="relative">
          <Label className="flex items-center gap-2 text-gray-600">
            <Building2 className="h-4 w-4" />
            Bank Name
          </Label>
          <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
            <p className="font-medium">{accountDetails.bankName || "Not set"}</p>
          </div>
        </div>
        <div className="relative">
          <Label className="flex items-center gap-2 text-gray-600">
            <Hash className="h-4 w-4" />
            Sort Code
          </Label>
          <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
            <p className="font-medium">{accountDetails.sortCode || "Not set"}</p>
          </div>
        </div>
        <div className="relative">
          <Label className="flex items-center gap-2 text-gray-600">
            <Wallet className="h-4 w-4" />
            Account Type
          </Label>
          <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
            <p className="font-medium">{accountDetails.accountType || "Not set"}</p>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
      <Tabs defaultValue="invoices" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="account">Account Details</TabsTrigger>
          </TabsList>

          <TabsContent value="invoices" className="space-y-6">
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatusCard 
                  title="Total Invoices" 
                  count={invoices.length} 
                  color="blue"
                  icon={FileText}
                />
                <StatusCard 
                  title="Paid Invoices" 
                  count={invoices.filter(i => i.status === 'paid').length} 
                  color="green"
                  icon={FileText}
                />
                <StatusCard 
                  title="Pending" 
                  count={invoices.filter(i => i.status === 'pending').length} 
                  color="yellow"
                  icon={AlertCircle}
                />
                <StatusCard 
                  title="Generated" 
                  count={invoices.filter(i => i.status === 'generated').length} 
                  color="purple"
                  icon={FileText}
                />
              </div>

              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                  <Input
                    type="text"
                    placeholder="Search invoices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="generated">Generated</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  onClick={fetchInvoices}
                  className="whitespace-nowrap"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>

              {filteredInvoices.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No invoices found matching your criteria
                  </AlertDescription>
                </Alert>
              ) : (
                <Card>
                  <Table>
                    <thead>
                      <tr className="bg-gray-50">
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
                        <tr key={invoice.id} className="border-t hover:bg-gray-50">
                          <td className="p-4">{invoice.invoice_number || 'Not Generated'}</td>
                          <td className="p-4">{invoice.customer_name}</td>
                          <td className="p-4">₦{invoice.amount.toLocaleString()}</td>
                          <td className="p-4">
                            <Badge variant={getStatusBadgeVariant(invoice.status)}>
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
                                <FileText className="mr-2 h-4 w-4" />
                                Generate
                              </Button>
                            )}
                              
                              {['generated', 'sent', 'paid'].includes(invoice.status) && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDownloadPDF(invoice)}
                                    disabled={isDownloading}
                                  >
                                    {isDownloading ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <Download className="mr-2 h-4 w-4" />
                                    )}
                                    Download
                                  </Button>
                                  
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleResendEmail(invoice.id)}
                                    disabled={isSendingEmail}
                                  >
                                    {isSendingEmail ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <Mail className="mr-2 h-4 w-4" />
                                    )}
                                    Resend
                                  </Button>
                                </>
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
                </Card>
              )}
            </div>
          </TabsContent>

          
          <TabsContent value="account">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Banking Details</h2>
                <Button
                  onClick={() => setIsEditingAccount(!isEditingAccount)}
                  variant={isEditingAccount ? "destructive" : "outline"}
                  className="gap-2"
                >
                  <PenLine className="h-4 w-4" />
                  {isEditingAccount ? 'Cancel Editing' : 'Edit Details'}
                </Button>
              </div>

              {!accountDetails.accountNumber && !isEditingAccount && (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertDescription className="text-yellow-800">
                    Please complete your banking information to ensure proper invoice processing
                  </AlertDescription>
                </Alert>
              )}

              {isEditingAccount ? (
                <AccountDetailsForm
                  initialData={accountDetails}
                  onSubmit={handleAccountUpdate}
                  onCancel={() => setIsEditingAccount(false)}
                />
              ) : (
                <AccountDetailsView
                  accountDetails={accountDetails}
                  onEdit={() => setIsEditingAccount(true)}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>

          <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Invoice Details</DialogTitle>
                <DialogDescription>Please review the details of the invoice</DialogDescription>
              </DialogHeader>
              {selectedInvoice && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <Card className="p-4 space-y-2">
                      <h3 className="font-semibold text-lg">Invoice Information</h3>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">Invoice Number</p>
                        <p className="font-medium">{selectedInvoice.invoice_number || 'Not Generated'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">Status</p>
                        <Badge variant={getStatusBadgeVariant(selectedInvoice.status)}>
                          {selectedInvoice.status}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">Date</p>
                        <p className="font-medium">{new Date(selectedInvoice.date).toLocaleDateString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">Amount</p>
                        <p className="font-medium">₦{selectedInvoice.amount.toLocaleString()}</p>
                      </div>
                    </Card>
                    
                    <Card className="p-4 space-y-2">
                      <h3 className="font-semibold text-lg">Customer Information</h3>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-medium">{selectedInvoice.customer_name}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">{selectedInvoice.customer_email}</p>
                      </div>
                    </Card>
                  </div>
                  
                  <Card className="p-4">
                    <h3 className="font-semibold text-lg mb-4">Items</h3>
                    <Table>
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="p-2">Item</th>
                          <th className="p-2">Quantity</th>
                          <th className="p-2">Price</th>
                          <th className="p-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.items.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-2">{item.name}</td>
                            <td className="p-2">{item.quantity}</td>
                            <td className="p-2">₦{item.price.toLocaleString()}</td>
                            <td className="p-2">₦{(item.quantity * item.price).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card>
                </div>
              )}
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setShowInvoiceDialog(false)}>
                  Close
                </Button>
                {selectedInvoice?.status !== 'pending' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleDownloadPDF(selectedInvoice)}
                      disabled={isDownloading}
                    >
                      {isDownloading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      Download PDF
                    </Button>
                    <Button
                      onClick={() => handleResendEmail(selectedInvoice.id)}
                      disabled={isSendingEmail}
                    >
                      {isSendingEmail ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="mr-2 h-4 w-4" />
                      )}
                      Resend Email
                    </Button>
                  </>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Generate Invoice Dialog */}
          <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Generate Invoice</DialogTitle>
                <DialogDescription>Invoice Generation</DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Select
                    value={paymentTerms}
                    onValueChange={setPaymentTerms}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Net 30">Net 30</SelectItem>
                      <SelectItem value="Net 15">Net 15</SelectItem>
                      <SelectItem value="Net 45">Net 45</SelectItem>
                      <SelectItem value="Net 60">Net 60</SelectItem>
                      <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="dueDate">Due Date (Optional)</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowGenerateDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateConfirm}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4" />
                  )}
                  Generate Invoice
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
      </div>
    </DashboardLayout>
  );
};

export default InvoicingPage;
