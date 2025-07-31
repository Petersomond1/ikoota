//ikootaclient\src\hooks\useUpload.js
import { useMutation } from "@tanstack/react-query";
import api from "../components/service/api";





const useUpload = (endpoint) => {
  const mutation = useMutation(async (formData) => {
    const response = await api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  });

  const validateFiles = (files) => {
    // Add file validation logic if needed
    return true;
  };

  return { validateFiles, mutation };
};

export default useUpload;
