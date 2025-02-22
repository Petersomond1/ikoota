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

// Fetch comments by user_id
export const useFetchComments = (user_id) => {
  return useQuery({
    queryKey: ["comments", user_id],
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

// Fetch all comments
export const useFetchAllComments = () => {
  return useQuery({
    queryKey: ["all-comments"],
    queryFn: async () => {
      const response = await api.get(`/comments/all`);
      return response.data;
    }
  });
};