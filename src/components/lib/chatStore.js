import { create } from 'zustand';
import { rds } from './aws-config';
import { useUserStore } from './userStore';

export const useChatStore = create((set) => ({
  chatId: null,
  user: null,
  isCurrentUserBlocked: false,
  isReceiverBlocked: false,
  changeChat: async (chatId, user) => {
    const currentUser = useUserStore.getState().currentUser;

    // Fetch user data from RDS
    const query = `SELECT * FROM users WHERE id = '${user.id}'`;
    const result = await rds.query(query).promise();

    if (result.length > 0) {
      const userData = result[0];

      // Check if the current user is blocked
      if (userData.blocked.includes(currentUser.id)) {
        return set({
          chatId,
          user: null,
          isCurrentUserBlocked: true,
          isReceiverBlocked: false,
        });
      }

      // Check if the receiver is blocked
      if (currentUser.blocked.includes(user.id)) {
        return set({
          chatId,
          user: userData,
          isCurrentUserBlocked: false,
          isReceiverBlocked: true,
        });
      }

      return set({
        chatId,
        user: userData,
        isCurrentUserBlocked: false,
        isReceiverBlocked: false,
      });
    }
  },
  changeBlock: () => {
    set((state) => ({ ...state, isReceiverBlocked: !state.isReceiverBlocked }));
  },
}));