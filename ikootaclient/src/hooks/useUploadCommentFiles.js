 //ikootaclient\src\hooks\useUploadCommentFiles.js
 import { useMutation } from "@tanstack/react-query";


export const useUploadCommentFiles = () => {
  const mutation = useMutation(async (files) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await api.post('/content/comments/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  });

  return mutation;
};