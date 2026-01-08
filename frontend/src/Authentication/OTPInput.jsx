import { useRef, useEffect, useState } from 'react';

export default function OTPInput({ length = 6, value, onChange }) {
  const [otp, setOtp] = useState(new Array(length).fill(""));
  const inputRefs = useRef([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, e) => {
    const val = e.target.value;
    if (isNaN(val)) return;

    const newOtp = [...otp];
    // Allow only last entered character
    newOtp[index] = val.substring(val.length - 1);
    setOtp(newOtp);
    onChange(newOtp.join(""));

    // Move to next input if value is entered
    if (val && index < length - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
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
      if(inputRefs.current[nextIndex]) {
          inputRefs.current[nextIndex].focus();
      }
  };

  return (
    <div className="flex gap-2 justify-center">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(ref) => (inputRefs.current[index] = ref)}
          type="text"
          value={digit}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className="w-12 h-14 text-center text-2xl font-bold border-2 border-slate-200 rounded-xl focus:border-slate-900 focus:ring-0 focus:outline-none transition-all bg-gray-50 text-slate-900"
          maxLength={1}
        />
      ))}
    </div>
  );
}
