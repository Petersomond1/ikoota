// import api from "./api";
// import { useMutation } from "@tanstack/react-query";
// import axios from 'axios';


// export const useSendApplicationsurvey = () => {

// const submitForm = async ( answers) => {
//     const res = await api.post(
//        '/survey/submit_applicationsurvey',
//         answers , 
//         { withCredentials: true }
//     );
//     return res.data;
// };
// return useMutation(submitForm);
// };

import { useMutation } from '@tanstack/react-query';
import api from './api';

const submitForm = async (answers) => {
  const res = await api.post('/survey/submit_applicationsurvey', answers, { withCredentials: true });
  console.log('res.data', res.data);
  return res.data;
};

export const useSendApplicationsurvey = () => {
    return useMutation({
        mutationFn:submitForm,
    });
  };
  