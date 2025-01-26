import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import api from "./api.js";

// Fetch chats
export const useFetchChats = () => {
  console.log("this is the get request");

  return useQuery({
    queryKey: ["chats"], // Corrected to use an array
    queryFn: async () => {
      const response = await api.get("/chats");
      return response.data;
    },
  });
};