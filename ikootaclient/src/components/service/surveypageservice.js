import api from "./api";
import { useMutation } from "@tanstack/react-query";
import axios from 'axios';


export const useSendApplicationsurvey = () => {

const submitForm = async ( answers) => {
    const res = await api.post(
       '/survey/applicationsurvey',
        answers , 
        { withCredentials: true }
    );
    return res.data;
};
return useMutation(submitForm);
}

// import { useMutation } from '@tanstack/react-query';
// import axios from 'axios';

// const api = axios.create({
//   baseURL: 'http://localhost:3000/api',
// });

// export const useSendApplicationsurvey = () => {
//   return useMutation((answers) => {
//     return api.post('/survey/applicationsurvey', { answers });
//   });
// };


