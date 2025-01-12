import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Clock, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogAction } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";
import { apiBaseUrl } from '@/config';

// Custom formatted input components
const PhoneNumberInput = ({ value, onChange, ...props }) => {
  const handleChange = (e) => {
    const input = e.target.value;
    const digits = input.replace(/\D/g, '');
    
    if (digits.length <= 10 && !digits.startsWith('0')) {
      onChange(digits);
    }
  };

  return (
    <div className="relative">
      <Input
        type="tel"
        value={value}
        onChange={handleChange}
        maxLength={10}
        placeholder="9025678712"
        {...props}
      />
      {value && value.length !== 10 && (
        <div className="text-xs text-red-500 mt-1">
          Please enter 10 digits without leading zero
        </div>
      )}
    </div>
  );
};

const CurrencyInput = ({ value, onChange, ...props }) => {
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const unformatNumber = (str) => {
    return str.replace(/,/g, '');
  };

  const handleChange = (e) => {
    const input = e.target.value;
    const digits = input.replace(/[^\d,]/g, '');
    const unformatted = unformatNumber(digits);
    
    if (unformatted === '' || /^\d+$/.test(unformatted)) {
      const formatted = formatNumber(unformatted);
      onChange(formatted);
    }
  };

  return (
    <Input
      type="text"
      value={value}
      onChange={handleChange}
      placeholder="Enter amount"
      {...props}
    />
  );
};

