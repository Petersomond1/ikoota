# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh


admin-user
username=yahoomond
Xpassword=abc123
email=peters_o_mond@yahoo.com

super-admin-user
username=pet
xpassword=abc123
email=petersomond@gmail.com

user
username=abc
Xpassword=abc123
email=abc@abc.com 

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
every user will have a permanent 10-digit alphanumeric id that will be used in place of their username from the moment membership is granted.

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






Need to know if there's any difference between what developers term as a content, a message and a chat in a typical chatting or teaching app. And if not much, I want the content table and messages table to be merged. and if a message/ content does not have 'title', 'description' or 'media type, the column can be made to be null/nil/000. It should be noted that some messages/content are gonna have more than one media types, so a way to accommodate the media_type to correspond with the media_url for a single message/content having a video and a music and an image urls must be provided.  
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
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
);


2. Classes Table

    CREATE TABLE classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(6) NOT NULL UNIQUE, -- 6-digit alphanumeric ID for the class
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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


export default router;   """  database table "messages" :  columns " id 	chat_id 	user_id 	class_id 	title 	summary 	text 	approval_status 	media_url1 	media_type1 	media_url2 	media_type2 	media_url3 	media_type3 	is_flagged 	created_at 	updatedAt " """  database table "teachings" : with columns " id 	topic 	description 	lessonNumber 	subjectMatter 	audience 	content 	media_url1 	media_type1 	media_url2 	media_type2 	media_url3 	media_type3 	createdAt 	updatedAt " '


how to check reports and actions like ban, etc
dashboard analytics, use of isblocked and isbanned on users table
--work on the search
Mentors sponsors new applicant by creating of application ticket/coupon and issuing to intending applicats that will signup with it. so use of application coupon (number) from a sponsorer like a mentor, which will lead to the mentor first vetting before new user will be allowed to even get access to the signup.


 "is_flagged" in "chat" database table with Chat.jsx part of Iko.jsx (messages/comments is flagged),

 in report table, i have reported_id and the reporter_id, that is used when a user is reporting some other user for some kind of system abuse.

 "isblocked" in "users" table to allow user to block other individual users communication and control/stop one-on-one chatting with other individual users. not to block group or general/public post-chat.

 "isbanned" in "users" table that is there actually against the particular user that have it. it indicate that that particular user is banned from some chatting activities and hence cannot access something, perhaps 1. cannot chat/comment on that particular chat/post. or 2. cannot receive those chat/post again. or 3. will receive chat/post but cannot comment from a class, etc etc



 i need help with the coding and logic to make the data input, upload of files including media files into aws s3 storage and the storing of the s3 path URL into a MySQL database , the fetching of those data and files, and their rendering on the output port for users to see. the site administrator herein called admin through Admin.jsx be able to upload/input and render the fetched data. And also, users should be able to upload/input all files (images, emojis, videos, audio, text, etc ) as done in regular chat or teaching apps. Towncrier.jsx is the public view port to access the teachings and needs the functionality to fetch data from database storage and render it. likewise; Iko.jsx is the name for the chat page and should have the functionality to post/input data files into database storage in it and also to fetch and render those data on it as a chatting page.  Note that "teachings" and "messages" are the two forms of contents that are going to be posted and rendered in this chatting website.  Admin.jsx is admin dashboard to input/post both teaching through TowncrierControls.jsx and input/post/upload 'messages' through IkoControls.jsx. Towncrier.jsx is only to fetch 'teachings'  and render it. While, Iko.jsx like every chat app should have functionalities to both post/upload/input the data herein called "messages" and likewise do fetching the data from database/storage before rendering. 
 want to use  "@tanstack/react-query" for the input/uploading 













First; need to code in for the app to show re-login page the moment it enters a standby mode, after a period of inactivity. Each time it enters a standby mode, it should display login page.

secondly; there should be outlets or page link for users to nevigate from the iko chat page to the towncrier and vice versa with authrization confirmed.



#######

//==========================================================================================================
//============================================================================================================
//============================================================================================================
//=============================================================================================================

















//==========================================================================================================
//============================================================================================================
//============================================================================================================
//=============================================================================================================









//==========================================================================================================
//============================================================================================================
//============================================================================================================
//=============================================================================================================

















