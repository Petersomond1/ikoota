//ikootaclient\src\components\service\useFetchChats.js
import { useQuery } from "@tanstack/react-query";
import api from "./api.js";

// Fetch chats
export const useFetchChats = () => {

  return useQuery({
    queryKey: ["chats"], // Corrected to use an array
    queryFn: async () => {
      const response = await api.get("/chats");
      return response.data;
    },
  });
};