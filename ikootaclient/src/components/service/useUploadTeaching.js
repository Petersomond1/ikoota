//useUploadTeaching.js
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./api";

export const useUploadTeaching = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (data) => {
      const response = await api.post("/teachings", data, {
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
