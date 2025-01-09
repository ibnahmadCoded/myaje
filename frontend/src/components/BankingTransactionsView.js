import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MoneyRequestsTab from './MoneyRequestsTab';
import MoneyActionsDialog from './MoneyActionsDialog';
import { TransactionsTab } from './TransactionsTab';

export const BankingTransactionsView = () => {
  const [activeTab, setActiveTab] = useState('transactions');
  const [showMoneyRequests, setShowMoneyRequests] = useState(false);

  // Check URL parameters for money requests tab
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tab') === 'requests') {
      setActiveTab('requests');
      setShowMoneyRequests(true);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Banking Transactions</h2>
        <MoneyActionsDialog />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="requests">Money Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <TransactionsTab />
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <MoneyRequestsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BankingTransactionsView;