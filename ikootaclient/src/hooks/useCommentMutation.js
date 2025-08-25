// ikootaclient/src/hooks/useCommentMutation.js
// React Query hook that uses commentServices for API calls

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postComment } from '../components/service/commentServices.js';

const useCommentMutation = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: ['postComment'],
    mutationFn: async (commentData) => {
      console.log('🔄 useCommentMutation: Posting comment via service...');
      
      // Use the service function instead of duplicate fetch logic
      return await postComment(commentData);
    },
    onSuccess: (data) => {
      console.log('✅ Comment mutation success:', data);
      
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['parentChatsAndTeachings'] });
      queryClient.invalidateQueries({ queryKey: ['combinedContent'] });
    },
    onError: (error) => {
      console.error('❌ Comment mutation error:', error);
    },
  });

  return mutation;
};

export default useCommentMutation;