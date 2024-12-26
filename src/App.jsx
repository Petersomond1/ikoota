import React, { useEffect } from "react";
import Chat from "./components/chat/Chat";
import Detail from "./components/detail/Detail";
import List from "./components/list/List";
import Login from "./components/login/Login";
import { useUserStore } from "./components/lib/userStore";
import { useChatStore } from "./components/lib/chatStore";
import { CognitoUserPool, CognitoUser } from 'amazon-cognito-identity-js';
import { userPool } from './components/lib/aws-config';

const App = () => {
  const { currentUser, isLoading, fetchUserInfo } = useUserStore();
  const { chatId } = useChatStore();

  useEffect(() => {
    const user = userPool.getCurrentUser();
    if (user) {
      user.getSession((err, session) => {
        if (err) {
          console.error(err);
          return;
        }
        fetchUserInfo(user.getUsername());
      });
    }
  }, [fetchUserInfo]);

  if (isLoading) return <div className="loading">"Loading..."</div>;

  return (
    <div className='container'>
      {currentUser ? (
        <>
          <List />
          {chatId && <Chat />}
          {chatId && <Detail />}
        </>
      ) : (
        <Login />
      )}
    </div>
  );
};

export default App;