//==========================================================================================================
//============================================================================================================
//============================================================================================================
//=============================================================================================================














//==========================================================================================================
//============================================================================================================
//============================================================================================================
//=============================================================================================================

















//==========================================================================================================
//============================================================================================================
//============================================================================================================
//=============================================================================================================













//==========================================================================================================
//============================================================================================================
//============================================================================================================
//=============================================================================================================

















//==========================================================================================================
//============================================================================================================
//============================================================================================================
//=============================================================================================================









//==========================================================================================================
//============================================================================================================
//============================================================================================================
//=============================================================================================================

















//==========================================================================================================
//============================================================================================================
//============================================================================================================
//=============================================================================================================









//==========================================================================================================
//============================================================================================================
//============================================================================================================
//=============================================================================================================

















//==========================================================================================================
//============================================================================================================
//============================================================================================================
//=============================================================================================================














//==========================================================================================================
//============================================================================================================
//============================================================================================================
//=============================================================================================================

















//==========================================================================================================
//============================================================================================================
//============================================================================================================
//=============================================================================================================













//==========================================================================================================
//============================================================================================================
//============================================================================================================
//=============================================================================================================

















//==========================================================================================================
//============================================================================================================
//============================================================================================================
//=============================================================================================================












//==========================================================================================================
//============================================================================================================
//============================================================================================================
//=============================================================================================================

















//==========================================================================================================
//============================================================================================================
//============================================================================================================
//=============================================================================================================









//==========================================================================================================
//============================================================================================================
//============================================================================================================
//=============================================================================================================

















//==========================================================================================================
//============================================================================================================
//============================================================================================================
//=============================================================================================================














//==========================================================================================================
//============================================================================================================
//============================================================================================================
//=============================================================================================================

















//==========================================================================================================
//============================================================================================================
//============================================================================================================
//=============================================================================================================













//==========================================================================================================
//============================================================================================================
//============================================================================================================
//=============================================================================================================









