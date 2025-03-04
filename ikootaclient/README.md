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


Iko view-point.
Iko is the inner teaching/presentations and chatting system.
iko view port is partitioned into three layouts.
On the left-side is the listing of the chats/teachings/presentations..it is called chatlists.
On the right-side is the User-chats..that's listing of the chats/teaching that a user have become involved by commenting/signalled to follow.
While at the middle is the main display or render portion of the chatting system. It displays the latest chat/teaching by default, which also tops the listing of the leftside orderly arranged chatlist or these middle render portion display whichever selection that a user makes either from the left side chatlists or from the right side user-chats listings.

The teaching (also called presentation) can be input at the admin page by the admin or at an input terminal that is on the lower portion of the chatting system by the users. That's input of teaching or comments to teaching can be made by regular users at the bottom part of the towncrier viewport. And every of such teaching presentation made by non-admins regular users must be vetted by an Admin before it can go public class audience.
On the right side of the Iko viewport is the user_chats or list of active chats/comments that a user is involved in. It is not every presentation/chat/teaching that a user comments on or follow/watch/tail/track. so those ones that a user have involved on or have signalled to track that becomes the users user_chats are listed on this rightside of the Iko platform viewpoint.

Towncrier Open view port
This is the open home page that is the public teaching broadcast view-port of the website.
the towncrier viewport is divided into two parts; the RevTopic and the RevPresentation.
The RevTopic on the left side like a sidebar has a search bar over its top and displays the list of available presentation/teaching topics in timely order with the latest in topmost position being rendered/displayed by default or a selection amongst the list of topics by clicking render/displays that teaching/presentation on the larger right-hand side portion of the Towncrier screen called RevPresentation.
input of the teaching/presentaion into this open view port of Towncrier occur only from the admin at the Admin page. User cannot make presentation, nor any feedback here. its simply a broadcast screen.

todo list
prepare class_id and provide callup/fetch fxn in admin page

implement approval process of application survey with update on users column.
--fetch survey,update column, generate ID,



Note there are two kinds of teaching/presentation.
Teaching for the open public screen and teaching/presentation otherwise called chats going into the internal membership restricted system.


The content endpoints like in chatservice should be converted to teachings

input teachings to towncrier
--input/upload text, img, vid & emoji. write to s3
--arrange the side of RevTopic list 
--work on the search

input teachings to Iko. ....this is the chat. list of teaching/presentations is the chatlist. 
input comments to a chat/teaching/presentation.

Create Message fetching and saving 

implement username to converse_id in all communication.
--hierachical knowledge. mentor to know mentee, but mentee not to know or identify anyone. user only know mentee

work on profile display page.

properly setup and use socket.io and socket.js

implement search of the topics or summary or texts presnets.


forgot-Password, password-Reset, 

confirm and make sure database in located at the RDS.

use of info messages to alert or as email to user/new user. 

admin controls. ....can go under usermngmt


Abstraction of the real id from the storage system, least it be leaked/hacked. 



 want to also use TowncrierControls.jsx component as place where admin will handle the upload and management of  'teachings'; that will feature as teaching presentation in Towncrier.jsx and also feature as a part of Chat in iko.jsx of which will be stored in database table "teachings". There should be opportunity made for super_admin to edit/update all its content even after posting/saving.


want to use IkoControls.jsx component as place where admin will handle the upload and management of  'messages' that will feature/render/display in iko.jsx layout through all the components linked to Iko.jsx (ListChats.jsx, Chat.jsx, Chatlist.jsx, Comments.jsx ).  this IkoControls.jsx will be associated or linked or embedded into Admin.jsx layout like others. 
Note that when 'messages' is not posted by an admin or super_admin, it is mearnt to initially be in 'pending' mode at the 'approval_status' column of database table "messages", awaiting its approval/update from 'pending' to 'approved' or 'rejected' by site manager with an admin or super_admin role. Also, in IkoControls.jsx, admin should have place to manage  individual stages or status of 'messages' like the fetching and update of all pending, of all approved, of all rejected and of all deleted teachings, and thereby be able to over-turn or edit or change their status as best practices in the management of a chat or teaching app.
Inside this IkoControl.jsx, site managers with admin or super_admin role should also have a place to manage comments featured in "Comments.jsx" and all that can be managed of the posted and featured Comments in Comments.jsx of Iko.jsx like deleting, and editing as stored in the database table of "comments".


