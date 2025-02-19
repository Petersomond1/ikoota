import { useQuery } from "@tanstack/react-query";
import api from "./api.js";

// Fetch parent chats and teachings along with their comments
export const useFetchParentChatsAndTeachingsWithComments = (user_id) => {
  return useQuery({
    queryKey: ["parent-comments", user_id],
    queryFn: async () => {
      if (!user_id) return [];
      const response = await api.get(`/comments/parent-comments`, {
        params: { user_id }
      });
      return response.data;
    },
    enabled: !!user_id, // Only fetch when user_id is set
  });
};


// Fetch parent chats and teachings along with their comments
export const useFetchComments = (user_id) => {
  return useQuery({
    queryKey: ["comments", user_id], // Corrected to use an array
    queryFn: async () => {
      if (!user_id) return [];
      const response = await api.get(`/comments/parent`, {
        params: {
          user_id
        }
      });
      return response.data;
    },
    enabled: !!user_id, // Only fetch when user_id is set
  });
};
