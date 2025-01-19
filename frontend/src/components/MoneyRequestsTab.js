import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowRightLeft, Check, X } from 'lucide-react';
import { apiBaseUrl } from '@/config';

const RejectRequestDialog = ({ isOpen, onClose, onReject }) => {
  const [reason, setReason] = useState("");

  const handleReject = () => {
    onReject(reason);
    setReason("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Money Request</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="Reason for rejection (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={handleReject}>Reject</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const MoneyRequestsTab = () => {
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [pools, setPools] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isPoolModalOpen, setIsPoolModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [requestToReject, setRequestToReject] = useState(null);
  const { toast } = useToast();
  
  const [userView, setUserView] = useState("");
  
  useEffect(() => {
    const userDataStr = localStorage.getItem('user');
    if (userDataStr) {
      const user = JSON.parse(userDataStr);
      setUserView(user.active_view);
    }
  }, []);

  const fetchPools = useCallback(async () => {
    if (!userView) return;
    
    try {
      const response = await fetch(`${apiBaseUrl}/banking/pools/available?active_view=${userView}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPools(data);
      }
    } catch (error) {
      console.error('Error fetching pools:', error);
    }
  }, [userView]);

  const fetchRequests = useCallback(async () => {
    if (!userView) return;

    try {
      const [receivedRes, sentRes] = await Promise.all([
        fetch(`${apiBaseUrl}/banking/money-requests/received?user_view=${userView}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }),
        fetch(`${apiBaseUrl}/banking/money-requests/sent?user_view=${userView}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
      ]);

      if (receivedRes.ok && sentRes.ok) {
        const [received, sent] = await Promise.all([
          receivedRes.json(),
          sentRes.json()
        ]);
        setReceivedRequests(received);
        setSentRequests(sent);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  }, [userView]);

  useEffect(() => {
    fetchRequests();
    fetchPools();
  }, [fetchPools, fetchRequests]);

  const handleAcceptRequest = async (poolId) => {
    try {
      console.log('Request details:', {
        url: `${apiBaseUrl}/banking/money-requests/${parseInt(selectedRequest.id, 10)}/accept`,
        poolId: parseInt(poolId, 10),
        selectedRequest
      });

      const response = await fetch(
        `${apiBaseUrl}/banking/money-requests/${parseInt(selectedRequest.id, 10)}/accept`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(parseInt(poolId, 10))
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to accept request');
      }

      toast({
        title: "Success",
        description: "Request accepted successfully"
      });

      setIsPoolModalOpen(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      console.error('Full error:', error);

      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleRequestAction = async (request, action) => {
    if (action === 'accept') {
      setSelectedRequest(request);
      setIsPoolModalOpen(true);
      return;
    }
    
    if (action === 'reject') {
      setRequestToReject(request);
      setIsRejectModalOpen(true);
      return;
    }
  };

  const handleRejectRequest = async (reason) => {
    try {
      const response = await fetch(
        `${apiBaseUrl}/banking/money-requests/${requestToReject.id}/reject`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(reason)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to reject request');
      }

      toast({
        title: "Success",
        description: "Request rejected successfully"
      });

      fetchRequests();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
    
    setRequestToReject(null);
  };

  const RequestCard = ({ request, type }) => (
    <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            <p className="font-medium">
              {type === 'received' ? 
                `Request from ${request.requester_email}` :
                `Request to ${request.requested_from_email}`}
            </p>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {request.description || 'No description provided'}
          </p>
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
            <span>{new Date(request.created_at).toLocaleDateString()}</span>
            <span>•</span>
            <span>Expires: {new Date(request.expires_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <p className="font-bold">₦{request.amount.toLocaleString()}</p>
          <Badge variant={
            request.status === 'pending' ? 'waiting' :
            request.status === 'accepted' ? 'success' :
            'destructive'
          }>
            {request.status}
          </Badge>
          {type === 'received' && request.status === 'pending' && (
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRequestAction(request, 'accept')}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRequestAction(request, 'reject')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const sortedReceivedRequests = [...receivedRequests].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Received Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedReceivedRequests.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No received requests
              </p>
            ) : (
              sortedReceivedRequests.map(request => (
                <RequestCard
                  key={request.id}
                  request={request}
                  type="received"
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sent Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sentRequests.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No sent requests
              </p>
            ) : (
              sentRequests.map(request => (
                <RequestCard
                  key={request.id}
                  request={request}
                  type="sent"
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isPoolModalOpen} onOpenChange={setIsPoolModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Pool for Payment</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {pools.map(pool => (
              <Button
                key={pool.id}
                variant="outline"
                className="w-full justify-between"
                onClick={() => handleAcceptRequest(pool.id)}
                disabled={pool.balance < (selectedRequest?.amount || 0)}
              >
                <span>{pool.name}</span>
                <span>₦{pool.balance.toLocaleString()}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <RejectRequestDialog
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onReject={handleRejectRequest}
      />
    </div>
  );
};

export default MoneyRequestsTab;