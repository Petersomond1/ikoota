//useUploadTeaching.js
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export const useUploadTeaching = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (data) => {
      const response = await axios.post("/api/teachings", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("teachings");
      },
    }
  );
};
