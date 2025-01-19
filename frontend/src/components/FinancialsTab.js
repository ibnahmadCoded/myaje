import React, { useState, useEffect, useCallback } from 'react';
import { 
  PiggyBank, Pencil, Plus, Trash2, Save,
  ChevronDown, BanknoteIcon
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiBaseUrl } from '@/config';

export const FinancialsTab = () => {
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [pools, setPools] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [newPoolName, setNewPoolName] = useState('');
  const [newPoolPercentage, setNewPoolPercentage] = useState('');
  const [creditPool, setCreditPool] = useState(null);
  const [editingPool, setEditingPool] = useState(null);
  const [isUpdatingPools, setIsUpdatingPools] = useState(false);
  const [userData, setUserData] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
      const userDataStr = localStorage.getItem('user');
      if (userDataStr) {
        const parsedUser = JSON.parse(userDataStr);
        setUserData(parsedUser);
      }
    }, []); // Initial load

  if(selectedTemplate){
    //console.log("")
  }

  if(editingPool){
    //console.log("")
  }

  const templates = {
    personal: {
      name: 'Personal Template',
      pools: [
        { 'id': 1, name: 'Savings Pool', percentage: 30, balance: 0.00, is_locked: false },
        { 'id': 2, name: 'Investments Pool', percentage: 20, balance: 0.00, is_locked: false },
        { 'id': 3, name: 'Expenses Pool', percentage: 40, balance: 0.00, is_locked: false },
        { 'id': 4, name: 'Miscellaneous Pool', percentage: 10, balance: 0.00, is_locked: false }
      ]
    },
    business: {
      name: 'Business Template',
      pools: [
        { 'id': 1, name: 'Operations Pool', percentage: 40, balance: 0.00, is_locked: false },
        { 'id': 2, name: 'Salary Pool', percentage: 30, balance: 0.00, is_locked: false },
        { 'id': 3, name: 'Investment Pool', percentage: 20, balance: 0.00, is_locked: false },
        { 'id': 4, name: 'Emergency Pool', percentage: 10, balance: 0., is_locked: false }
      ]
    }
  };

  const fetchPools = useCallback(async () => {
    try {
      const userDataStr = localStorage.getItem('user');
      if (!userDataStr) return;
      
      const userData = JSON.parse(userDataStr);
      const response = await fetch(`${apiBaseUrl}/banking/pools/available?active_view=${userData.active_view}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch pools');
      
      const poolsData = await response.json();
      const creditPoolData = poolsData.find(pool => pool.is_credit_pool);
      const regularPools = poolsData.filter(pool => !pool.is_credit_pool);
      
      setCreditPool(creditPoolData);
      setPools(regularPools);
    } catch (error) {
      console.error('Error fetching pools:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pools data",
        variant: "destructive"
      });
    }
  }, []);

  const handleToggleLock = (poolId) => {
    const updatedPools = pools.map((pool) =>
      pool.id === poolId ? { ...pool, is_locked: !pool.is_locked } : pool
    );
    setPools(updatedPools);
  };

  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

  const handleTemplateSelect = (value) => {
    setSelectedTemplate(value);
    setPools(templates[value].pools);
    setIsEditMode(false);
  };

  const getTotalPercentage = () => {
    return pools.reduce((sum, pool) => sum + pool.percentage, 0);
  };

  const handleAddPool = () => {
    if (!newPoolName || !newPoolPercentage) return;
  
    // Check if the total percentage will exceed 100
    if (getTotalPercentage() + Number(newPoolPercentage) > 100) {
      toast({
        title: "Error",
        description: "Total percentage cannot exceed 100%",
        variant: "destructive"
      });
      return;
    }
  
    // Calculate the new pool ID
    const newId = pools.length > 0 ? pools[pools.length - 1].id + 1 : 1;
  
    // Create the new pool object
    const newPool = {
      id: newId,
      name: newPoolName,
      percentage: Number(newPoolPercentage),
      balance: 0.0,
    };
  
    // Update the state
    setPools([...pools, newPool]);
    setNewPoolName("");
    setNewPoolPercentage("");
  };

  const handleUpdatePool = (pool, poolId, newPercentage) => {
    const currentTotal = getTotalPercentage() - pool.percentage;
    if (currentTotal + Number(newPercentage) > 100) {
      toast({
        title: "Error",
        description: "Total percentage cannot exceed 100%",
        variant: "destructive"
      });
      return;
    }

    // Update the pools array with the new percentage
    const updatedPools = pools.map((p) =>
      p.id === poolId ? { ...p, percentage: Number(newPercentage) } : p
    );
    
    setPools(updatedPools);
    setEditingPool(null);

    toast({
      title: "Success",
      description: "Pool successfully updated!",
      variant: "dafault"
    });
  };

  const handleDeletePool = (poolId) => {
    // Filter out the pool with the matching ID
    const updatedPools = pools.filter(pool => pool.id !== poolId);
    setPools(updatedPools);

    toast({
      title: "Success",
      description: "Pool deleted successfully",
      variant: "default"
    });
  };

  const handleSaveChanges = async () => {
    const totalPercentage = getTotalPercentage();
    if (totalPercentage !== 100) {
      toast({
        title: "Error",
        description: "Total percentage must equal 100%",
        variant: "destructive"
      });
      return;
    }

    await updatePoolDistributions(pools);
  };

  const updatePoolDistributions = async (updatedPools) => {
    setIsUpdatingPools(true);
    try {
      const userDataStr = localStorage.getItem('user');
      if (!userDataStr) throw new Error('User data not found');
      
      const userData = JSON.parse(userDataStr);

      const response = await fetch(`${apiBaseUrl}/banking/pools/redistribute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          active_view: userData.active_view, // Add active_view to request
          pools: updatedPools.map(pool => ({
            name: pool.name,
            percentage: pool.percentage,
            is_locked: pool.is_locked
          }))
        })
      });
  
      if (!response.ok) throw new Error('Failed to update pool distributions');
  
      const result = await response.json();
      setPools(result.pools.filter(pool => !pool.is_credit_pool));
      setCreditPool(result.pools.find(pool => pool.is_credit_pool));
      
      setIsEditMode(false);
      setShowUpdateModal(true);
      
      toast({
        title: "Success",
        description: "Pool distributions updated successfully"
      });
    } catch (error) {
      console.error('Error updating pool distributions:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUpdatingPools(false);
    }
  };

  const getTotalBalance = () => {
    return pools.reduce((sum, pool) => sum + pool.balance, 0) + (creditPool?.balance || 0);
  };

  const BalanceModal = () => (
    <Dialog open={showBalanceModal} onOpenChange={setShowBalanceModal}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Balance Breakdown</DialogTitle>
          <DialogDescription>
            Your total balance is distributed across the following pools
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {creditPool && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Credit Pool</p>
                  <p className="text-sm text-gray-500">Incoming funds pool</p>
                </div>
                <p className="font-bold">₦{creditPool.balance.toLocaleString()}</p>
              </div>
            </div>
          )}
          
          {pools.map((pool) => (
            <div key={pool.id} className="p-4 border rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{pool.name}</p>
                  <p className="text-sm text-gray-500">{pool.percentage}% of distributions</p>
                </div>
                <p className="font-bold">₦{pool.balance.toLocaleString()}</p>
              </div>
            </div>
          ))}

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <p className="font-medium">Total Balance</p>
              <p className="font-bold">₦{getTotalBalance().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const UpdateConfirmationModal = () => (
    <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pool Distribution Updated</DialogTitle>
          <DialogDescription>
            Funds have been redistributed according to the new percentages
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {pools.map((pool) => (
            <div key={pool.id} className="flex justify-between items-center">
              <span>{pool.name} ({pool.percentage}%)</span>
              <span className="font-bold">₦{pool.balance.toLocaleString()}</span>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={() => setShowUpdateModal(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div>
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center cursor-pointer" onClick={() => setShowBalanceModal(true)}>
            <div>
              <p className="text-sm text-gray-500">Available Balance</p>
              <p className="text-2xl font-bold">₦{getTotalBalance().toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <BanknoteIcon className="text-gray-400" />
              <ChevronDown className="text-gray-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {pools.length === 0 ? (
        <div className="mt-4 p-6 border-2 border-dashed rounded-lg text-center">
          <PiggyBank className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="font-medium mb-2">No Pools Created</h3>
          <p className="text-gray-500 mb-4">Select a template to start managing your funds</p>
          <Select onValueChange={handleTemplateSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a template" />
            </SelectTrigger>
            <SelectContent>
              {userData?.active_view === 'business' ? (
                <SelectItem value="business">Basic Business Template</SelectItem>
              ) : (
                <SelectItem value="personal">Basic Personal Template</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Pool Distribution</h3>
            <Button 
              variant={isEditMode ? "secondary" : "default"}
              onClick={() => setIsEditMode(!isEditMode)}
            >
              {isEditMode ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Stop Editing
                </>
              ) : (
                <>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Pools
                </>
              )}
            </Button>
          </div>

          {isEditMode && (
            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleSaveChanges}
                disabled={isUpdatingPools}
              >
                {isUpdatingPools ? (
                  <>
                    <span className="animate-spin mr-2">⌛</span>
                    Updating Pools...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save & Redistribute
                  </>
                )}
              </Button>
            </div>
          )}

          <UpdateConfirmationModal />

          {getTotalPercentage() > 100 && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>
                Total percentage exceeds 100%. Please adjust the pool distributions.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {pools.map((pool) => (
              <div key={pool.id} className="p-4 border rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-medium">{pool.name}</p>
                  <p className="text-sm text-gray-500">{pool.percentage}% of distributions</p>
                </div>
                {isEditMode && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={pool.percentage}
                      onChange={(e) => handleUpdatePool(pool, pool.id, e.target.value)}
                      className="w-16"
                    />
                    <Label htmlFor={`is-locked-${pool.id}`} className="flex items-center gap-1">
                      <Input
                        id={`is-locked-${pool.id}`}
                        type="checkbox"
                        checked={pool.is_locked}
                        onChange={() => handleToggleLock(pool.id)}
                      />
                      Locked
                    </Label>
                    <Button 
                      variant="destructive" 
                      onClick={() => handleDeletePool(pool.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <p className="font-bold">₦{pool.balance.toLocaleString()}</p>
              </div>
            ))}

            {isEditMode && (
              <div className="p-4 border-2 border-dashed rounded-lg">
                <h4 className="font-medium mb-4">Add New Pool</h4>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="poolName">Pool Name</Label>
                    <Input
                      id="poolName"
                      value={newPoolName}
                      onChange={(e) => setNewPoolName(e.target.value)}
                      placeholder="Enter pool name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="poolPercentage">Percentage</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="poolPercentage"
                        type="number"
                        value={newPoolPercentage}
                        onChange={(e) => setNewPoolPercentage(e.target.value)}
                        placeholder="Enter percentage"
                        className="w-24"
                      />
                      <span>%</span>
                    </div>
                  </div>
                  <Button onClick={handleAddPool}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Pool
                  </Button>
                </div>
              </div>
            )}
          </div>

          
        </div>
      )}

        <BalanceModal />
    </div>
  );
};
