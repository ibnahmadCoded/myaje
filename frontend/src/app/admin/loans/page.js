'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { apiBaseUrl } from '@/config';
import DashboardLayout from '@/components/admin/DashboardLayout';

export default function AdminLoans () {
  const [loans, setLoans] = useState([]);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/admin/loans`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch loans');
      const data = await response.json();
      setLoans(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch loans",
        variant: "destructive"
      });
    }
  };

  const handleAction = async () => {
    try {
      const url = actionType === 'accept' 
        ? `${apiBaseUrl}/admin/loans/${selectedLoan.id}/accept`
        : `${apiBaseUrl}/admin/loans/${selectedLoan.id}/reject`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(actionType === 'reject' ? { reason: rejectionReason } : {})
      });

      if (!response.ok) throw new Error('Failed to process loan');

      toast({
        title: "Success",
        description: `Loan ${actionType}ed successfully`
      });

      setShowActionModal(false);
      setSelectedLoan(null);
      setRejectionReason('');
      fetchLoans();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <DashboardLayout>
        <div className="space-y-6">
        <Card>
            <CardHeader>
            <CardTitle>Loan Requests</CardTitle>
            </CardHeader>
            <CardContent>
            <div className="space-y-4">
                {loans.map((loan) => (
                <div key={loan.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                    <p className="font-medium">₦{loan.amount.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">{loan.purpose}</p>
                    <p className="text-sm text-gray-500">{loan.user_email}</p>
                    <p className="text-sm text-gray-500">{loan.created_at}</p>
                    </div>
                    <div className="text-right space-y-2">
                    <Badge>{loan.status}</Badge>
                    {loan.status === 'pending' && (
                        <div className="space-x-2">
                        <Button 
                            variant="outline"
                            onClick={() => {
                            setSelectedLoan(loan);
                            setActionType('accept');
                            setShowActionModal(true);
                            }}
                        >
                            Accept
                        </Button>
                        <Button 
                            variant="destructive"
                            onClick={() => {
                            setSelectedLoan(loan);
                            setActionType('reject');
                            setShowActionModal(true);
                            }}
                        >
                            Reject
                        </Button>
                        </div>
                    )}
                    </div>
                </div>
                ))}
            </div>
            </CardContent>
        </Card>

        <Dialog open={showActionModal} onOpenChange={setShowActionModal}>
            <DialogContent>
            <DialogHeader>
                <DialogTitle>
                {actionType === 'accept' ? 'Accept' : 'Reject'} Loan Request
                </DialogTitle>
                <DialogDescription></DialogDescription>
            </DialogHeader>

            {actionType === 'reject' && (
                <div className="space-y-2">
                <Label>Rejection Reason</Label>
                <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason for rejection"
                />
                </div>
            )}

            <DialogFooter>
                <Button onClick={handleAction}>
                Confirm {actionType === 'accept' ? 'Acceptance' : 'Rejection'}
                </Button>
            </DialogFooter>
            </DialogContent>
        </Dialog>
        </div>
    </DashboardLayout>
  );
};