import { useRef, useEffect, useState, KeyboardEvent, ClipboardEvent } from 'react';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (otp: string) => void;
}

export default function OTPInput({ length = 6, value, onChange }: OTPInputProps) {
  // Initialize state based on value or empty
  const [otp, setOtp] = useState<string[]>(
    value ? value.split('') : new Array(length).fill("")
  );
  
  // Update local state when prop value changes
  useEffect(() => {
     if(value && value.length === length) {
         setOtp(value.split(''));
     } else if (!value) {
         setOtp(new Array(length).fill(""));
     }
  }, [value, length]);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (isNaN(Number(val))) return;

    const newOtp = [...otp];
    // Allow only last entered character
    newOtp[index] = val.substring(val.length - 1);
    setOtp(newOtp);
    onChange(newOtp.join(""));

    // Move to next input if value is entered
    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData("text").slice(0, length);
      if(!/^\d+$/.test(pastedData)) return; // Only allow numbers

      const newOtp = [...otp];
      pastedData.split("").forEach((char, index) => {
          newOtp[index] = char;
      });
      setOtp(newOtp);
      onChange(newOtp.join(""));
      
      const nextIndex = Math.min(pastedData.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(ref) => { inputRefs.current[index] = ref; }}
          type="text"
          value={digit}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className="w-14 h-16 text-center text-2xl font-bold border-2 border-gray-100 rounded-xl focus:border-green-600 focus:ring-[10px] focus:ring-green-50/50 focus:outline-none transition-all duration-300 bg-gray-50/50 text-gray-900 shadow-sm focus:shadow-lg focus:bg-white focus:-translate-y-0.5"
          maxLength={1}
        />
      ))}
    </div>
  );
}
