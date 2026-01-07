/**
 * useEmployeeMemos Hook
 * Custom hook for managing employee's memo viewing in Employee Portal
 * Optimized with useCallback for performance
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchMyMemos, acknowledgeMemo } from "@api";

export const useEmployeeMemos = () => {
  // Data state
  const [memos, setMemos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acknowledging, setAcknowledging] = useState(false);

  // Modal states
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState(null);

  // Load memos - memoized with useCallback
  const loadMemos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchMyMemos();
      setMemos(res.memos || []);
    } catch (err) {
      setError('Failed to load memos');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadMemos();
  }, [loadMemos]);

  // Open view modal - memoized
  const openViewModal = useCallback((memo) => {
    setSelectedMemo(memo);
    setIsViewOpen(true);
  }, []);

  // Close view modal - memoized
  const closeViewModal = useCallback(() => {
    setIsViewOpen(false);
    setSelectedMemo(null);
  }, []);

  // Handle acknowledgment - memoized
  const handleAcknowledge = useCallback(async () => {
    if (!selectedMemo || selectedMemo.acknowledged_at) return;

    try {
      setAcknowledging(true);
      await acknowledgeMemo(selectedMemo.id);
      setIsViewOpen(false);
      loadMemos();
    } catch (err) {
      setError('Failed to acknowledge memo');
    } finally {
      setAcknowledging(false);
    }
  }, [selectedMemo, loadMemos]);

  return {
    // Data
    memos,
    loading,
    error,
    acknowledging,

    // Modal states
    isViewOpen,
    selectedMemo,

    // Actions
    loadMemos,
    openViewModal,
    closeViewModal,
    handleAcknowledge
  };
};

export default useEmployeeMemos;
