import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

// Interface matching the seeded JSON structure
interface LeavePolicyContent {
  types: string[];
  description?: string;
}

export const useLeavePolicy = () => {
  return useQuery({
    queryKey: ['leave-policy'],
    queryFn: async () => {
      const { data } = await api.get('/policies?category=leave');
      
      // Default fallback if no policy exists
      if (!data.policies || data.policies.length === 0) {
        return ['Vacation Leave', 'Sick Leave']; 
      }

      const policy = data.policies[0];
      
      try {
        // Parse content if it's a string (it should be stored as JSON string in DB)
        const content: LeavePolicyContent = typeof policy.content === 'string' 
          ? JSON.parse(policy.content) 
          : policy.content;
          
        return content.types || [];
      } catch (e) {
        console.error("Failed to parse leave policy content:", e);
        return ['Vacation Leave', 'Sick Leave']; // Fallback on error
      }
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
};
