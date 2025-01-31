import { useQuery } from "@tanstack/react-query";
import api from "./api.js";

// Fetch comments
export const useFetchComments = (activeItem) => {
  return useQuery({
    queryKey: ["comments", activeItem?.id], // Corrected to use an array
    queryFn: async () => {
      if (!activeItem) return [];
      const response = await api.get("/comments", {
          params: {
            chat_id: activeItem.type === "chat" ? activeItem.id : null,
            teaching_id: activeItem.type === "teaching" ? activeItem.id : null,
          },
        }
      );
      console.log("at-useFetchComments:", response.data);
      return response.data;
    },
    enabled: !!activeItem, // Only fetch when activeItem is set
  });
};