export default router;   """  database table "messages" :  columns " id 	chat_id 	user_id 	class_id 	title 	summary 	text 	approval_status 	media_url1 	media_type1 	media_url2 	media_type2 	media_url3 	media_type3 	is_flagged 	created_at 	updated_at " """  database table "teachings" : with columns " id 	topic 	description 	lessonNumber 	subjectMatter 	audience 	content 	media_url1 	media_type1 	media_url2 	media_type2 	media_url3 	media_type3 	createdAt 	updatedAt " '


how to check reports and actions like ban, etc
dashboard analytics, use of isblocked and isbanned on users table
--work on the search
Mentors sponsors new applicant by creating of application ticket/coupon and issuing to intending applicats that will signup with it. so use of application coupon (number) from a sponsorer like a mentor, which will lead to the mentor first vetting before new user will be allowed to even get access to the signup.

`audit_logs` database table and dashboard analytics. "" Key Statistics

Total Users: 500

Active Chats: 50

Pending Reports: 10
Analytics ""

 "is_flagged" in "chat" database table with Chat.jsx part of Iko.jsx (messages/comments is flagged),

 in report table, i have reported_id and the reporter_id, that is used when a user is reporting some other user for some kind of system abuse.

 "isblocked" in "users" table to allow user to block other individual users communication and control/stop one-on-one chatting with other individual users. not to block group or general/public post-chat.

 "isbanned" in "users" table that is there actually against the particular user that have it. it indicate that that particular user is banned from some chatting activities and hence cannot access something, perhaps 1. cannot chat/comment on that particular chat/post. or 2. cannot receive those chat/post again. or 3. will receive chat/post but cannot comment from a class, etc etc



 i need help with the coding and logic to make the data input, upload of files including media files into aws s3 storage and the storing of the s3 path URL into a MySQL database , the fetching of those data and files, and their rendering on the output port for users to see. the site administrator herein called admin through Admin.jsx be able to upload/input and render the fetched data. And also, users should be able to upload/input all files (images, emojis, videos, audio, text, etc ) as done in regular chat or teaching apps. Towncrier.jsx is the public view port to access the teachings and needs the functionality to fetch data from database storage and render it. likewise; Iko.jsx is the name for the chat page and should have the functionality to post/input data files into database storage in it and also to fetch and render those data on it as a chatting page.  Note that "teachings" and "messages" are the two forms of contents that are going to be posted and rendered in this chatting website.  Admin.jsx is admin dashboard to input/post both teaching through TowncrierControls.jsx and input/post/upload 'messages' through IkoControls.jsx. Towncrier.jsx is only to fetch 'teachings'  and render it. While, Iko.jsx like every chat app should have functionalities to both post/upload/input the data herein called "messages" and likewise do fetching the data from database/storage before rendering. 
 want to use  "@tanstack/react-query" for the input/uploading 









// import React, { useState } from "react";
// import { useForm } from "react-hook-form";
// import useUpload from "../../admin/hooks/useUpload";
// import EmojiPicker from 'emoji-picker-react';
// import DOMPurify from 'dompurify';
// import './chat.css';
// import { useFetchChats } from "../service/useFetchChats";
// import { useFetchComments } from "../service/useFetchComments";
// import { useFetchTeachings } from "../service/useFetchTeachings";
// import { postComment } from '../service/commentServices';
// import {jwtDecode} from 'jwt-decode';
// import axios from 'axios';


// const Chat = ({ activeItem, chats, teachings }) => {
//   const { handleSubmit, register, reset } = useForm();
//  const { validateFiles: validateTeachingsFiles, mutation: teachingMutation } = useUpload("/teachings");
//   const { validateFiles, mutation: chatMutation } = useUpload("/chats");
//  const { validateFiles: validateCommentFiles, mutation: commentMutation } = useUpload("/comments");


//   //const { data: teachings, isLoading: isLoadingTeachings, error: errorTeachings } = useFetchTeachings();
//   //const { data: chats, isLoading: isLoadingChats, error: errorChats } = useFetchChats();
//   const { data: comments, isLoading: isLoadingComments, error: errorComments } = useFetchComments();

//   const [formData, setFormData] = useState({});
//   const [openEmoji, setOpenEmoji] = useState(false);
//   const [addMode, setAddMode] = useState(false);
//   const [step, setStep] = useState(0); // Tracks current step in multi-input

//   const activeContent = activeItem && activeItem.type === 'chat'
//     ? chats.find(chat => chat.id === activeItem.id)
//     : activeItem && teachings.find(teaching => teaching.id === activeItem.id);


//   const handleNextStep = () => {
//     if (step < 6) setStep(step + 1);
//   };

//   const handlePrevStep = () => {
//     if (step > 0) setStep(step - 1);
//   };

//   const handleEmoji = (e) => {
//     setFormData({ ...formData, comment: formData.comment + e.emoji });
//     setOpenEmoji(false);
//   };

//   const sanitizeMessage = (message) => {
//     return DOMPurify.sanitize(message, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'] });
//   };

//   const handleSendChat = (data) => {
//     const formData = new FormData();
//     formData.append("created_by", data.user_id);
//     formData.append("title", data.title);
//     formData.append("audience", data.audience);
//     formData.append("summary", data.summary);
//     formData.append("text", data.text);
//     formData.append("is_flagged", false);

//     ["media1", "media2", "media3"].forEach((file) => {
//       if (data[file]?.[0]) {
//         formData.append(file, data[file][0]);
//       }
//     });

//     chatMutation.mutate(formData, {
//       onSuccess: () => {
//         console.log("Chat sent!");
//         reset();
//       },
//       onError: (error) => {
//         console.error("Error uploading chat:", error);
//       },
//     });
//   };

//   const handleSendComment = async (data) => {
//     let user_id;

//     const token = localStorage.getItem("token");
//     if (token) {
//       const decodedToken = jwtDecode(token);
//       user_id = decodedToken.user_id;
//     } else {
//       const tokenCookie = document.cookie.split('; ').find(row => row.startsWith('access_token='));
//       if (tokenCookie) {
//         const token = tokenCookie.split('=')[1];
//         const decodedToken = jwtDecode(token);
//         user_id = decodedToken.user_id;
//       } else {
//         console.error("Access token not found in localStorage or cookies");
//         return;
//       }

//       console.log('user_id@chat', user_id);
//     }

//     const formData = new FormData();
//     formData.append("comment", data.comment);
//     formData.append("chat_id", activeItem.id)
//     formData.append("teaching_id", activeItem.id);
//     formData.append("user_id", user_id);
//     console.log('data at formdat@chat', data);
//     ["media1", "media2", "media3"].forEach((file) => {
//       if (data[file]?.[0]) {
//         formData.append(file, data[file][0]);
//       }
//     });

//     commentMutation.mutate(formData, {
//       onSuccess: async (uploadResponse) => {
//         const { mediaUrls } = uploadResponse.data; // Ensure backend returns uploaded media URLs
//         const mediaData = mediaUrls.map((url, index) => ({
//           url,
//           type: data[`media${index + 1}`]?.[0]?.type || "unknown",
//         }));

//         await postComment({
//           chat_id: activeItem.id,
//           teaching_id: activeItem.id,
//           user_id,
//           comment: data.comment,
//           mediaData,
//         });
//         console.log('all data@chat', chat_id, user_id, data.comment, data.chat_id, mediaData);
//         alert("Comment posted successfully!");
//         reset();
//       },
//       onError: (error) => {
//         console.error("Error uploading comment:", error);
//       },
//     });
//   };

//   return (
//     <div className="chat_container">
//       <div className="top">
//         <div className="user">
//           <img src="./avatar.png" alt="" />
//         </div>
//         <div className="texts">
//         <span>{activeContent?.created_by || 'Admin'}</span>
//         <p>{activeContent?.title || activeContent?.topic}</p>
//           <span>Jane Dee</span>
//           <p>Lorem ipsum dolor sit amet, </p>
//         </div>
//         <div className="icons">
//           <img src="./phone.png" alt="" />
//           <img src="./video.png" alt="" />
//           <img src="./info.png" alt="" />
//         </div>
//       </div>

//       <div className="center">
//         {chats?.map((chat) => (
//           <div key={chat.id} className="message">
//             <img src="./avatar.png" alt="Chat Avatar" />
//             <div className="texts">
//               <p>{sanitizeMessage(chat.title)}</p>
//               <p>{sanitizeMessage(chat.text)}</p>
//               <span>1 min ago</span>
//             </div>
//           </div>
//         ))}
//           {teachings?.map((teaching) => (
//           <div key={teaching.id} className="message">
//             <img src="./avatar.png" alt="Chat Avatar" />
//             <div className="texts">
//             <p>{sanitizeMessage(teaching.topic)}</p>
//               <p>{sanitizeMessage(teaching.text)}</p>
//               <span>1 min ago</span>
//             </div>
//           </div>
//         ))}
//         {/* {comments?.map((comment) => (
//           <div key={comment.id} className="message Own">
//             <div className="texts">
//               <p>{sanitizeMessage(comment.comment)}</p>
//               <span>2 mins ago</span>
//             </div>
//           </div>
//         ))} */}
//         <div className="message">
//           <img src="./avatar.png" alt="" />
//           <div className="texts">
//           <p>{sanitizeMessage(activeContent?.text || activeContent?.content)}</p>
//           <span>{new Date(activeContent?.created_at || activeContent?.createdAt).toLocaleString()}</span>
//           </div>
//         </div>

//         {comments?.filter(comment => comment.chat_id === activeItem.id).map((comment) => (
//           <div key={comment.id} className="message Own">
//             <div className="texts">
//               <p>{sanitizeMessage(comment.comment)}</p>
//               <span>{new Date(comment.created_at).toLocaleString()}</span>
//             <img src="https://ik.imagekit.io/amazonmondayp/Amazon_Ecommerce_Capstone_Prjt_row_1_Carousel/61yTkc3VJ1L._AC_SL1000_.jpg?updatedAt=1713057245841" alt="" />
//             <p>Lorem ipsum dolor sit amet consectetur adipisicing elit Velit maxime consectetur accusantium? Eligendi vel quos nisi et dolorem quaerat quidem itaque vero ducimus aspernatur! Aspernatur accusantium nostrum fuga incidunt facere?</p>
           
//           </div>
//         </div>
//         ))}
//       </div>

//       <div className="bottom">
//         <div className="toggle_buttons">
//           <button className={!addMode ? 'active' : ''} onClick={() => setAddMode(false)}>Comment</button>
//           <button className={addMode ? 'active' : ''} onClick={() => setAddMode(true)}>Start New Chat</button>
//         </div>

//         {!addMode ? (
//           <form className="bottom_comment" onSubmit={handleSubmit(handleSendComment)} noValidate>
//             <div className="icons">
//               <img src="./img.png" alt="Upload" />
//               <img src="./camera.png" alt="Camera" />
//               <img src="./mic.png" alt="Mic" />
//             </div>
//             {step === 0 && (
//               <input
//                 type="text"
//                 placeholder="Type a message..."
//                 {...register("comment", { required: "Comment is required" })}
//               />
//             )}
//             {step === 1 && (
//               <input
//                 type="file"
//                 multiple
//                 {...register("media1", { validate: validateFiles })}
//               />
//             )}
//             {step === 2 && (
//               <input
//                 type="file"
//                 multiple
//                 {...register("media2", { validate: validateFiles })}
//               />
//             )}
//             {step === 3 && (
//               <input
//                 type="file"
//                 multiple
//                 {...register("media3", { validate: validateFiles })}
//               />
//             )}
//             <div className="emoji">
//               <img src="./emoji.png" alt="Emoji Picker" onClick={() => setOpenEmoji(!openEmoji)} />
//               {openEmoji && <EmojiPicker onEmojiClick={handleEmoji} />}
//             </div>
//             <div className="input-buttons">
//               {step < 3 && <button type="button" onClick={handleNextStep}>Next</button>}
//               {step > 0 && <button type="button" onClick={handlePrevStep}>Previous</button>}
//             </div>
//             <button className="SendButton" type="submit">Send</button>
//           </form>
//         ) : (
//           <form className="bottom_presentation" onSubmit={handleSubmit(handleSendChat)} noValidate>
//             {step === 0 && (
//               <input
//                 type="text"
//                 placeholder="Enter Title"
//                 {...register("title", { required: "Title is required" })}
//               />
//             )}
//             {step === 1 && (
//               <input
//                 type="text"
//                 placeholder="Enter Summary"
//                 {...register("summary", { required: "Summary is required" })}
//               />
//             )}
//             {step === 2 && (
//               <input
//                 type="text"
//                 placeholder="Enter Audience"
//                 {...register("audience", { required: "Audience is required" })}
//               />
//             )}
//             {step === 3 && (
//               <textarea
//                 placeholder="Enter Main Text"
//                 {...register("text", { required: "Main text is required" })}
//               />
//             )}
//             {step === 4 && (
//               <input
//                 type="file"
//                 multiple
//                 {...register("media1", { validate: validateFiles })}
//               />
//             )}
//             {step === 5 && (
//               <input
//                 type="file"
//                 multiple
//                 {...register("media2", { validate: validateFiles })}
//               />
//             )}
//             {step === 6 && (
//               <input
//                 type="file"
//                 multiple
//                 {...register("media3", { validate: validateFiles })}
//               />
//             )}
//             <div className="icons">
//               <img src="./img.png" alt="Upload" />
//               <img src="./camera.png" alt="Camera" />
//               <img src="./mic.png" alt="Mic" />
//             </div>
//             <div className="input-buttons">
//               {step < 6 && <button type="button" onClick={handleNextStep}>Next</button>}
//               {step > 0 && <button type="button" onClick={handlePrevStep}>Previous</button>}
//             </div>
//             <button className="SendButton" style={{ width: '10wv' }} type="submit">Send</button>
//           </form>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Chat;






import React, { useState } from "react";
import { useForm } from "react-hook-form";
import useUpload from "../../admin/hooks/useUpload";
import EmojiPicker from "emoji-picker-react";
import DOMPurify from "dompurify";
import ReactPlayer from "react-player";
import "./chat.css";
import { useFetchChats } from "../service/useFetchChats";
import { useFetchComments } from "../service/useFetchComments";
import { useFetchTeachings } from "../service/useFetchTeachings";
import { postComment } from "../service/commentServices";
import jwtDecode from "jwt-decode";
import axios from "axios";
import MediaGallery from "./MediaGallery"; // Import MediaGallery Component

