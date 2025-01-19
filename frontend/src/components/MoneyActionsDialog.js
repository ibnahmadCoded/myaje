import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogTrigger,
  DialogFooter, DialogClose
} from "@/components/ui/dialog";
import { apiBaseUrl } from '@/config';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Send, ArrowDownCircle, 
} from 'lucide-react';

const ConfirmationDialog = ({ isOpen, onClose, transferData, selectedPoolDetails, recipientType, onConfirm }) => {

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Money Transfer</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-4">
              <span>Please confirm the following transfer details:</span>
              <dl className="bg-gray-100 p-4 rounded-md space-y-2">
                <div className="flex justify-between">
                  <dt>Amount:</dt>
                  <dd>₦{parseFloat(transferData?.amount || 0).toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>From:</dt>
                  <dd>{selectedPoolDetails?.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>To:</dt>
                  <dd>
                    {recipientType === "bam"
                      ? `BAM Account (${transferData?.recipient_identifier})`
                      : `${transferData?.bank_name} - ${transferData?.account_name}`}
                  </dd>
                </div>
                {transferData?.description && (
                  <div className="flex justify-between">
                    <dt>Description:</dt>
                    <dd>{transferData.description}</dd>
                  </div>
                )}
              </dl>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={onConfirm} variant="default">
            Confirm Transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Custom formatted input components
const PhoneNumberInput = ({ value, onChange, ...props }) => {
  const handleChange = (e) => {
    const input = e.target.value;
    // Remove all non-digits
    const digits = input.replace(/\D/g, '');
    
    // Enforce 10 digits without leading zero
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
  // Format number with commas
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Remove formatting for actual value
  const unformatNumber = (str) => {
    return str.replace(/,/g, '');
  };

  const handleChange = (e) => {
    const input = e.target.value;
    // Remove all non-digits and commas
    const digits = input.replace(/[^\d,]/g, '');
    const unformatted = unformatNumber(digits);
    
    if (unformatted === '' || /^\d+$/.test(unformatted)) {
      const formatted = formatNumber(unformatted);
      onChange(formatted);
    }
  };

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
        ₦
      </div>
      <Input
        type="text"
        value={value}
        onChange={handleChange}
        className="pl-7"
        {...props}
      />
    </div>
  );
};

const MoneyActionsDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState('send');
  const [initialTab, setInitialTab] = useState('send');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingTransferData, setPendingTransferData] = useState(null);

  // Handler for dialog trigger buttons
  const handleDialogTrigger = (tab) => {
    setInitialTab(tab);
    setCurrentTab(tab);
    setIsOpen(true);
  };
  
  const SendMoneyForm = () => {
    const [availablePools, setAvailablePools] = useState([]);
    const [selectedPool, setSelectedPool] = useState('');
    const [selectedPoolDetails, setSelectedPoolDetails] = useState(null)
    const [recipientType, setRecipientType] = useState('bam');
    const [formData, setFormData] = useState({
      recipient_identifier: '',
      recipient_account_type: 'personal',
      bank_name: '',
      account_name: '',
      amount: '',
      description: '',
      from_account_type: ''
    });
    const [activeView, setActiveView] = useState("");
    const [infoMessage, setInfoMessage] = useState("");

    useEffect(() => {
      const userDataStr = localStorage.getItem('user');
      if (userDataStr) {
        const user = JSON.parse(userDataStr);
        setActiveView(user.active_view);
        setFormData({
          ...formData,
          from_account_type: user.active_view
        });

        const message =
          user.active_view === "personal"
            ? "If you want to send money from your business account, please switch to the business account."
            : "If you want to send money from your personal account, please switch to the personal account.";
        setInfoMessage(message);
      }
    }, [formData]);

    useEffect(() => {
      const fetchPools = async () => {
        try {
          const response = await fetch(`${apiBaseUrl}/banking/pools/available?active_view=${activeView}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
  
          if (response.ok) {
            const pools = await response.json();
            setAvailablePools(pools.filter(pool => !pool.is_locked));
          }
        } catch (error) {
          console.error('Error fetching pools:', error);
        }
      };
  
      fetchPools();
    }, [activeView]);

    const handleSubmit = async (e) => {
      e.preventDefault();
    
      // Convert the formatted amount to a raw float value
      const unformattedAmount = parseFloat(formData.amount.replace(/,/g, ''));

      const poolDetails = availablePools.find(pool => pool.id === Number(selectedPool));
      setSelectedPoolDetails(poolDetails)
    
      setPendingTransferData({
        ...formData,
        recipient_type: recipientType,
        amount: unformattedAmount, // Store the amount as a float
        selected_pool_id: selectedPool, 
      });
    
      setShowConfirmDialog(true);
    };

    const handleConfirmedTransfer = async () => {
      try {
        const payload = {
          ...pendingTransferData,
          amount: parseFloat(pendingTransferData.amount), // Convert to float
          selected_pool_id: pendingTransferData.selected_pool_id,
        };

        const response = await fetch(`${apiBaseUrl}/banking/transfer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error('Transfer failed');
        }

        //const result = await response.json();
        toast({
          title: "Success",
          description: "Transfer completed successfully",
        });
        setShowConfirmDialog(false);
        setIsOpen(false);
      } catch (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      }
    };


    return (
      <>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
            <Label>Send From</Label>
            <Select 
                value={selectedPool} 
                onValueChange={setSelectedPool}
            >
                <SelectTrigger>
                <SelectValue placeholder="Select pool" />
                </SelectTrigger>
                <SelectContent>
                {availablePools.map(pool => (
                    <SelectItem key={pool.id} value={pool.id}>
                    {pool.name} - ₦{pool.balance.toLocaleString()}
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>
            </div>

            <div className="space-y-2">
            <Label>Send To</Label>
            <Select value={recipientType} onValueChange={setRecipientType}>
                <SelectTrigger>
                <SelectValue placeholder="Select recipient type" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="bam">BAM Account</SelectItem>
                <SelectItem value="external">External Bank Account</SelectItem>
                </SelectContent>
            </Select>
            </div>

            {recipientType === 'bam' ? (
            <>
                <div className="space-y-2">
                  <Label>`Recipient's Phone Number`</Label>
                  <PhoneNumberInput
                    value={formData.recipient_identifier}
                    onChange={(value) => setFormData({
                      ...formData,
                      recipient_identifier: value
                    })}
                  />
                </div>
                <div className="space-y-2">
                <Label>`Recipient's Account Type`</Label>
                <Select 
                    value={formData.recipient_account_type}
                    onValueChange={(value) => setFormData({
                    ...formData,
                    recipient_account_type: value
                    })}
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
            ) : (
            <>
                <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input 
                    type="text"
                    placeholder="Enter bank name"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({
                    ...formData,
                    bank_name: e.target.value
                    })}
                />
                </div>
                <div className="space-y-2">
                <Label>Account Number</Label>
                <Input 
                    type="text"
                    placeholder="Enter account number"
                    value={formData.recipient_identifier}
                    onChange={(e) => setFormData({
                    ...formData,
                    recipient_identifier: e.target.value
                    })}
                />
                </div>
                <div className="space-y-2">
                <Label>Account Name</Label>
                <Input 
                    type="text"
                    placeholder="Enter account name"
                    value={formData.account_name}
                    onChange={(e) => setFormData({
                    ...formData,
                    account_name: e.target.value
                    })}
                />
                </div>
            </>
            )}

            <div className="space-y-2">
              <Label>Amount</Label>
              <CurrencyInput
                value={formData.amount}
                onChange={(value) => setFormData({
                  ...formData,
                  amount: value
                })}
                placeholder="Enter amount"
              />
            </div>

            <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Input 
                type="text"
                placeholder="Enter description"
                value={formData.description}
                onChange={(e) => setFormData({
                ...formData,
                description: e.target.value
                })}
            />
            </div>

            <div className="space-y-2">
            <Label>Send From</Label>
            <Input
                value={formData.from_account_type}
                disabled
                className="bg-gray-100 cursor-not-allowed"
                />
            {infoMessage && (
                <div className="text-sm text-gray-600 mb-4">{infoMessage}</div>
            )}
            </div>

            <Button type="submit" className="w-full">Send Money</Button>
        </form>
            
        <ConfirmationDialog
          isOpen={showConfirmDialog}
          onClose={() => setShowConfirmDialog(false)}
          transferData={pendingTransferData}
          selectedPoolDetails={selectedPoolDetails}
          recipientType={recipientType}
          onConfirm={handleConfirmedTransfer}
        />

      </>
    );
  };

  const RequestMoneyForm = () => {
    const [formData, setFormData] = useState({
      recipient_phone: '',
      account_type: 'personal', // Account type to receive the money should depend on currently open view
      request_from_account_type: 'personal', // New field: Account type to request from
      amount: '',
      description: ''
    });

    const [activeView, setActiveView] = useState("");
    const [infoMessage, setInfoMessage] = useState("");

    if(activeView){
      //console.log("")
    }

    useEffect(() => {
      const userDataStr = localStorage.getItem('user');
      if (userDataStr) {
        const user = JSON.parse(userDataStr);
        setActiveView(user.active_view);
        setFormData({
          ...formData,
          account_type: user.active_view
        });

        const message =
          user.active_view === "personal"
            ? "If you want to request and receive money in your business account, please switch to the business account."
            : "If you want to request and receive money in your personal account, please switch to the personal account.";
        setInfoMessage(message);
      }
    }, [formData]);

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      try {

        const unformattedAmount = parseFloat(formData.amount.replace(/,/g, ''));

        // Create a payload with the float amount
        const payload = {
          ...formData,
          amount: unformattedAmount,
        };

        const response = await fetch(`${apiBaseUrl}/banking/request-money`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error('Request failed');
        }

        //const result = await response.json();
        toast({
          title: "Success",
          description: `Money request sent successfully to ${formData.recipient_phone}'s ${formData.request_from_account_type} account`,
        });
        setIsOpen(false);
      } catch (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Request From (Phone Number)</Label>
          <PhoneNumberInput
            value={formData.recipient_phone}
            onChange={(value) => setFormData({
              ...formData,
              recipient_phone: value
            })}
          />
        </div>

        <div className="space-y-2">
          <Label>Request From Account Type</Label>
          <Select 
            value={formData.request_from_account_type}
            onValueChange={(value) => setFormData({
              ...formData,
              request_from_account_type: value
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select account type to request from" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">Personal Account</SelectItem>
              <SelectItem value="business">Business Account</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Amount</Label>
          <CurrencyInput
            value={formData.amount}
            onChange={(value) => setFormData({
              ...formData,
              amount: value
            })}
            placeholder="Enter amount"
          />
        </div>

        <div className="space-y-2">
          <Label>Description (Optional)</Label>
          <Input 
            type="text"
            placeholder="Enter description"
            value={formData.description}
            onChange={(e) => setFormData({
              ...formData,
              description: e.target.value
            })}
          />
        </div>

        <div className="space-y-2">
          <Label>Receive To</Label>
          <Input
              value={formData.account_type}
              disabled
              className="bg-gray-100 cursor-not-allowed"
              />
          {infoMessage && (
              <div className="text-sm text-gray-600 mb-4">{infoMessage}</div>
          )}
        </div>

        <Button type="submit" className="w-full">Request Money</Button>
      </form>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex gap-2">
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2" onClick={() => handleDialogTrigger('send')}>
            <Send className="h-4 w-4" />
            Send Money
          </Button>
        </DialogTrigger>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2" onClick={() => handleDialogTrigger('request')}>
            <ArrowDownCircle className="h-4 w-4" />
            Request Money
          </Button>
        </DialogTrigger>
      </div>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Money Transfer</DialogTitle>
          <DialogDescription>
            Send or request money securely with BAM Banking
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} defaultValue={initialTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="send">Send Money</TabsTrigger>
            <TabsTrigger value="request">Request Money</TabsTrigger>
          </TabsList>

          <TabsContent value="send">
            <SendMoneyForm />
          </TabsContent>

          <TabsContent value="request">
            <RequestMoneyForm />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default MoneyActionsDialog;