'use client';

import { useState, useEffect } from 'react';
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
import { Textarea } from "@/components/ui/textarea";

export default function AdminFeedback() {
  const [feedback, setFeedback] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [adminNotes, setAdminNotes] = useState('');
  const [updatedStatus, setUpdatedStatus] = useState(''); // New state for selected status
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchFeedback();
  }, [statusFilter]);

  const fetchFeedback = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = `http://localhost:8000/feedback/admin/feedback${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`;
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
      setFeedback(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch feedback",
        variant: "destructive",
      });
      setFeedback([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFeedbackStatus = async () => {
    if (!selectedFeedback) return;
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:8000/feedback/admin/feedback/${selectedFeedback.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: updatedStatus,
          admin_notes: adminNotes,
        }),
      });

      if (!response.ok) throw new Error('Update failed');

      toast({
        title: "Success",
        description: "Feedback status updated",
      });
      
      setSelectedFeedback(null);
      setAdminNotes('');
      setUpdatedStatus('');
      fetchFeedback();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update feedback status",
        variant: "destructive",
      });
    }
  };

  const getStatusStyles = (status) => {
    const baseStyles = "px-2 py-1 rounded-full text-sm inline-block";
    switch (status) {
      case 'resolved':
        return `${baseStyles} bg-green-100 text-green-800`;
      case 'in_progress':
        return `${baseStyles} bg-blue-100 text-blue-800`;
      default:
        return `${baseStyles} bg-yellow-100 text-yellow-800`;
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Feedback Management</h1>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin Notes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : feedback.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No feedback found
                  </td>
                </tr>
              ) : (
                feedback.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.phone || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={getStatusStyles(item.status)}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.admin_notes || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedFeedback(item);
                          setUpdatedStatus(item.status); // Set the initial status
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Dialog open={!!selectedFeedback} onOpenChange={() => setSelectedFeedback(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Feedback Status</DialogTitle>
              <DialogDescription></DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Message</h3>
                <p className="text-gray-600">{selectedFeedback?.message}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Update Status</h3>
                <Select
                  value={updatedStatus}
                  onValueChange={setUpdatedStatus} // Update the local state
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <h3 className="font-medium mb-2">Admin Notes</h3>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this feedback..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedFeedback(null)}>
                Cancel
              </Button>
              <Button onClick={updateFeedbackStatus}>
                Submit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
