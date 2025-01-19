import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { apiBaseUrl } from '@/config';

export const OTPVerification = ({ email, phone, onSuccess, onResend }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  // Timer for resend button
  useEffect(() => {
    if (timeLeft === 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Handle input of OTP digits
  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Move to next input if value is entered
    if (element.value && element.nextSibling) {
      element.nextSibling.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && e.target.previousSibling) {
        e.target.previousSibling.focus();
      }
    }
  };

  // Paste OTP
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split('').forEach((char, index) => {
      if (index < 6) newOtp[index] = char;
    });
    setOtp(newOtp);
  };

  const handleResend = async () => {
    setIsResending(true);
    setError('');
    
    try {
      await onResend();
      setTimeLeft(30);
    } catch (error) {
      setError(`Failed to resend verification code, ${error}`);
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiBaseUrl}/auth/verify-signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otpString, email: email, phone: phone })
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        setError(data.detail || 'Invalid verification code');
      }
    } catch (error) {
      console.log(error)
      setError('Failed to verify code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
      <h2 className="text-2xl font-bold text-stone-800 mb-6">Verify Your Account</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="text-sm text-stone-600 mb-6">
        `We've sent a verification code to:`<br />
        <span className="font-medium">Email: {email}</span><br />
        <span className="font-medium">Phone: {phone}</span>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between gap-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              type="text"
              maxLength="1"
              value={digit}
              onChange={(e) => handleChange(e.target, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              className="w-12 h-12 border rounded-lg text-center text-lg font-semibold focus:ring-2 focus:ring-green-200 focus:border-green-300 focus:outline-none"
            />
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading || otp.join('').length !== 6}
          className="w-full bg-green-100 text-stone-600 py-2 rounded-lg hover:bg-green-200 transition-colors focus:ring-2 focus:ring-green-200 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify'
          )}
        </button>

        <div className="text-center">
          <button
            onClick={handleResend}
            disabled={isResending || timeLeft > 0}
            className="text-sm text-green-600 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
          >
            {isResending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {timeLeft > 0 ? `Resend in ${timeLeft}s` : 'Resend code'}
          </button>
        </div>
      </div>
    </div>
  );
}