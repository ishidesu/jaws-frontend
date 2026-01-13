"use client";

import { useState, useRef, useEffect } from 'react';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function OTPInput({ length = 6, value, onChange, disabled = false }: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const otpArray = value.split('').slice(0, length);
    const paddedArray = [...otpArray, ...new Array(length - otpArray.length).fill('')];
    setOtp(paddedArray);
  }, [value, length]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    onChange(newOtp.join(''));

    if (element.value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otp];
      
      if (otp[index]) {
        newOtp[index] = '';
        setOtp(newOtp);
        onChange(newOtp.join(''));
      } else if (index > 0) {
        newOtp[index - 1] = '';
        setOtp(newOtp);
        onChange(newOtp.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    const newOtp = pastedData.split('');
    
    while (newOtp.length < length) {
      newOtp.push('');
    }
    
    setOtp(newOtp);
    onChange(pastedData);
    
    const nextEmptyIndex = newOtp.findIndex(digit => digit === '');
    const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : length - 1;
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(ref) => {
            inputRefs.current[index] = ref;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e.target, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          disabled={disabled}
          className="w-12 h-12 text-center text-lg font-semibold border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed bg-white text-black"
        />
      ))}
    </div>
  );
}