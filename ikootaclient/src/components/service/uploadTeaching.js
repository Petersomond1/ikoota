import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import api from "./api.js";

// Fetch teachings
export const useFechTeachings = () => {
  console.log("this is the get request")

  return useQuery({
    querykey:["teachings"],
    queryFn: async () => {
    const response = await api.get("/teachings");
    return response.data;
    }
  });
};

// submit teaching material
export const useUploadTeachingMutation = () => {
  console.log("this is the post request ")
  return useMutation({
    mutationFn: async (formData) => {
    const response = await api.post("/teachings", formData, {
      headers: {
        "Content-Type": "multipart/form-data", // Required for file uploads
      },
    });
    return response.data;
  }
  });
};
