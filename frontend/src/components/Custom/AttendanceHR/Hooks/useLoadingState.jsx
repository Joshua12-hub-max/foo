import { useState, useEffect } from "react";

export const useLoadingState = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState("");
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => 
    {if (successMessage)
            {
            const timer = setTimeout(() => setSuccessMessage(null), 3000);
            return () => clearTimeout(timer);}
    }, [successMessage]);

  return { isLoading, setIsLoading, loadingType, setLoadingType, error, setError, successMessage, setSuccessMessage, };
};