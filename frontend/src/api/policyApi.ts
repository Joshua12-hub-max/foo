import axios from './axios';

export interface InternalPolicy {
  id: number;
  category: 'hours' | 'tardiness' | 'penalties' | 'csc' | 'leave' | 'plantilla';
  title: string;
  content: string; // JSON string or text
  versionLabel?: string;
  updatedAt: string;
}

export const getPolicies = async (category?: string) => {
  const response = await axios.get<{ success: boolean; policies: InternalPolicy[] }>('/policies', {
    params: { category }
  });
  return response.data;
};

export const createPolicy = async (data: Partial<InternalPolicy>) => {
  const response = await axios.post<{ success: boolean; message: string; id: number }>('/policies', data);
  return response.data;
};

export const updatePolicy = async (id: number, data: Partial<InternalPolicy>) => {
  const response = await axios.put<{ success: boolean; message: string }>(`/policies/${id}`, data);
  return response.data;
};
