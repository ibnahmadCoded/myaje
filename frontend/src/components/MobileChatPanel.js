// MobileChatPanel.jsx
import { X } from 'lucide-react';

const MobileChatPanel = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-lg flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">AI Shopping Assistant</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {children}
          </div>
          
          {/* Chat Input */}
          <div className="p-4 border-t bg-white">
            <form onSubmit={(e) => {
              e.preventDefault();
              // Handle chat submission
            }} className="flex gap-2">
              <input
                type="text"
                placeholder="Ask anything about products..."
                className="flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileChatPanel;