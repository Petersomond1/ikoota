# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh





To find your public IP:   curl ifconfig.me

Test Connection aws RDS mysql db
You can test the connection from your terminal using the MySQL CLI:  mysql -h <RDS_ENDPOINT> -u <DB_USER> -p
Replace <RDS_ENDPOINT>, <DB_USER>, and enter your password when prompted. If this works, your AWS RDS setup is okay. If not:



ping ikoota-db.cvugpfnl4vcp.us-east-1.rds.amazonaws.com    (ping success)


users membership application/signup process.
membership with pending, granted, declined
it will start with 'applied' for moments when new user signs up with profile (email, phone and username) upto their submitting of a pre-requisite survey, till moment of is_member granted/approved or declined. it will be the admin that will vet the survey result/answer submitted by the applicant before decision for is_member granted or declined. 

At this stage of admin granting or declining membership from applicants, admin also have to create some properties or previledges for the user. (1) create a 6-digit alphanumeric letters and avatar that they will henceforth use in place of their profile for all open communication and messages/chats. (2) place user under a mentor by putting the mentor's id into their new user'd profile (a column for mentor 6-digit alphanumeric id#). (3) place the new user in a special demographic class (like classroom or like subject of study in a regular school system). This class is going to be synonymous to the 'audience' that the user can have internal communication/chats with apart from the general communication class which will feature in 'audience' for posting content/chat/messages. I propose that all these three properties will each have a column in the user's table and each of this column will have the three options that admin will need to choose or flip into. while for those applicants that are declined, their column will merely be filled will straight zeros (000000) as nil/null.

Now more about the converse Id system, mentorship system and users classes (audience for posting messages/chat) system.

converse Id system.
upon moment of membership granted, user profile (name/username, email and phone) will be encoded and the real names expunged from the system into an external record system. so a special encoding logic will be needed to convert the profile (email, phone, username and avatar) into a converse 6-digit alphanumeric letters and avatar that will thenceoforth be used for user identification or profile. It will only be the system that can decode/reveal the original id/profile when needed to relate with the real user. So, this is going to be a converse identity system from the moment membership is granted.
every user will have a permanent 6-digit alphanumeric id that will be used in place of their username from the moment membership is granted.

mentorship system.
Every user will have a mentor whose real id might not be known to them. but the mentors will know their mentee
So, user will be placed in a heirachical mentorship system from the moment membership is granted.

content approval
When a content/presentation is posted by a user, there should be content approval step as an admin vetting of the content before contents (messages/presentations) is allowed for public view. meaning every presentation/content posted with 'audience' as 'general'  will remain pending status and notification sent to admin for approval. whereas those posting to individual class or to idividual with will go striaght without approval of an admin. 
....... status` enum('pending','approved','rejected') DEFAULT 'pending',

users classes = audience for messages/chats
users will have a demographic sub-division to be known as classes. This classes will create opportunity for 
messages/chats to have specific audiences within the body of users and general/public as audience for all.

Explanation of Schema

    auth table:
    no need for auth table as all about authentication will be incorporated into columns of the user table.
    
    users table:
        Register, login, update profile, upload avatar to S3.
        Add a is_member column. with status` enum('applied','granted','declined') DEFAULT 'applied',
        Use AWS SDK or @aws-sdk/client-s3 for S3 interactions.
        Contains user profiles and blocking functionality.
        blocked is a JSON array storing IDs of users that a particular user has blocked.
        Add a is_banned column to flag banned users.
        Add a role column. `role` enum('admin','user') DEFAULT 'user',
        Add a class column: moment membership approval is granted, a user will be placed in a specific class.
        ....with 000000(nil_class) for users pending membership and 6-alphanumeric letters used to id class that will be listed out.
        Add a mentor column. to show the id of mentor for every user/mentee.

    chats table:
        Represents a unique chat session (1-to-1 or group chat).
        Create chat sessions.
        Fetch user chats.

    messages table:
        Holds all messages, including media references stored in S3.
        Send and retrieve messages.
        Integrate media uploads to S3 for images, videos, etc.
        Add a is_flagged column for admin-reviewed messages.

    user_chats table:
        Manage metadata for chats (e.g., last message, seen status).
        Links users to chats and includes metadata like the last message and its status.

    admins table:
        Implement admin functionalities

    reports table:
        Implement reporting functionalities

    audit_logs:
        Add audit logging in admin-related actions (e.g., ban user, delete chat).





RESTful API Endpoints

Users

    POST /users - Register a new user.
    GET /users/:id - Fetch user details.
    PUT /users/:id - Update user details (e.g., avatar, username).
    GET /users/:id/block - List blocked users.
    POST /users/:id/block - Block a user.
    DELETE /users/:id/block - Unblock a user.


Chats

    POST /chats - Create a new chat session.
    GET /chats/:chatId - Fetch chat details and participants.
    GET /users/:id/chats - Fetch all chats for a user.
    GET /chats/:id: Get details of a specific chat.
    GET /chats: List all chats the user is a member of.
    PATCH /chats/:id: Update chat details (e.g., group name).
    DELETE /chats/:id: Delete a chat (admin only).

Messages

    POST /messages - Send a new message (text/media).
    GET /messages/:chatId - Fetch/Retrieve all messages in a chat.
    GET /messages/:id: Retrieve a specific message.
    PATCH /messages/:id: Edit a message (if allowed).
    DELETE /messages/:id - Delete a message.

UserChats

    POST /user-chats: Add a user to a chat.
    GET /users/:id/user_chats - Get all chat summaries for a user.
    GET /user-chats/:chat_id: List users in a chat.
    PUT /user_chats/:id - Update chat status (e.g., mark as seen).
    PATCH /user-chats/:id: Update user-chat metadata (e.g., role, mute status).
    DELETE /user-chats/:id: Remove a user from a chat.


Admin Management
Admin Authentication

    POST /admin/login - Admin login to retrieve JWT token.
    POST /admin/logout - Admin logout.

User Management

    GET /admin/users - Fetch all users (with filters: banned, active).
    PUT /admin/users/:id/ban - Ban a user.
    PUT /admin/users/:id/unban - Unban a user.
    DELETE /admin/users/:id - Delete a user (cascades to delete their content).

Chat and Message Management

    GET /admin/chats - Fetch all chats.
    DELETE /admin/chats/:id - Delete a chat.
    GET /admin/messages - Fetch flagged messages.
    PUT /admin/messages/:id/flag - Flag a message as inappropriate.
    DELETE /admin/messages/:id - Delete a message.

Reports

    POST /reports - Report a user, chat, or message (user-side action).
    GET /admin/reports - Fetch all reports (with filters: pending, reviewed).
    PUT /admin/reports/:id/review - Mark a report as reviewed.
    PUT /admin/reports/:id/resolve - Mark a report as resolved.

Audit Logs

    GET /admin/audit-logs - Fetch all audit logs for admin actions (filters: admin_id, date range).


Socket.IO Integration

    Events:
        connect: Initialize user connection.
        join_chat: Join a chat room.
        new_message: Broadcast a new message.
        typing: Notify participants of typing status.
        disconnect: Handle user disconnection.

        report_notification: Notify admins of new reports in real-time.
        user_status_update: Update the admin dashboard when a user is banned/unbanned.
        message_flag_update: Notify admins of flagged messages for immediate action.



S3 folder structure:

        users/avatars/{userId}.jpg
        chats/{chatId}/{messageId}/media.jpg

    
all user signup, login, logout buttons from many pages

admin and system pages Fetch users and contents/messages/chats
Admin Update User properties
Admin present/upload teaching/messages to both front and chat pages.
Admin approve, feature, remove content/messages
Admin ban, unban and grant posting_right (but only admin can post to front and chat, while all users comment/message)
admin reset audience

system display teaching/messages and properties on pages.
users send messages and comments from pages.






Is there any difference between a content, a messages and a chat in chatting or teaching app? please explain. And if not much, I want the content table and messages table to be merged. and if a message/ content does not have 'title', 'description' or 'media type, the column can be made to be null/nil/000. It should be noted that some messages/content are gonna have more than one media types, so a way to accommodate the media_type to correspond with the media_url for a single message/content having a video and a music and an image urls must be provided.  
I want the column for name in the classes table to contain/store the pre-assigned or designated 6-digit alphanumeric Id-numbers that will double as target "audience" for posting content/messages. 
It should be also noted that comments do contain files or media types with their urls. so accommodation for files and media types/urls should be made in the comments table and if those are not included in a particular comment, the space/column can be nullable.
content table should not have is_public as the column for 'audience' which is target 'class_id' will take care of that as the 'general' class/class_id.
The role column in users table should include a 'super_admin' role for the senior admin that will manage a host of admins. 
consider all of the above, then make and provide adjustments



THe db tables.

1. Users Table

    CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL, -- User's full name
    email VARCHAR(255) NOT NULL UNIQUE, -- Email for login
    phone VARCHAR(15) NULL, -- Optional whatsapp phone number
    avatar VARCHAR(255), -- Optional profile image URL to S3
    password_hash VARCHAR(255) NOT NULL, -- Securely hashed password for authentication
    converse_id CHAR(6) UNIQUE, -- 6-digit alphanumeric ID
    mentor_id CHAR(6), -- References another user's converse_id
    class_id INT, -- Foreign key to classes.id
    is_member ENUM('applied', 'granted', 'declined') DEFAULT 'applied',
    role ENUM('super_admin', 'admin', 'user') DEFAULT 'user',  -- Role designation
    blocked JSON DEFAULT '[]', -- Array of blocked user IDs
    is_banned BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
);


2. Classes Table

    CREATE TABLE classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(6) NOT NULL UNIQUE, -- 6-digit alphanumeric ID for the class
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


3. Chats Table

    CREATE TABLE chats (
    id VARCHAR(36) PRIMARY KEY,
    is_group BOOLEAN DEFAULT FALSE,
    title VARCHAR(255), -- Optional, for group chats
    created_by VARCHAR(36), -- User ID of creator
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

4. User_Chats Table

   CREATE TABLE user_chats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    chat_id VARCHAR(36) NOT NULL,
    last_message VARCHAR(255),
    is_seen BOOLEAN DEFAULT FALSE,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE


role: Role of the user in the chat ('admin', 'member', 'owner').
is_muted: Boolean to track if the user has muted the chat.
last_read_message_id: Tracks the last message read by the user for "unread" counts.
joined_at: Timestamp for when the user joined the chat.

   );


5. Messages Table

-- Messages Table
CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chat_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36), -- Sender of the message
    class_id INT, -- Target audience for the message
    title VARCHAR(255) NULL, -- Nullable for cases with no title
    summary TEXT NULL, -- Nullable for cases with no description-summary
    text TEXT NOT NULL,-- Text of the message
    approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    media_url1 VARCHAR(255),
    media_type1 ENUM('image', 'video', 'audio', 'file'),
    media_url2 VARCHAR(255),
    media_type2 ENUM('image', 'video', 'audio', 'file'),
    media_url3 VARCHAR(255),
    media_type3 ENUM('image', 'video', 'audio', 'file'),
    is_flagged BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);



6. Comments Table

    CREATE TABLE comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL, -- User making the comment
    message_id INT NOT NULL, -- Related message
    comment TEXT NOT NULL, -- Text of the comment
    media_url1 VARCHAR(255) NULL, -- URL for the first media in the comment (if any)
    media_type1 ENUM('image', 'video', 'audio', 'file') DEFAULT NULL, -- Type of the first media
    media_url2 VARCHAR(255) NULL, -- URL for the second media in the comment (if any)
    media_type2 ENUM('image', 'video', 'audio', 'file') DEFAULT NULL, -- Type of the second media
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


7. Reports Table
   Tracks reports for moderation.

    CREATE TABLE reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reporter_id VARCHAR(36) NOT NULL,
    reported_id VARCHAR(36), -- Can be user_id or content_id
    reason TEXT NOT NULL,
    status ENUM('pending', 'reviewed', 'resolved') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
);


8. Audit Logs Table
    Logs admin actions for transparency.

    CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id VARCHAR(36) NOT NULL,
    action VARCHAR(255) NOT NULL,
    target_id VARCHAR(36), -- User or content ID
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

9. surveylog Table
    Logs survey and answers for future reference.

    CREATE TABLE surveylog (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    answers TEXT,
    verified_by VARCHAR(36) NOT NULL,  -- admin_id of the admin that approved
    rating_remarks  VARCHAR(255) NOT NULL,
    approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);





Use of libraries.
- Use `axios` for making HTTP requests.
- Use `@tanstack/react-query` for managing server state, caching, and synchronizing data with your backend.
- Use `zustand` for managing local state in your React application.




Using axios with react-query:
You can use to make HTTP request and react-query to manage the server state.

import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

export const useSendApplicationsurvey = () => {
  return useMutation((answers) => {
    return axios.post('http://localhost:3000/api/auth/submit_applicationsurvey', answers, { withCredentials: true });
  });
};



using Zustand for local State Management.
We can use Zustand to manage local state in your application.

import create from 'zustand';

const useStore = create((set) => ({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  setUsername: (username) => set({ username }),
  setEmail: (email) => set({ email }),
  setPassword: (password) => set({ password }),
  setConfirmPassword: (confirmPassword) => set({ confirmPassword }),
  setPhone: (phone) => set({ phone }),
}));

export default useStore;


using Zustand in a compound:  
You can use the useStore hook to manage local state in your components.

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useMutation } from '@tanstack/react-query';
import useStore from '../store/useStore';
import './signup.css';

const Signup = () => {
  const { username, email, password, confirmPassword, phone, setUsername, setEmail, setPassword, setConfirmPassword, setPhone } = useStore();
  const navigate = useNavigate();
  const { mutateAsync: registerUser } = useMutation((values) => {
    return axios.post('http://localhost:3000/api/auth/register', values, { withCredentials: true });
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    try {
      const res = await registerUser({ username, email, password, phone });
      if (res.status === 201) {
        navigate(`${res.data.redirectTo}`);
        console.log('res data at signup', res.data);
      } else {
        alert('Error: ' + res.data.error + ' - ' + 'Signup Failed');
      }
    } catch (err) {
      alert('Signup failed, please check your network and try again.');
    }
  };

  <!-- return (
    <div className="signup-form">
      <h2>Sign Up Page</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '3px' }}>
          <label htmlFor="username"><strong>Username:</strong>
            <input
              type="text"
              placeholder="Enter Username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-control"
            />
          </label>
        </div>
        <div style={{ marginBottom: '3px' }}>
          <label htmlFor="email"><strong>Email:</strong>
            <input
              type="email"
              autoComplete="off"
              placeholder="Enter Email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-control"
            />
          </label>
        </div>
        <div style={{ marginBottom: '3px' }}>
          <label htmlFor="phone"><strong>Phone:</strong>
            <input
              type="phone"
              autoComplete="off"
              placeholder="Enter whatsapp Phone Number"
              name="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="form-control"
            />
          </label>
        </div>
        <div style={{ marginBottom: '3px' }}>
          <label htmlFor="password"><strong>Password:</strong>
            <input
              type="password"
              placeholder="Enter Password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-control"
              autoComplete="off"
            />
          </label>
        </div>
        <div style={{ marginBottom: '3px' }}>
          <label htmlFor="confirmPassword"><strong>Confirm Password:</strong>
            <input
              type="password"
              placeholder="Confirm Password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-control"
              autoComplete="off"
            />
          </label>
        </div>
        <button type="submit">Sign Up</button>
        <p>Next is to fill a simple ID form</p>
      </form>
      <Link to="/" type="submit"><strong>opt-out</strong></Link>
    </div>
  );
}; -->

export default Signup;