const AutomationForm = ({ isOpen, onClose, onSuccess, pools, accountType }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    schedule: '',
    amount: '',
    percentage: '',
    source_pool_id: '',
    transfer_type: '',
    bank_type: '',
    destination_phone: '',
    destination_account_type: '',
    destination_bank_name: '',
    destination_account_number: '',
    destination_account_name: '',
    destination_pool_id: '',
    execution_time: "07:00", // 7 am default
    day_of_week: "5", // Saturday default
    day_of_month: "30", // Last day default
  });

  const handleCreateAutomation = async () => {
    try {
      const activeView = accountType === "Individual" ? "personal" : "business";

      const scheduleDetails = {
        execution_time: formData.execution_time,
        day_of_week: formData.schedule === "weekly" || formData.schedule === "biweekly" 
          ? parseInt(formData.day_of_week) 
          : null,
        day_of_month: formData.schedule === "monthly" 
          ? parseInt(formData.day_of_month) 
          : null
      };
      
      const automationData = {
        name: formData.name,
        type: formData.type,
        schedule: formData.schedule,
        source_pool_id: formData.source_pool_id,
        amount: formData.transfer_type === 'fixed' ? formData.amount.replace(/,/g, '') : null,
        percentage: formData.transfer_type === 'percentage' ? formData.percentage : null,
        schedule_details: scheduleDetails
      };

      if (formData.type === 'pool_transfer') {
        automationData.destination_pool_id = formData.destination_pool_id;
      } else {
        if (formData.bank_type === 'bam') {
          automationData.destination_bam_details = {
            phone: formData.destination_phone,
            account_type: formData.destination_account_type
          };
        } else {
          automationData.destination_bank_details = {
            bank_name: formData.destination_bank_name,
            account_number: formData.destination_account_number,
            account_name: formData.destination_account_name
          };
        }
      }

      const response = await fetch(`${apiBaseUrl}/banking/automations?active_view=${activeView}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(automationData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create automation');
      }

      onSuccess();
      onClose();
      setFormData({
        name: '',
        type: '',
        schedule: '',
        amount: '',
        percentage: '',
        source_pool_id: '',
        transfer_type: '',
        bank_type: '',
        destination_phone: '',
        destination_account_type: '',
        destination_bank_name: '',
        destination_account_number: '',
        destination_account_name: '',
        destination_pool_id: '',
        execution_time: "07:00", // 7 am default
        day_of_week: "5", // Saturday default
        day_of_month: "30", // Last day default
      });

      toast({
        title: "Success",
        description: "Automation created successfully",
      });
    } catch (error) {
      console.error('Error creating automation:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const scheduleOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Bi-weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  const renderScheduleOptions = () => {
    switch (formData.schedule) {
      case 'daily':
        return (
          <div className="space-y-2">
            <Label>Time of Day</Label>
            <Input
              type="time"
              value={formData.execution_time}
              onChange={(e) => setFormData(prev => ({...prev, execution_time: e.target.value}))}
              placeholder="07:00"
            />
          </div>
        );

      case 'weekly':
      case 'biweekly':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Day of Week</Label>
              <Select
                value={formData.day_of_week}
                onValueChange={(value) => setFormData(prev => ({...prev, day_of_week: value}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sunday</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="2">Tuesday</SelectItem>
                  <SelectItem value="3">Wednesday</SelectItem>
                  <SelectItem value="4">Thursday</SelectItem>
                  <SelectItem value="5">Saturday</SelectItem>
                  <SelectItem value="6">Sunday</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Time of Day</Label>
              <Input
                type="time"
                value={formData.execution_time}
                onChange={(e) => setFormData(prev => ({...prev, execution_time: e.target.value}))}
                placeholder="07:00"
              />
            </div>
          </div>
        );

      case 'monthly':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Day of Month</Label>
              <Select
                value={formData.day_of_month}
                onValueChange={(value) => setFormData(prev => ({...prev, day_of_month: value}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(30)].map((_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {i + 1}{getOrdinalSuffix(i + 1)}
                    </SelectItem>
                  ))}
                  <SelectItem value="31">Last day</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Time of Day</Label>
              <Input
                type="time"
                value={formData.execution_time}
                onChange={(e) => setFormData(prev => ({...prev, execution_time: e.target.value}))}
                placeholder="07:00"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Helper function for ordinal suffixes
  const getOrdinalSuffix = (number) => {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = number % 100;
    return suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] h-[90vh] flex flex-col p-0">
        <DialogHeader>
          <DialogTitle>Create New Automation</DialogTitle>
          <DialogDescription>
            Set up automatic transfers between pools or to bank accounts
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-6">
          <div className="space-y-4 pb-6">
            <Label>Automation Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
              placeholder="E.g., Monthly Savings Transfer"
            />
          </div>

          <div className="space-y-2">
            <Label>Automation Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData(prev => ({...prev, type: value}))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="pool_transfer">Pool Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Source Pool</Label>
            <Select
              value={formData.source_pool_id}
              onValueChange={(value) => setFormData(prev => ({...prev, source_pool_id: value}))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select source pool" />
              </SelectTrigger>
              <SelectContent>
                {pools.map((pool) => (
                  <SelectItem key={pool.id} value={pool.id}>
                    {pool.name} - ₦{pool.balance?.toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.type === 'pool_transfer' ? (
              <div className="space-y-2">
                <Label>Destination Pool</Label>
                <Select
                  value={formData.destination_pool_id}
                  onValueChange={(value) => setFormData(prev => ({...prev, destination_pool_id: value}))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination pool" />
                  </SelectTrigger>
                  <SelectContent>
                    {pools
                      .filter(pool => pool.id !== formData.source_pool_id)
                      .map((pool) => (
                        <SelectItem key={pool.id} value={pool.id}>
                          {pool.name} - ₦{pool.balance?.toLocaleString()}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Bank Type</Label>
                  <Select
                    value={formData.bank_type}
                    onValueChange={(value) => setFormData(prev => ({...prev, bank_type: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select bank type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bam">BAM Bank</SelectItem>
                      <SelectItem value="external">External Bank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.bank_type === 'bam' ? (
                  <>
                    <div className="space-y-2">
                      <Label>Recipient's Phone Number</Label>
                      <PhoneNumberInput
                        value={formData.destination_phone}
                        onChange={(value) => setFormData(prev => ({...prev, destination_phone: value}))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Recipient's Account Type</Label>
                      <Select
                        value={formData.destination_account_type}
                        onValueChange={(value) => setFormData(prev => ({...prev, destination_account_type: value}))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="personal">Personal Account</SelectItem>
                          <SelectItem value="business">Business Account</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : formData.bank_type === 'external' && (
                  <>
                    <div className="space-y-2">
                      <Label>Bank Name</Label>
                      <Input
                        value={formData.destination_bank_name}
                        onChange={(e) => setFormData(prev => ({...prev, destination_bank_name: e.target.value}))}
                        placeholder="Enter bank name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Account Number</Label>
                      <Input
                        value={formData.destination_account_number}
                        onChange={(e) => setFormData(prev => ({...prev, destination_account_number: e.target.value}))}
                        placeholder="Enter account number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Account Name</Label>
                      <Input
                        value={formData.destination_account_name}
                        onChange={(e) => setFormData(prev => ({...prev, destination_account_name: e.target.value}))}
                        placeholder="Enter account name"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            <div className="space-y-2">
              <Label>Transfer Type</Label>
              <Select
                value={formData.transfer_type}
                onValueChange={(value) => setFormData(prev => ({...prev, transfer_type: value}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select transfer type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.transfer_type === 'fixed' ? (
              <div className="space-y-2">
                <Label>Amount</Label>
                <CurrencyInput
                  value={formData.amount}
                  onChange={(value) => setFormData(prev => ({...prev, amount: value}))}
                />
              </div>
            ) : formData.transfer_type === 'percentage' && (
              <div className="space-y-2">
                <Label>Percentage</Label>
                <Input
                  type="number"
                  value={formData.percentage}
                  onChange={(e) => setFormData(prev => ({...prev, percentage: e.target.value}))}
                  placeholder="Enter percentage"
                  min="0"
                  max="100"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Schedule</Label>
              <Select
                value={formData.schedule}
                onValueChange={(value) => setFormData(prev => ({...prev, schedule: value}))}
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
          
          {formData.schedule && renderScheduleOptions()}

        </div>
        
        <DialogFooter className="p-6 pt-0">
          <Button onClick={handleCreateAutomation}>
            Create Automation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const EditAutomationForm = ({ isOpen, onClose, onSuccess, automation }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    execution_time: "07:00",
    day_of_week: "5",
    day_of_month: "30",
    schedule: ''
  });

  useEffect(() => {
    if (automation) {
      setFormData({
        execution_time: automation.schedule_details?.execution_time || "07:00",
        day_of_week: automation.schedule_details?.day_of_week?.toString() || "5",
        day_of_month: automation.schedule_details?.day_of_month?.toString() || "30",
        schedule: automation.schedule || ''
      });
    }
  }, [automation]);

  const handleUpdateAutomation = async () => {
    try {
      const scheduleDetails = {
        execution_time: formData.execution_time,
        day_of_week: formData.schedule === "weekly" || formData.schedule === "biweekly" 
          ? parseInt(formData.day_of_week) 
          : null,
        day_of_month: formData.schedule === "monthly" 
          ? parseInt(formData.day_of_month) 
          : null
      };

      const response = await fetch(`${apiBaseUrl}/banking/automations/${automation.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          schedule: formData.schedule,
          schedule_details: scheduleDetails
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update automation');
      }

      onSuccess();
      onClose();
      toast({
        title: "Success",
        description: "Automation updated successfully",
      });
    } catch (error) {
      console.error('Error updating automation:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const scheduleOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Bi-weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  const renderScheduleOptions = () => {
    switch (formData.schedule) {
      case 'daily':
        return (
          <div className="space-y-2">
            <Label>Time of Day</Label>
            <Input
              type="time"
              value={formData.execution_time}
              onChange={(e) => setFormData(prev => ({...prev, execution_time: e.target.value}))}
              placeholder="07:00"
            />
          </div>
        );

      case 'weekly':
      case 'biweekly':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Day of Week</Label>
              <Select
                value={formData.day_of_week}
                onValueChange={(value) => setFormData(prev => ({...prev, day_of_week: value}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sunday</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="2">Tuesday</SelectItem>
                  <SelectItem value="3">Wednesday</SelectItem>
                  <SelectItem value="4">Thursday</SelectItem>
                  <SelectItem value="5">Saturday</SelectItem>
                  <SelectItem value="6">Sunday</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Time of Day</Label>
              <Input
                type="time"
                value={formData.execution_time}
                onChange={(e) => setFormData(prev => ({...prev, execution_time: e.target.value}))}
                placeholder="07:00"
              />
            </div>
          </div>
        );

      case 'monthly':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Day of Month</Label>
              <Select
                value={formData.day_of_month}
                onValueChange={(value) => setFormData(prev => ({...prev, day_of_month: value}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(30)].map((_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {i + 1}{getOrdinalSuffix(i + 1)}
                    </SelectItem>
                  ))}
                  <SelectItem value="31">Last day</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Time of Day</Label>
              <Input
                type="time"
                value={formData.execution_time}
                onChange={(e) => setFormData(prev => ({...prev, execution_time: e.target.value}))}
                placeholder="07:00"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Helper function for ordinal suffixes
  const getOrdinalSuffix = (number) => {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = number % 100;
    return suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Automation Schedule</DialogTitle>
          <DialogDescription>
            Modify the schedule for "{automation?.name}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Schedule</Label>
            <Select
              value={formData.schedule}
              onValueChange={(value) => setFormData(prev => ({...prev, schedule: value}))}
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
          
          {formData.schedule && renderScheduleOptions()}
        </div>
        
        <DialogFooter>
          <Button onClick={handleUpdateAutomation}>
            Update Automation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const AutomationTab = ({ accountType }) => {
  const [automations, setAutomations] = useState([]);
  const [showAutomationForm, setShowAutomationForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState(null);
  const [pools, setPools] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    schedule: '',
    amount: '',
    percentage: '',
    source_pool_id: '',
    transfer_type: '',
    bank_type: '',
    destination_phone: '',
    destination_account_type: '',
    destination_bank_name: '',
    destination_account_number: '',
    destination_account_name: '',
    destination_pool_id: ''
  });
  const { toast } = useToast();

  const fetchAutomations = useCallback(async () => {
    try {
      const activeView = accountType === "Individual" ? "personal" : "business";
      const response = await fetch(`${apiBaseUrl}/banking/automations?active_view=${activeView}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch automations');
      const data = await response.json();
      setAutomations(data);
    } catch (error) {
      console.error('Error fetching automations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch automations",
        variant: "destructive"
      });
    }
  }, [accountType, toast]);

  const fetchPools = useCallback(async () => {
    try {
      const activeView = accountType === "Individual" ? "personal" : "business";
      const response = await fetch(`${apiBaseUrl}/banking/pools/available?active_view=${activeView}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch pools');
      const data = await response.json();
      setPools(data);
    } catch (error) {
      console.error('Error fetching pools:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pools",
        variant: "destructive"
      });
    }
  }, [accountType, toast]);

  const handleEdit = (automation) => {
    setSelectedAutomation(automation);
    setShowEditForm(true);
  };

  const handleDelete = (automation) => {
    setSelectedAutomation(automation);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/banking/automations/${selectedAutomation.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete automation');

      setShowDeleteDialog(false);
      fetchAutomations();
      toast({
        title: "Success",
        description: "Automation deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting automation:', error);
      toast({
        title: "Error",
        description: "Failed to delete automation",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchAutomations();
    fetchPools();
  }, [fetchAutomations, fetchPools]);


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
                    {automation.type === 'bank_transfer' ? 
                      `₦${Number(automation.amount || 0).toLocaleString()} - ${automation.schedule}` :
                      `Pool Transfer - ${automation.schedule}`
                    }
                  </p>
                  <p className="text-sm text-gray-500">Next run: {new Date(automation.next_run).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={automation.is_active ? 'success' : 'destructive'}>
                  {automation.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(automation)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(automation)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    <AutomationForm
        isOpen={showAutomationForm}
        onClose={() => setShowAutomationForm(false)}
        onSuccess={fetchAutomations}
        pools={pools}
        accountType={accountType}
    />
    
    {selectedAutomation && (
      <EditAutomationForm
        isOpen={showEditForm}
        onClose={() => {
          setShowEditForm(false);
          setSelectedAutomation(null);
        }}
        onSuccess={fetchAutomations}
        automation={selectedAutomation}
      />
    )}

    <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Automation</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this automation? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
          </DialogClose>
          <Button variant="destructive" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
);
};

export default AutomationTab;