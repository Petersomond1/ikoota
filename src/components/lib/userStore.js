import { create } from 'zustand';
import { rds } from './aws-config';



export const useUserStore = create((set) => ({
  currentUser: null,
  isLoading: true,
  fetchUserInfo: async (uid) => {
    if (!uid) return set({ currentUser: null, isLoading: false });

    try {
      const query = `SELECT * FROM users WHERE id = '${uid}'`;
      const result = await rds.query(query).promise();
      if (result.length > 0) {
        set({ currentUser: result[0], isLoading: false });
      } else {
        set({ currentUser: null, isLoading: false });
        console.log('No such user!');
      }
    } catch (err) {
      console.error(err);
      set({ currentUser: null, isLoading: false });
    }
  },
}));
