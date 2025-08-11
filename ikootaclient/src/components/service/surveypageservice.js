//ikootaclient\src\components\service\surveypageservice.js
import { useMutation } from '@tanstack/react-query';
import api from './api';

const submitForm = async (answers) => {
  const res = await api.post('/membership/survey/submit_applicationsurvey', answers, { withCredentials: true });
  console.log('res.data', res.data);
  return res.data;
};

export const useSendApplicationsurvey = () => {
    return useMutation({
        mutationFn:submitForm,
    });
  };
  