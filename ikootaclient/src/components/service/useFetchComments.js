import { useQuery } from "@tanstack/react-query";
import api from "./api.js";
import { act } from "react";

// Fetch comments
export const useFetchComments = (activeItem) => {
  return useQuery({
    queryKey: ["comments", activeItem?.id], // Corrected to use an array
    queryFn: async () => {
      if (!activeItem) return [];
      const chatType = activeItem.type ;
      const chat_id = activeItem.id;
      console.log("activeItem:", chatType, chat_id);
      const response = await api.get(`/comments`,{
        params: 
        { 
          q:'',
          chatType, 
          chat_id}
    }
  );
      return response.data;
    },
    enabled: !!activeItem, // Only fetch when activeItem is set
  });
};