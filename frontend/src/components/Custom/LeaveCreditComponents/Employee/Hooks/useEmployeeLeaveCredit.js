import { useState, useEffect, useCallback } from 'react';
import { leaveApi } from '../../../../../api/leaveApi';

export const useEmployeeLeaveCredit = () => {
  const [credits, setCredits] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ creditType: '', requestedAmount: '', reason: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [creditsRes, requestsRes] = await Promise.all([
        leaveApi.getMyCredits(),
        leaveApi.getMyCreditRequests()
      ]);
      setCredits(creditsRes.data?.credits || []);
      setRequests(requestsRes.data?.requests || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(t);
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.creditType || !formData.requestedAmount || !formData.reason) {
      setError('Please fill all fields.');
      return;
    }
    setIsSubmitting(true);
    try {
      await leaveApi.applyForCredit({
        creditType: formData.creditType,
        requestedAmount: parseFloat(formData.requestedAmount),
        reason: formData.reason
      });
      setSuccess('Request submitted successfully!');
      setFormData({ creditType: '', requestedAmount: '', reason: '' });
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';

  return {
    credits,
    requests,
    isLoading,
    error,
    success,
    isModalOpen,
    formData,
    isSubmitting,
    setError,
    setSuccess,
    fetchData,
    handleSubmit,
    handleFormChange,
    openModal,
    closeModal,
    formatDate
  };
};