const Chat = ({ activeItem, chats, teachings, comments: initialComments }) => {
  const { handleSubmit, register, reset } = useForm();
  const { validateFiles, mutation: chatMutation } = useUpload("/chats");
  const { validateFiles: validateCommentFiles, mutation: commentMutation } = useUpload("/comments");

  // Fix duplicate variable name
  const { data: fetchedComments, isLoading: isLoadingComments } = useFetchComments(activeItem);

  const [formData, setFormData] = useState({});
  const [openEmoji, setOpenEmoji] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [step, setStep] = useState(0);
  const [playingMedia, setPlayingMedia] = useState(null);

  const activeContent =
    activeItem && activeItem.type === "chat"
      ? chats.find((chat) => chat.id === activeItem.id)
      : activeItem
      ? teachings.find((teaching) => teaching.id === activeItem.id)
      : null;

  if (!activeItem) {
    return <p className="status">Select a chat or teaching to start.</p>;
  }

  const handleEmoji = (e) => {
    setFormData({ ...formData, comment: (formData.comment || "") + e.emoji });
    setOpenEmoji(false);
  };

  const sanitizeMessage = (message) => {
    return DOMPurify.sanitize(message, { ALLOWED_TAGS: ["b", "i", "em", "strong", "a"] });
  };

  const handleSendComment = async (data) => {
    let user_id;
    const token = localStorage.getItem("token");

    if (token) {
      user_id = jwtDecode(token).user_id;
    } else {
      const tokenCookie = document.cookie.split("; ").find((row) => row.startsWith("access_token="));
      if (tokenCookie) {
        user_id = jwtDecode(tokenCookie.split("=")[1]).user_id;
      } else {
        console.error("Access token not found");
        return;
      }
    }

    const formData = new FormData();
    formData.append("comment", data.comment);
    formData.append(activeItem.type === "chat" ? "chat_id" : "teaching_id", activeItem.id);
    formData.append("user_id", user_id);

    ["media1", "media2", "media3"].forEach((file) => {
      if (data[file]?.[0]) {
        formData.append(file, data[file][0]);
      }
    });

    commentMutation.mutate(formData, {
      onSuccess: async (uploadResponse) => {
        const { mediaUrls } = uploadResponse.data;
        const mediaData = mediaUrls.map((url, index) => ({
          url,
          type: data[`media${index + 1}`]?.[0]?.type || "unknown",
        }));

        await postComment({
          chat_id: activeItem.type === "chat" ? activeItem.id : null,
          teaching_id: activeItem.type === "teaching" ? activeItem.id : null,
          user_id,
          comment: data.comment,
          mediaData,
        });

        alert("Comment posted successfully!");
        reset();
      },
      onError: (error) => console.error("Error uploading comment:", error),
    });
  };

  return (
    <div className="chat_container">
      <div className="top">
        <div className="user">
          <img src="./avatar.png" alt="Avatar" />
        </div>
        <div className="texts">
          <span>{activeContent?.created_by || "Admin"}</span>
          <p>{activeContent?.title || activeContent?.topic}</p>
        </div>
        <div className="icons">
          <img src="./phone.png" alt="Phone" />
          <img src="./video.png" alt="Video" />
          <img src="./info.png" alt="Info" />
        </div>
      </div>

      <div className="center">
        <div className="message">
          <img src="./avatar.png" alt="Chat Avatar" />
          <div className="texts">
            <p>{sanitizeMessage(activeContent?.text || activeContent?.content)}</p>
            <span>{new Date(activeContent?.created_at || activeContent?.createdAt).toLocaleString()}</span>
          </div>
        </div>

        {isLoadingComments ? (
          <p>Loading comments...</p>
        ) : (
          fetchedComments
            ?.filter(
              (comment) =>
                (activeItem?.type === "chat" && comment.chat_id === activeItem?.id) ||
                (activeItem?.type === "teaching" && comment.teaching_id === activeItem?.id)
            )
            .map((comment) => (
              <div key={comment.id} className="message Own">
                <div className="texts">
                  <p>{sanitizeMessage(comment.comment)}</p>
                  <span>{new Date(comment.created_at).toLocaleString()}</span>
                  <MediaGallery
                    mediaFiles={[
                      { url: comment.media_url1, type: comment.media_type1 },
                      { url: comment.media_url2, type: comment.media_type2 },
                      { url: comment.media_url3, type: comment.media_type3 },
                    ].filter((media) => media.url)}
                  />
                </div>
              </div>
            ))
        )}
      </div>

      <div className="bottom">
        <div className="toggle_buttons">
          <button className={!addMode ? "active" : ""} onClick={() => setAddMode(false)}>
            Comment
          </button>
          <button className={addMode ? "active" : ""} onClick={() => setAddMode(true)}>
            Start New Chat
          </button>
        </div>

        {!addMode ? (
          <form className="bottom_comment" onSubmit={handleSubmit(handleSendComment)} noValidate>
            <input type="text" placeholder="Type a message..." {...register("comment", { required: "Comment is required" })} />
            <button className="SendButton" type="submit">Send</button>
          </form>
        ) : (
          <p>Chat functionality here</p>
        )}
      </div>
    </div>
  );
};

export default Chat;
