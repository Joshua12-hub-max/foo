import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import AuthLayout from '../components/Custom/Auth/AuthLayout';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const [message, setMessage] = useState('Verifying your email...');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (status === 'success') {
      setIsSuccess(true);
      setMessage('Your email has been successfully verified! You can now log in.');
    } else {
      setIsSuccess(false);
      setMessage('Verification failed or invalid link. Please try again or contact support.');
    }
  }, [status]);

  return (
    <AuthLayout title="Email Verification">
      <div className="flex flex-col items-center justify-center text-center space-y-6 py-8">
        {status ? (
            <>
                {isSuccess ? (
                <CheckCircle className="w-20 h-20 text-green-500" />
                ) : (
                <XCircle className="w-20 h-20 text-red-500" />
                )}
                
                <h2 className={`text-2xl font-bold ${isSuccess ? 'text-green-700' : 'text-red-700'}`}>
                {isSuccess ? 'Verified!' : 'Failed'}
                </h2>
                
                <p className="text-gray-600 max-w-sm">
                {message}
                </p>

                <Link 
                to="/login" 
                className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-md"
                >
                Go to Login
                </Link>
            </>
        ) : (
            <div className="flex flex-col items-center">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-600">Checking verification status...</p>
            </div>
        )}
      </div>
    </AuthLayout>
  );
}
