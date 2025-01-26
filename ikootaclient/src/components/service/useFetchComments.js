import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import api from "./api.js";

// Fetch comments
export const useFetchComments= () => {
  console.log("this is the get request");

  return useQuery({
    queryKey: ["comments"], // Corrected to use an array
    queryFn: async () => {
      const response = await api.get("/comments");
      return response.data;
    },
  });
};