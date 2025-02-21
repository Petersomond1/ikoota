 import { useMutation } from "@tanstack/react-query";
// import api from "../components/service/api";

// export const useUploadCommentFiles = () => {
//   return useMutation(async (files) => {
//     const formData = new FormData();
//     files.forEach(file => formData.append('files', file));

//     const response = await api.post('/comments/upload', formData, {
//       headers: {
//         'Content-Type': 'multipart/form-data',
//       },
//     });

//     return response.data.uploadedFiles; // Ensure this matches the server response structure
//   });
// };


// import { useMutation } from 'react-query';
// import axios from 'axios';

export const useUploadCommentFiles = () => {
  const mutation = useMutation(async (files) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await api.post('/comments/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  });

  return mutation;
};