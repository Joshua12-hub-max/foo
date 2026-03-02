/**
 * useEmployeeMemos Hook
 * Custom hook for managing employee's memo viewing in Employee Portal
 * Optimized with useCallback for performance
 */

import { useState, useEffect, useCallback } from 'react';
// @ts-ignore
import { fetchMyMemos, acknowledgeMemo } from "@api";

export interface Memo {
  id: number;
  memoNumber: string;
  memoType: string;
  subject: string;
  content?: string;
  priority: string;
  status: string;
  createdAt: string;
  acknowledgedAt?: string;
  acknowledgmentRequired?: boolean;
}

export interface UseEmployeeMemosReturn {
  memos: Memo[];
  loading: boolean;
  error: string | null;
  acknowledging: boolean;
  isViewOpen: boolean;
  selectedMemo: Memo | null;
  loadMemos: () => Promise<void>;
  openViewModal: (memo: Memo) => void;
  closeViewModal: () => void;
  handleAcknowledge: () => Promise<void>;
}

export const useEmployeeMemos = (): UseEmployeeMemosReturn => {
  // Data state
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acknowledging, setAcknowledging] = useState(false);

  // Modal states
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);

  // Load memos - memoized with useCallback
  const loadMemos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchMyMemos();
      setMemos((res as { memos?: Memo[] })?.memos ?? []);
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
  const openViewModal = useCallback((memo: Memo) => {
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
    if (!selectedMemo || selectedMemo.acknowledgedAt) return;

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
