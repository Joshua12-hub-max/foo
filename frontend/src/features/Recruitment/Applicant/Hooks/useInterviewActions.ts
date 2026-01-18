import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { SaveInterviewNotesFormData } from '../../../../schemas/recruitmentSchema';

interface SaveNotesVariables extends SaveInterviewNotesFormData {
  id: number;
}

export const useInterviewActions = () => {
  const queryClient = useQueryClient();

  const saveInterviewNotesMutation = useMutation({
    mutationFn: async ({ id, notes, rating, duration }: SaveNotesVariables) => {
      const response = await axios.post(
        `http://localhost:5000/api/recruitment/applicants/${id}/interview-notes`, 
        { applicantId: id, notes, rating, duration },
        { withCredentials: true }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['applicant', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['applicants'] });
    }
  });

  return {
    saveInterviewNotesMutation
  };
};