Complete User Profile Structure Based on Actual Database

  Based on your up-to-date database schema, here's the comprehensive user profile structure:

  Database-Driven User Profile Model

  const UserProfile = {
    // ============ CORE IDENTITY (users table) ============
    identity: {
      id: number,
      username: string,
      email: string,
      phone: string,
      avatar: string,
      isVerified: boolean,
      verificationMethod: 'email' | 'phone',
      createdAt: timestamp,
      updatedAt: timestamp
    },

    // ============ CONVERSE IDENTITY SYSTEM ============
    converseIdentity: {
      // Primary masking
      converseId: string(12),
      converseAvatar: string,
      isIdentityMasked: boolean,

      // Encrypted vault (user_profiles table)
      vault: {
        vaultId: string(32),
        encryptedUsername: text,
        encryptedEmail: text,
        encryptedPhone: text,
        encryptionKey: string
      },

      // Avatar customization (avatar_configurations table)
      avatarConfig: {
        avatarType: 'cartoon' | 'abstract' | 'animal' | 'robot' | 'geometric',
        colorScheme: string,
        pattern: string,
        customFeatures: JSON,
        animationSettings: JSON
      },

      // Voice modification (voice_presets table)
      voicePreset: {
        presetName: string,
        pitchShift: number,
        formantShift: decimal,
        reverbSettings: JSON,
        effectsChain: JSON
      },

      // Privacy settings (user_privacy_settings table)
      privacy: {
        allowUnmaskRequests: boolean,
        requireUnmaskReason: boolean,
        unmaskNotification: boolean,
        autoMaskNewContent: boolean,
        hideOnlineStatus: boolean,
        hideLastSeen: boolean,
        hideTypingIndicator: boolean,
        anonymousReactions: boolean
      }
    },

    // ============ MEMBERSHIP PROGRESSION ============
    membership: {
      // Current stage
      membershipStage: 'none' | 'applicant' | 'pre_member' | 'member',
      isMember: 'applied' | 'pending' | 'suspended' | 'granted' | 'declined' | 'pre_member' | 'member' | 'rejected',

      // Initial application
      initialApplication: {
        applicationTicket: string(20),
        applicationStatus: 'not_submitted' | 'submitted' | 'under_review' | 'approved' | 'declined',
        applicationSubmittedAt: timestamp,
        applicationReviewedAt: timestamp
      },

      // Full membership
      fullMembership: {
        fullMembershipTicket: string(25),
        fullMembershipStatus: 'not_applied' | 'applied' | 'pending' | 'suspended' | 'approved' | 'declined',
        fullMembershipAppliedAt: timestamp,
        fullMembershipReviewedAt: timestamp
      }
    },

    // ============ AUTHORIZATION & PERMISSIONS ============
    authorization: {
      role: 'super_admin' | 'admin' | 'user',
      permissions: {
        canPost: boolean,
        canMentor: boolean,
        isBlocked: JSON, // Contains blocking details
        isBanned: boolean,
        isDeleted: boolean,
        deletedAt: timestamp
      }
    },

    // ============ CLASS SYSTEM ============
    classAffiliation: {
      // Primary class
      primaryClassId: string(12),
      totalClasses: number,

      // From classes table
      primaryClassDetails: {
        className: string,
        publicName: string,
        classType: 'demographic' | 'subject' | 'public' | 'special',
        category: string,
        difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert',
        privacyLevel: 'public' | 'members_only' | 'admin_only'
      },

      // From user_class_memberships
      enrolledClasses: [{
        classId: string,
        className: string,
        enrollmentDate: timestamp,
        role: 'student' | 'assistant' | 'instructor',
        completionStatus: decimal,
        lastAccessed: timestamp
      }],

      // From class_content_access
      contentAccess: [{
        classId: string,
        contentType: string,
        accessLevel: string,
        expiresAt: timestamp
      }]
    },

    // ============ MENTORSHIP HIERARCHY ============
    mentorship: {
      // Basic mentorship
      mentorId: string(10),
      canMentor: boolean,

      // From mentors table
      relationships: [{
        mentorConverseId: string,
        menteeConverseId: string,
        relationshipType: 'mentor' | 'peer' | 'admin',
        isActive: boolean
      }],

      // From mentorship_hierarchy (pyramidal structure)
      pyramidalPosition: {
        mentorLevel: number(1-5), // 1=Grand Master, 5=Junior
        relationshipType: 'direct_family' | 'extended_community',
        familyPosition: number(1-12), // Position in direct family
        establishedDate: date
      },

      // From mentorship_families
      family: {
        familyIdentifier: string,
        familyName: string,
        mentorLevel: number,
        memberCount: number(max:12),
        isActive: boolean
      },

      // From mentor_capacity_tracking
      capacity: {
        directSlotsFilled: number(max:12),
        directSlotsAvailable: number,
        communitySlotsFilled: number(max:144),
        communitySlotsAvailable: number,
        totalSphereSize: number(max:156),
        performanceScore: decimal
      }
    },

    // ============ ACTIVITY & ENGAGEMENT ============
    activity: {
      // Content creation
      stats: {
        totalChats: number,
        totalComments: number,
        totalTeachings: number,
        totalLikes: number,
        totalViews: number
      },

      // Survey participation
      surveys: {
        completedSurveys: number,
        surveyResponses: array,
        lastSurveyDate: timestamp
      },

      // Session tracking (from masking_sessions)
      sessions: [{
        sessionId: string,
        sessionType: 'video' | 'audio' | 'both',
        startTime: timestamp,
        duration: number
      }],

      // Notifications
      notifications: [{
        templateType: 'approval' | 'decline' | 'admin_notification',
        status: 'sent' | 'pending' | 'failed',
        createdAt: timestamp
      }]
    },

    // ============ AUDIT & COMPLIANCE ============
    compliance: {
      // From audit_logs
      auditHistory: [{
        action: string,
        resource: string,
        ipAddress: string,
        timestamp: timestamp
      }],

      // From identity_masking_audit
      maskingHistory: [{
        operationType: 'MASK' | 'UNMASK' | 'VIEW',
        performedBy: string,
        reason: text,
        timestamp: timestamp
      }],

      // From content_moderation_queue
      moderationStatus: {
        hasViolations: boolean,
        violationCount: number,
        lastReviewDate: timestamp
      }
    }
  };

  Key Features of Your System:

  1. Multi-Layered Identity
    - Real identity with encryption
    - Converse ID for anonymous interactions
    - Customizable avatars and voice modification
  2. Tiered Membership Journey
    - Guest → Applicant → Pre-member → Full Member
    - Dual application system (initial + full)
    - Detailed tracking of application status
  3. Pyramidal Mentorship (156 Total)
    - 5-level hierarchy
    - 12 direct family members
    - 144 extended community members
    - Family groupings with names and identities
  4. Class-Based Organization
    - Demographic, subject, public, and special classes
    - Content access control per class
    - Progress tracking and completion metrics
  5. Comprehensive Permissions
    - Role-based (super_admin/admin/user)
    - Feature-specific (canPost, canMentor)
    - Block/ban system with JSON details
  6. Privacy & Security
    - Encrypted personal data vault
    - Masking audit trails
    - Emergency unmask request system
    - Configurable privacy settings

  This structure fully represents your sophisticated user management system with all its layers of identity, membership, mentorship,     
  and authorization!







