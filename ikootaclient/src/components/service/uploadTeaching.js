import { useMutation } from "@tanstack/react-query";
import api from "./api";
import { toast } from "react-toastify";

export const useUploadTeachingMutation = () => {
  // The mutation should only be defined once
  console.log("here")
  return useMutation({
    mutationFn: async (teachingData) => {
      const res = await api.post("/teachings", teachingData);
      return res.data;
    },
    onSuccess: () => {
     
    },
    onError: (error) => {
      console.log(`Error: ${error.response?.data?.error || error.message}`);
    },
  });
};