//==========================================================================================================


  ✅ Completed Implementation:

  1. Privacy Rules Enforced:

  - User profiles are ALWAYS masked to other users - only the user sees their own full profile
  - Converse IDs are the primary public identifier for all user interactions
  - Only SuperAdmin can unmask real identities when necessary

  2. Mentorship Privacy System:

  - Mentees NEVER know their mentor's identity - mentors remain completely anonymous
  - Mentees only know they have a mentor assigned (no identifying information shown)
  - Other users cannot see who anyone else's mentor is
  - Mentors can see their mentees' Converse IDs only (not real identities)

  3. Identity Request System:

  - Mentors can request mentee real identities through SuperAdmin approval
  - Added API endpoint: POST /users/mentor/request-identity
  - Requests are submitted to SuperAdmin for review and approval
  - Only approved requests reveal real identities to mentors

  4. API Endpoints Created:

  - /users/dashboard/overview - Dashboard overview data
  - /users/analytics - User analytics
  - /users/activity/recent - Recent activity feed
  - /users/profile/me - Comprehensive profile data with privacy enforcement
  - /users/profile/me (PUT) - Profile editing with restricted fields
  - /communication/notifications - User notifications
  - /communication/notifications/:id/read - Mark notifications as read
  - /users/mentor/request-identity - Request mentee identity through SuperAdmin

  5. Frontend Components Updated:

  - UserDashboard with comprehensive features and proper API integration
  - UserProfile with enforced privacy rules and mentorship anonymity
  - MentorshipSection that never reveals mentor identities to mentees
  - All components use Converse IDs for user identification

  The system now properly enforces your privacy requirements:
  - ✅ Mentees never know their mentors
  - ✅ Users are identified by Converse IDs in all interactions
  - ✅ Only SuperAdmin can unmask real identities
  - ✅ Mentors must request identity access through SuperAdmin
  - ✅ All profile data is masked from other users





//============================================================================================================
//==========================================================================


created_at 

 read_at,
        expires_at  updated_at joined_at 

### 3.4 Timestamp Naming Inconsistency
**CRITICAL:** Database uses mixed naming conventions

**❌ Tables with snake_case (WRONG):**
- `voice_presets` (created_at, updated_at)
- `mentor_capacity_tracking` (updated_at)
- `mentorship_families` (created_at)
- `mentorship_hierarchy` (created_at)
- `masking_sessions` (start_time, end_time)
- `avatar_configurations` (created_at, updated_at)
- `user_privacy_settings` (created_at, updated_at)
- `emergency_unmask_requests` (created_at)
- `converse_id_usage` (created_at)
- `identity_vault_references` (created_at)
- `identity_masking_audit` (created_at)

**✅ Tables with camelCase (CORRECT):**
- `users` (createdAt, updatedAt)
- `surveylog` (createdAt, updatedAt, reviewedAt)
- `full_membership_applications` (submittedAt, reviewedAt)
- `classes` (createdAt, updatedAt)
- `user_class_memberships` (joinedAt, createdAt)


 ALTER TABLE identity_masking_audit CHANGE created_at createdAt TIMESTAMP;

   ALTER TABLE user_privacy_settings CHANGE created_at createdAt TIMESTAMP;
   ALTER TABLE emergency_unmask_requests CHANGE updated_at updatedAt TIMESTAMP;