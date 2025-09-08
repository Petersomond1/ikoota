# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh


admin-user
username=yahoomond
password=abc123
email=peters_o_mond@yahoo.com

super-admin-user
username=pet
password=abc123
email=petersomond@gmail.com

user
username=abc
password=abc123
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
//============================================================================================================
//=============================================================================================================


// ikootaclient/src/components/user/UserDashboard.jsx - ENHANCED WITH CLASS SYSTEM
// Features: Class enrollment, progress tracking, personalized recommendations, content access

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '../auth/UserStatus';
import { getUserAccess } from '../config/accessMatrix';
import api from '../service/api'; 
import './UserDashboard.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// ===============================================
// ✅ ENHANCED API FUNCTIONS WITH CLASS ENDPOINTS
// ===============================================

const fetchUserDashboard = async () => {
  const token = localStorage.getItem("token");
  const { data } = await api.get('/users/dashboard', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

const fetchUserClasses = async () => {
  const token = localStorage.getItem("token");
  const { data } = await api.get('/classes/my-classes', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

const fetchUserProgress = async () => {
  const token = localStorage.getItem("token");
  const { data } = await api.get('/classes/my-progress', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

const fetchUserActivity = async () => {
  const token = localStorage.getItem("token");
  const { data } = await api.get('/classes/my-activity', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

const fetchRecommendations = async () => {
  const token = localStorage.getItem("token");
  const { data } = await api.get('/classes/recommendations', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

const fetchPublicClasses = async (filters = {}) => {
  const params = new URLSearchParams({
    limit: '6',
    ...filters
  });
  const { data } = await api.get(`/classes?${params}`);
  return data;
};

const joinClass = async (classId) => {
  const token = localStorage.getItem("token");
  const { data } = await api.post(`/classes/${classId}/join`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

const leaveClass = async (classId) => {
  const token = localStorage.getItem("token");
  const { data } = await api.post(`/classes/${classId}/leave`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

const markNotificationAsRead = async (notificationId) => {
  const token = localStorage.getItem("token");
  const { data } = await api.put(`/communication/notifications/${notificationId}/read`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

// ===============================================
// ✅ ENHANCED COMPONENT SECTIONS
// ===============================================

const MembershipStatus = ({ status, onApplyClick }) => {
  console.log('🔍 MembershipStatus received status:', status);
  
  if (!status) return (
    <div className="membership-status loading">
      <div className="loading-spinner"></div>
      <p>Loading membership status...</p>
    </div>
  );

  const getStatusColor = (statusType) => {
    switch (statusType) {
      case 'member':
      case 'full_member':
      case 'approved_member':
      case 'approved_pre_member':
      case 'approved':
        return 'success';
      case 'pre_member':
        return 'info';
      case 'ready_to_apply':
      case 'not_submitted':
        return 'primary';
      case 'pending':
      case 'under_review':
        return 'warning';
      case 'declined':
      case 'rejected':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (statusType) => {
    switch (statusType) {
      case 'member':
      case 'full_member':
      case 'approved_member':
      case 'approved_pre_member':
      case 'approved':
        return '✅';
      case 'pre_member':
        return '👤';
      case 'ready_to_apply':
      case 'not_submitted':
        return '📝';
      case 'pending':
      case 'under_review':
        return '⏳';
      case 'declined':
      case 'rejected':
        return '❌';
      default:
        return '📋';
    }
  };

  const membershipStage = status.membership_stage || 'none';
  const memberStatus = status.is_member || 'not_applied';
  
  let applicationStatus, applicationStatusDisplay, applicationDescription;
  
  if (status.application_status) {
    applicationStatus = status.application_status;
    applicationStatusDisplay = status.application_status_display || status.application_status;
    applicationDescription = status.application_description || 'No description available';
  } else {
    applicationStatus = status.initial_application_status || 'not_submitted';
    applicationStatusDisplay = applicationStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    applicationDescription = 'Application status information';
  }
  
  console.log('🔍 MembershipStatus processing:', {
    membershipStage,
    memberStatus,
    applicationStatus,
    applicationStatusDisplay,
    applicationDescription
  });
  
  return (
    <div className="membership-status">
      <div className="status-header">
        <h3>Membership Status</h3>
        <div className={`status-badge ${getStatusColor(applicationStatus)}`}>
          <span className="status-icon">{getStatusIcon(applicationStatus)}</span>
          <span className="status-text">
            {applicationStatus === 'ready_to_apply' ? 'NEW USER' :
             applicationStatus === 'approved_pre_member' ? 'PRE-MEMBER' :
             applicationStatus === 'approved_member' ? 'FULL MEMBER' :
             applicationStatus === 'pending' ? 'UNDER REVIEW' :
             applicationStatusDisplay.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="status-details">
        <div className="detail-item">
          <strong>Current Status:</strong> 
          <span className={`status-indicator ${getStatusColor(memberStatus)}`}>
            {memberStatus === 'applied' && applicationStatus === 'ready_to_apply' ? 'Ready to Apply' :
             memberStatus === 'applied' ? 'Application Submitted' : 
             memberStatus === 'pre_member' ? 'Pre-Member' :
             memberStatus === 'member' ? 'Full Member' :
             memberStatus.replace(/_/g, ' ')}
          </span>
        </div>
        
        <div className="detail-item">
          <strong>Application Status:</strong> 
          <span className={`status-indicator ${getStatusColor(applicationStatus)}`}>
            {applicationStatusDisplay}
          </span>
        </div>

        {status.user_created && (
          <div className="detail-item">
            <strong>Member Since:</strong> 
            <span>{new Date(status.user_created).toLocaleDateString()}</span>
          </div>
        )}

        {(status.application_ticket || status.survey_ticket) && (
          <div className="detail-item">
            <strong>Application ID:</strong> 
            <span className="application-ticket">
              {status.application_ticket || status.survey_ticket}
            </span>
          </div>
        )}
      </div>

      <div className="status-actions">
        {applicationStatus === 'ready_to_apply' && (
          <div className="ready-to-apply-message">
            <div className="ready-icon">📝</div>
            <h4>Ready to Apply</h4>
            <p>{applicationDescription}</p>
            <button 
              className="apply-btn"
              onClick={() => window.location.href = '/applicationsurvey'}
            >
              Start Application
            </button>
          </div>
        )}

        {applicationStatus === 'not_submitted' && memberStatus === 'applied' && (
          <div className="not-submitted-message">
            <div className="not-submitted-icon">📝</div>
            <h4>Application Required</h4>
            <p>Complete your membership application to join our community.</p>
            <button 
              className="apply-btn"
              onClick={() => window.location.href = '/applicationsurvey'}
            >
              Submit Application
            </button>
          </div>
        )}

        {(applicationStatus === 'pending' || applicationStatus === 'under_review') && (
          <div className="pending-message">
            <div className="pending-icon">⏳</div>
            <h4>Application Under Review</h4>
            <p>{applicationDescription}</p>
            {status.application_submittedAt && (
              <small>
                Submitted on {new Date(status.application_submittedAt).toLocaleDateString()}
              </small>
            )}
          </div>
        )}

        {(membershipStage === 'member' || applicationStatus === 'approved_member') && (
          <div className="member-benefits">
            <div className="benefits-icon">🎉</div>
            <h4>Full Member Benefits Active</h4>
            <ul>
              <li>✅ Access to Iko Chat</li>
              <li>✅ Full platform access</li>
              <li>✅ Class enrollment</li>
              <li>✅ Priority support</li>
            </ul>
          </div>
        )}

        {(membershipStage === 'pre_member' || applicationStatus === 'approved_pre_member') && (
          <div className="premember-benefits">
            <div className="benefits-icon">👤</div>
            <h4>Pre-Member Access</h4>
            <ul>
              <li>✅ Towncrier content access</li>
              <li>✅ Limited class access</li>
              <li>📝 Full membership application available</li>
            </ul>
            <button 
              className="upgrade-btn"
              onClick={() => window.location.href = '/full-membership'}
            >
              Apply for Full Membership
            </button>
          </div>
        )}

        {(applicationStatus === 'rejected' || applicationStatus === 'declined') && (
          <div className="rejected-message">
            <div className="rejected-icon">❌</div>
            <h4>Application Not Approved</h4>
            <p>{applicationDescription}</p>
            {status.admin_notes && (
              <div className="admin-feedback">
                <strong>Feedback:</strong> {status.admin_notes}
              </div>
            )}
            <button 
              className="reapply-btn"
              onClick={() => window.location.href = '/applicationsurvey'}
            >
              Reapply
            </button>
          </div>
        )}
      </div>
    </div>
  );
}; 

// ✅ ENHANCED CLASS ENROLLMENT COMPONENT
const ClassEnrollmentSection = ({ user }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch user's classes
  const { data: userClasses, isLoading: classesLoading } = useQuery({
    queryKey: ['userClasses'],
    queryFn: fetchUserClasses,
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    retry: 1
  });

  // Fetch recommendations
  const { data: recommendations } = useQuery({
    queryKey: ['classRecommendations'],
    queryFn: fetchRecommendations,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    retry: 1
  });

  // Fetch public classes
  const { data: publicClasses } = useQuery({
    queryKey: ['publicClasses'],
    queryFn: () => fetchPublicClasses({ limit: 4 }),
    staleTime: 3 * 60 * 1000,
    retry: 1
  });

  // Join class mutation
  const joinClassMutation = useMutation({
    mutationFn: joinClass,
    onSuccess: () => {
      queryClient.invalidateQueries(['userClasses']);
      queryClient.invalidateQueries(['classRecommendations']);
      alert('Successfully joined class!');
    },
    onError: (error) => {
      console.error('Failed to join class:', error);
      alert(error.response?.data?.message || 'Failed to join class');
    }
  });

  // Leave class mutation
  const leaveClassMutation = useMutation({
    mutationFn: leaveClass,
    onSuccess: () => {
      queryClient.invalidateQueries(['userClasses']);
      alert('Successfully left class!');
    },
    onError: (error) => {
      console.error('Failed to leave class:', error);
      alert(error.response?.data?.message || 'Failed to leave class');
    }
  });

  const handleJoinClass = (classId) => {
    if (window.confirm('Do you want to join this class?')) {
      joinClassMutation.mutate(classId);
    }
  };

  const handleLeaveClass = (classId) => {
    if (window.confirm('Are you sure you want to leave this class?')) {
      leaveClassMutation.mutate(classId);
    }
  };

  const userClassesData = userClasses?.data || [];
  const recommendedClasses = recommendations?.based_on_interests || recommendations?.popular_classes || [];
  const publicClassesData = publicClasses?.data || [];

  return (
    <div className="class-enrollment-section">
      <div className="section-header">
        <h3>My Classes</h3>
        <button 
          onClick={() => navigate('/classes')}
          className="btn-browse"
        >
          Browse All Classes
        </button>
      </div>

      {classesLoading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your classes...</p>
        </div>
      ) : userClassesData.length === 0 ? (
        <div className="empty-classes">
          <div className="empty-icon">🎓</div>
          <h4>No Classes Yet</h4>
          <p>You haven't joined any classes yet. Explore our available classes below!</p>
        </div>
      ) : (
        <div className="user-classes-grid">
          {userClassesData.slice(0, 4).map(cls => (
            <div key={cls.class_id} className="class-card user">
              <div className="class-header">
                <h4>{cls.class_name}</h4>
                <span className={`status-badge ${cls.is_active ? 'active' : 'inactive'}`}>
                  {cls.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="class-info">
                <p className="class-description">
                  {cls.description?.substring(0, 100)}...
                </p>
                
                <div className="class-meta">
                  <span className="class-type">{cls.class_type}</span>
                  <span className="member-count">{cls.total_members} members</span>
                </div>
              </div>

              <div className="class-actions">
                <button 
                  onClick={() => navigate(`/classes/${encodeURIComponent(cls.class_id)}`)}
                  className="btn-view"
                >
                  View Class
                </button>
                <button 
                  onClick={() => handleLeaveClass(cls.class_id)}
                  className="btn-leave"
                  disabled={leaveClassMutation.isLoading}
                >
                  Leave
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recommended Classes */}
      {recommendedClasses.length > 0 && (
        <div className="recommendations-section">
          <h4>Recommended for You</h4>
          <div className="recommended-classes">
            {recommendedClasses.slice(0, 3).map(cls => (
              <div key={cls.class_id} className="class-card recommended">
                <div className="recommendation-badge">Recommended</div>
                <h5>{cls.class_name}</h5>
                <p>{cls.description?.substring(0, 80)}...</p>
                <div className="class-meta">
                  <span>{cls.class_type}</span>
                  <span>{cls.total_members} members</span>
                </div>
                <button 
                  onClick={() => handleJoinClass(cls.class_id)}
                  className="btn-join"
                  disabled={joinClassMutation.isLoading}
                >
                  Join Class
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Popular Public Classes */}
      {publicClassesData.length > 0 && (
        // <div className="public-classes-section">
          <div className="public-classes">
             <span>Popular Public Classes</span>
            {publicClassesData.slice(0, 3).map(cls => (
              <div key={cls.class_id} className="class-card public">
                <div className="public-badge">Public</div>
                <h5>{cls.class_name}</h5>
                <p>{cls.description?.substring(0, 80)}...</p>
                <div className="class-meta">
                  <span>{cls.class_type}</span>
                  <span>{cls.total_members} members</span>
                </div>
                <button 
                  onClick={() => handleJoinClass(cls.class_id)}
                  className="btn-join"
                  disabled={joinClassMutation.isLoading}
                >
                  Join Class
                </button>
              </div>
            ))}
          </div>
        // </div>
      )}
    </div>
  );
};

// ✅ ENHANCED PROGRESS TRACKING COMPONENT
const ProgressTrackingSection = ({ user }) => {
  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: ['userProgress'],
    queryFn: fetchUserProgress,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    retry: 1
  });

  const { data: activityData } = useQuery({
    queryKey: ['userActivity'],
    queryFn: fetchUserActivity,
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    retry: 1
  });

  if (progressLoading) {
    return (
      <div className="progress-section loading">
        <div className="loading-spinner"></div>
        <p>Loading progress...</p>
      </div>
    );
  }

  const progress = progressData?.progress || {};
  const activity = activityData?.activity || {};

  return (
    <div className="progress-tracking-section">
      <div className="section-header">
        <h3>My Progress</h3>
      </div>

      <div className="progress-stats">
        <div className="progress-stat">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h4>Classes Joined</h4>
            <span className="stat-number">{progress.total_classes_joined || 0}</span>
          </div>
        </div>

        <div className="progress-stat">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h4>Active Classes</h4>
            <span className="stat-number">{progress.active_classes || 0}</span>
          </div>
        </div>

        <div className="progress-stat">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h4>Completion Rate</h4>
            <span className="stat-number">{progress.completion_rate || 0}%</span>
          </div>
        </div>

        <div className="progress-stat">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h4>Attendance Rate</h4>
            <span className="stat-number">{progress.attendance_rate || 0}%</span>
          </div>
        </div>
      </div>

      {activity.recent_participation && activity.recent_participation.length > 0 && (
        <div className="recent-activity">
          <h4>Recent Activity</h4>
          <div className="activity-list">
            {activity.recent_participation.slice(0, 5).map((item, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">
                  {item.type === 'join' ? '➕' :
                   item.type === 'complete' ? '✅' :
                   item.type === 'attend' ? '📅' : '📝'}
                </div>
                <div className="activity-content">
                  <span className="activity-text">{item.description}</span>
                  <span className="activity-time">{new Date(item.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activity.upcoming_events && activity.upcoming_events.length > 0 && (
        <div className="upcoming-events">
          <h4>Upcoming Events</h4>
          <div className="events-list">
            {activity.upcoming_events.slice(0, 3).map((event, index) => (
              <div key={index} className="event-item">
                <div className="event-date">
                  <span className="date">{new Date(event.date).getDate()}</span>
                  <span className="month">{new Date(event.date).toLocaleDateString('en', { month: 'short' })}</span>
                </div>
                <div className="event-info">
                  <h5>{event.title}</h5>
                  <p>{event.class_name}</p>
                  <span className="event-time">{event.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ✅ ENHANCED QUICK ACTIONS WITH CLASS FEATURES
const QuickActions = ({ actions, user }) => {
  const { getUserStatus } = useUser();
  const userStatus = getUserStatus();
  const userAccess = user ? getUserAccess(user) : null;

  console.log('🔍 QuickActions - User Status:', userStatus);
  console.log('🔍 QuickActions - User Access:', userAccess);

  const getActionsForUser = () => {
    const baseActions = [
      {
        text: 'View Profile',
        link: '/profile',
        type: 'primary',
        icon: '👤',
        size: 'small'
      }
    ];

    // Class-related actions for all users
    const classActions = [
      {
        text: 'Browse Classes',
        link: '/classes',
        type: 'info',
        icon: '🎓',
        size: 'small'
      },
      {
        text: 'My Classes',
        link: '/classes/my-classes',
        type: 'secondary',
        icon: '📚',
        size: 'small'
      }
    ];

    // Admin specific actions
    if (userStatus === 'admin') {
      return [
        ...baseActions,
        ...classActions,
        {
          text: 'Admin Panel',
          link: '/admin',
          type: 'admin',
          icon: '🔧',
          size: 'small'
        },
        {
          text: 'Class Management',
          link: '/admin/audienceclassmgr',
          type: 'admin',
          icon: '📋',
          size: 'small'
        },
        {
          text: 'User Management',
          link: '/admin/usermanagement',
          type: 'admin',
          icon: '👥',
          size: 'small'
        },
        {
          text: 'Applications',
          link: '/admin/authcontrols',
          type: 'admin',
          icon: '📝',
          size: 'small'
        },
        {
          text: 'Iko Chat',
          link: '/iko',
          type: 'info',
          icon: '💬',
          size: 'small'
        },
        {
          text: 'Towncrier',
          link: '/towncrier',
          type: 'secondary',
          icon: '📰',
          size: 'small'
        }
      ];
    }

    // Full member actions
    if (userStatus === 'full_member') {
      return [
        ...baseActions,
        ...classActions,
        {
          text: 'Iko Chat',
          link: '/iko',
          type: 'info',
          icon: '💬',
          size: 'small'
        },
        {
          text: 'Towncrier',
          link: '/towncrier',
          type: 'secondary',
          icon: '📰',
          size: 'small'
        }
      ];
    }
    
    // Pre-member actions
    if (userStatus === 'pre_member') {
      return [
        ...baseActions,
        {
          text: 'Public Classes',
          link: '/classes?filter=public',
          type: 'info',
          icon: '🌐',
          size: 'small'
        },
        {
          text: 'Towncrier Content',
          link: '/towncrier',
          type: 'secondary',
          icon: '📰',
          size: 'small'
        },
        {
          text: 'Apply for Full Membership',
          link: '/full-membership-application',
          type: 'success',
          icon: '⬆️',
          size: 'small'
        }
      ];
    }
    
    // Pending verification actions
    if (userStatus === 'pending_verification') {
      return [
        ...baseActions,
        {
          text: 'Public Classes',
          link: '/classes?filter=public',
          type: 'info',
          icon: '🌐',
          size: 'small'
        },
        {
          text: 'Application Status',
          link: '/pending-verification',
          type: 'warning',
          icon: '⏳',
          size: 'small'
        }
      ];
    }
    
    // Needs application actions
    if (userStatus === 'needs_application') {
      return [
        ...baseActions,
        {
          text: 'Public Classes',
          link: '/classes?filter=public',
          type: 'info',
          icon: '🌐',
          size: 'small'
        },
        {
          text: 'Complete Application',
          link: '/applicationsurvey',
          type: 'primary',
          icon: '📝',
          size: 'small'
        }
      ];
    }
    
    return [...baseActions, ...classActions];
  };

  const defaultActions = [
    {
      text: 'Help Center',
      link: '/help',
      type: 'info',
      icon: '❓',
      size: 'small'
    },
    {
      text: 'Settings',
      link: '/settings',
      type: 'default',
      icon: '⚙️',
      size: 'small'
    },
    {
      text: 'Home',
      link: '/',
      type: 'secondary',
      icon: '🏠',
      size: 'small'
    }
  ];

  const userSpecificActions = getActionsForUser();
  const allActions = [...userSpecificActions, ...defaultActions, ...(actions || [])];

  const handleLogout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    window.location.href = '/login';
  };

  return (
    <div className="quick-actions">
      <h3>Quick Actions</h3>
      <div className="actions-grid compact">
        {allActions.map((action, index) => (
          <a 
            key={index} 
            href={action.link} 
            className={`action-btn ${action.type} ${action.size || 'small'}`}
            title={action.description || action.text}
          >
            <div className="action-icon">{action.icon}</div>
            <span className="action-text">{action.text}</span>
            {action.badge && (
              <span className="action-badge">{action.badge}</span>
            )}
          </a>
        ))}
        
        <button 
          onClick={handleLogout}
          className="action-btn danger small"
          title="Sign out of your account"
        >
          <div className="action-icon">🚪</div>
          <span className="action-text">Logout</span>
        </button>
      </div>
    </div>
  );
};

const RecentActivities = ({ activities }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'application':
        return '📝';
      case 'approval':
        return '✅';
      case 'class_join':
        return '🎓';
      case 'class_complete':
        return '🏆';
      case 'course':
        return '📚';
      case 'message':
        return '💬';
      case 'login':
        return '🔐';
      case 'registration':
        return '🎉';
      default:
        return '📋';
    }
  };

  const getActivityColor = (status) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
      case 'declined':
        return 'danger';
      default:
        return 'info';
    }
  };

  const defaultActivities = [
    {
      type: 'registration',
      title: 'Account Created',
      description: 'Welcome to the Ikoota platform!',
      date: new Date().toISOString(),
      status: 'completed'
    },
    {
      type: 'class_join',
      title: 'Browse Classes',
      description: 'Explore available classes to join',
      date: new Date().toISOString(),
      status: 'pending'
    }
  ];

  const displayActivities = activities && activities.length > 0 ? activities : defaultActivities;

  return (
    <div className="recent-activities">
      <h3>Recent Activities</h3>
      <div className="activities-list">
        {displayActivities.map((activity, index) => (
          <div key={index} className="activity-item">
            <div className="activity-icon">
              {getActivityIcon(activity.type)}
            </div>
            <div className="activity-content">
              <h4 className="activity-title">{activity.title}</h4>
              <p className="activity-description">{activity.description}</p>
              <div className="activity-meta">
                <span className="activity-date">
                  {new Date(activity.date).toLocaleDateString()}
                </span>
                <span className={`activity-status ${getActivityColor(activity.status)}`}>
                  {activity.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const NotificationsSection = ({ notifications, onMarkAsRead }) => {
  if (!notifications || notifications.length === 0) {
    return (
      <div className="notifications-section">
        <h3>Notifications</h3>
        <div className="empty-notifications">
          <div className="empty-icon">🔔</div>
          <p>No new notifications</p>
          <small>You're all caught up!</small>
        </div>
      </div>
    );
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
      case 'class':
        return '🎓';
      default:
        return '📢';
    }
  };

  return (
    <div className="notifications-section">
      <h3>Notifications</h3>
      <div className="notifications-list">
        {notifications.map((notification, index) => (
          <div 
            key={notification.id || index} 
            className={`notification ${notification.type} ${notification.read ? 'read' : 'unread'}`}
          >
            <div className="notification-icon">
              {getNotificationIcon(notification.type)}
            </div>
            <div className="notification-content">
              <p className="notification-message">{notification.message}</p>
              <div className="notification-meta">
                <span className="notification-date">
                  {new Date(notification.date || Date.now()).toLocaleDateString()}
                </span>
                {!notification.read && onMarkAsRead && (
                  <button 
                    onClick={() => onMarkAsRead(notification.id)}
                    className="mark-read-btn"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>
            {!notification.read && <div className="unread-indicator"></div>}
          </div>
        ))}
      </div>
    </div>
  );
};

const WelcomeSection = ({ user, dashboardData }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="welcome-section">
      <div className="welcome-content">
        <h1 className="welcome-title">
          {getGreeting()}, {user?.username || 'User'}! 👋
        </h1>
        <p className="welcome-subtitle">
          {dashboardData?.membershipStatus?.membership_stage === 'member' 
            ? "Welcome back to your member dashboard"
            : "Here's your current status and available opportunities"
          }
        </p>
      </div>
      <div className="welcome-stats">
        <div className="stat-item">
          <span className="stat-number">{dashboardData?.stats?.classesJoined || 0}</span>
          <span className="stat-label">Classes Joined</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{dashboardData?.stats?.activitiesCompleted || 0}</span>
          <span className="stat-label">Activities</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{dashboardData?.stats?.daysActive || 1}</span>
          <span className="stat-label">Days Active</span>
        </div>
      </div>
    </div>
  );
};

// ===============================================
// ✅ MAIN ENHANCED USER DASHBOARD COMPONENT
// ===============================================

const UserDashboard = () => {
  const { user, isAuthenticated, getUserStatus } = useUser();
  const queryClient = useQueryClient();

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['userDashboard'],
    queryFn: fetchUserDashboard,
    enabled: !!user && isAuthenticated,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    retry: 1
  });

  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['userDashboard']);
    },
    onError: (error) => {
      console.error('Failed to mark notification as read:', error);
    }
  });

  const handleMarkAsRead = (notificationId) => {
    markAsReadMutation.mutate(notificationId);
  };

  if (!isAuthenticated) {
    return (
      <div className="dashboard-auth-error">
        <div className="auth-error-container">
          <div className="auth-error-icon">🔐</div>
          <h3>Authentication Required</h3>
          <p>Please log in to view your dashboard</p>
          <a href="/login" className="login-btn">Go to Login</a>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-container">
          <div className="loading-spinner large"></div>
          <h3>Loading your dashboard...</h3>
          <p>Please wait while we fetch your latest information</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Error loading dashboard</h3>
          <p>{error.message}</p>
          <button 
            onClick={() => queryClient.invalidateQueries(['userDashboard'])}
            className="retry-btn"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-dashboard enhanced">
      <WelcomeSection user={user} dashboardData={dashboardData} />
      
      <div className="dashboard-grid enhanced">
        <MembershipStatus 
          status={dashboardData?.membershipStatus || user} 
        />
        
        <QuickActions 
          actions={dashboardData?.quickActions}
          user={user}
        />
  
        <RecentActivities 
          activities={dashboardData?.recentActivities} 
        />
      </div>

        <ProgressTrackingSection user={user} />
        {/* <MediaGallerySection user={user} /> */}

        <ClassEnrollmentSection user={user} />
        
      

      {(dashboardData?.notifications?.length > 0) && (
        <NotificationsSection 
          notifications={dashboardData.notifications}
          onMarkAsRead={handleMarkAsRead}
        />
      )}
    </div>
  );
};

export default UserDashboard;



``` 

/* ikootaclient/src/components/user/UserDashboard.css */

.user-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  background-color: #f8f9fa;
  min-height: 100vh;
}

/* ==================================================
   WELCOME SECTION
   ================================================== */

.welcome-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px;
  border-radius: 16px;
  margin-bottom: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.welcome-content h1 {
  font-size: 2.5rem;
  margin: 0 0 10px 0;
  font-weight: 700;
}

.welcome-subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  margin: 0;
}

.welcome-stats {
  display: flex;
  gap: 30px;
}

.stat-item {
  text-align: center;
  background: rgba(255,255,255,0.1);
  padding: 20px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.stat-number {
  display: block;
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.8;
}

/* ==================================================
   DASHBOARD GRID
   ================================================== */

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 30px;
}

/* ==================================================
   MEMBERSHIP STATUS
   ================================================== */

.membership-status {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  border: 1px solid #e1e5e9;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e9ecef;
}

.status-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.4rem;
  font-weight: 600;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-badge.info {
  background: #cce7ff;
  color: #0c5460;
  border: 1px solid #b8daff;
}

.status-badge.primary {
  background: #e2e3f1;
  color: #383d41;
  border: 1px solid #d6d8db;
}

.status-badge.warning {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.status-badge.danger {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.status-badge.default {
  background: #e2e3e5;
  color: #383d41;
  border: 1px solid #d6d8db;
}

.status-details {
  display: grid;
  gap: 12px;
  margin-bottom: 20px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.detail-item strong {
  color: #495057;
  font-weight: 600;
}

.status-indicator {
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.85rem;
}

.status-indicator.success {
  background: #d4edda;
  color: #155724;
}

.status-indicator.info {
  background: #cce7ff;
  color: #0c5460;
}

.status-indicator.primary {
  background: #e2e3f1;
  color: #383d41;
}

.status-indicator.warning {
  background: #fff3cd;
  color: #856404;
}

.status-indicator.danger {
  background: #f8d7da;
  color: #721c24;
}

.application-ticket {
  font-family: 'Courier New', monospace;
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.85rem;
  border: 1px solid #dee2e6;
}

/* ==================================================
   STATUS ACTIONS
   ================================================== */

.status-actions > div {
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  margin-top: 15px;
}

.ready-to-apply-message,
.not-submitted-message,
.rejected-message {
  border-color: #667eea;
}

.pending-message {
  border-color: #f39c12;
  background: #fff9c4;
  border: 1px solid #ffeaa7;
}

.member-benefits,
.approved-message {
  border-color: #27ae60;
}

.premember-benefits {
  border-color: #3498db;
}

.ready-icon,
.not-submitted-icon,
.pending-icon,
.rejected-icon,
.approved-icon,
.benefits-icon {
  font-size: 2rem;
  margin-bottom: 10px;
}

.status-actions h4 {
  margin: 10px 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.status-actions p {
  margin: 10px 0;
  color: #6c757d;
  line-height: 1.5;
}

.status-actions ul {
  list-style: none;
  padding: 0;
  margin: 15px 0;
}

.status-actions li {
  padding: 4px 0;
  color: #495057;
}

.apply-btn,
.reapply-btn,
.upgrade-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 15px;
  transition: transform 0.2s ease;
  font-size: 0.9rem;
}

.apply-btn:hover,
.reapply-btn:hover,
.upgrade-btn:hover {
  transform: translateY(-2px);
}

.upgrade-btn {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
}

.admin-feedback {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 6px;
  padding: 10px;
  margin: 10px 0;
  font-size: 0.9rem;
  text-align: left;
}

/* ==================================================
   QUICK ACTIONS
   ================================================== */

.quick-actions {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  border: 1px solid #e1e5e9;
}

.quick-actions h3 {
  margin: 0 0 25px 0;
  color: #2c3e50;
  font-size: 1.4rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.actions-grid.compact {
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
  margin-top: 15px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 15px;
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.3s ease;
  border: 1px solid #e1e5e9;
  position: relative;
}

.action-btn.small {
  padding: 8px 12px;
  font-size: 0.85rem;
  min-height: 60px;
  border-radius: 8px;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.action-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.action-btn.admin {
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  color: white;
  border: none;
}

.action-btn.secondary {
  background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
  color: white;
  border: none;
}

.action-btn.success {
  background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
  color: white;
  border: none;
}

.action-btn.info {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border: none;
}

.action-btn.warning {
  background: linear-gradient(135deg, #f1c40f 0%, #f39c12 100%);
  color: white;
  border: none;
}

.action-btn.default {
  background: #f8f9fa;
  color: #495057;
  border: 1px solid #dee2e6;
}

.action-btn.danger {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  color: white;
  border: none;
  cursor: pointer;
}

.action-icon {
  font-size: 1.8rem;
  margin-bottom: 8px;
}

.action-btn.small .action-icon {
  font-size: 1.2rem;
  margin-bottom: 4px;
}

.action-text {
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
}

.action-btn.small .action-text {
  font-size: 0.75rem;
  line-height: 1.2;
}

.action-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #dc3545;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-classes-grid{
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  color: gray;
}

.progress-stats{
display: flex;
flex-direction: row;
justify-content: space-between;
}


 .public-classes{
  display:flex;
  flex-direction: row;
  /* flex-wrap: wrap; */
  gap: 15px;
  justify-content: center;
  align-items: center;
  width:100%;
  color: black;
  font-weight: bold;
  margin: 0 auto;
  padding: 10px;
}
/* ==================================================
   RECENT ACTIVITIES
   ================================================== */

.recent-activities {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  border: 1px solid #e1e5e9;
  grid-column: span 2;
}

.recent-activities h3 {
  margin: 0 0 25px 0;
  color: #2c3e50;
  font-size: 1.4rem;
}

.activities-list {
  margin-top: 20px;
}

.activity-item {
  display: flex;
  gap: 15px;
  padding: 15px;
  border-radius: 12px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  margin-bottom: 10px;
}

.activity-icon {
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.activity-content {
  flex: 1;
}

.activity-title {
  margin: 0 0 5px 0;
  color: #2c3e50;
  font-size: 1rem;
  font-weight: 600;
}

.activity-description {
  margin: 0 0 10px 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.activity-meta {
  display: flex;
  gap: 15px;
  align-items: center;
}

.activity-date {
  font-size: 0.8rem;
  color: #6c757d;
}

.activity-status {
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
}

.activity-status.success {
  background: #d4edda;
  color: #155724;
}

.activity-status.warning {
  background: #fff3cd;
  color: #856404;
}

.activity-status.danger {
  background: #f8d7da;
  color: #721c24;
}

.activity-status.info {
  background: #d1ecf1;
  color: #0c5460;
}

/* ==================================================
   NOTIFICATIONS
   ================================================== */

.notifications-section {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  border: 1px solid #e1e5e9;
  margin-top: 30px;
}

.notifications-section h3 {
  margin: 0 0 25px 0;
  color: #2c3e50;
  font-size: 1.4rem;
}

.empty-notifications {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 15px;
  opacity: 0.5;
}

.notifications-list {
  margin-top: 15px;
}

.notification {
  display: flex;
  gap: 15px;
  padding: 15px;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  position: relative;
  margin-bottom: 10px;
}

.notification.unread {
  background: #f8f9ff;
  border-left: 4px solid #667eea;
}

.notification.read {
  background: #f8f9fa;
  opacity: 0.8;
}

.notification-icon {
  font-size: 1.2rem;
  width: 30px;
  text-align: center;
}

.notification-content {
  flex: 1;
}

.notification-message {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 0.95rem;
  line-height: 1.4;
}

.notification-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notification-date {
  font-size: 0.8rem;
  color: #6c757d;
}

.mark-read-btn {
  background: none;
  border: none;
  color: #667eea;
  font-size: 0.8rem;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.mark-read-btn:hover {
  background: rgba(102, 126, 234, 0.1);
}

.unread-indicator {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 8px;
  height: 8px;
  background: #667eea;
  border-radius: 50%;
}

/* ==================================================
   LOADING STATES
   ================================================== */

.dashboard-loading,
.dashboard-error,
.dashboard-auth-error {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: 40px;
}

.loading-container,
.error-container,
.auth-error-container {
  text-align: center;
  background: white;
  padding: 60px 40px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  max-width: 400px;
  width: 100%;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px auto;
}

.loading-spinner.large {
  width: 60px;
  height: 60px;
  border-width: 6px;
}

.membership-status.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #6c757d;
}

.membership-status.loading .loading-spinner {
  width: 32px;
  height: 32px;
  border-width: 3px;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon,
.auth-error-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  display: block;
}

.loading-container h3,
.error-container h3,
.auth-error-container h3 {
  color: #2c3e50;
  margin: 0 0 15px 0;
  font-size: 1.5rem;
}

.loading-container p,
.error-container p,
.auth-error-container p {
  color: #6c757d;
  margin: 0 0 20px 0;
  line-height: 1.5;
}

.retry-btn,
.login-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  transition: background-color 0.3s ease;
}

.retry-btn:hover,
.login-btn:hover {
  background: #5a6fd8;
}

small {
  color: #6c757d;
  font-size: 0.8rem;
  display: block;
  margin-top: 8px;
}

/* ==================================================
   RESPONSIVE DESIGN
   ================================================== */

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .recent-activities {
    grid-column: span 1;
  }
  
  .welcome-section {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }
  
  .welcome-stats {
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .user-dashboard {
    padding: 15px;
  }
  
  .welcome-section {
    padding: 30px 20px;
  }
  
  .welcome-content h1 {
    font-size: 2rem;
  }
  
  .welcome-subtitle {
    font-size: 1rem;
  }
  
  .welcome-stats {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .stat-item {
    padding: 15px;
  }
  
  .membership-status,
  .quick-actions,
  .recent-activities,
  .notifications-section {
    padding: 20px;
  }
  
  .actions-grid,
  .actions-grid.compact {
    grid-template-columns: 1fr;
  }
  
  .activity-item {
    flex-direction: column;
    text-align: center;
  }
  
  .activity-meta {
    justify-content: center;
  }
  
  .status-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .detail-item {
    flex-direction: column;
    gap: 4px;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .user-dashboard {
    padding: 10px;
  }
  
  .welcome-section {
    padding: 20px 15px;
  }
  
  .welcome-content h1 {
    font-size: 1.5rem;
  }
  
  .dashboard-grid {
    gap: 20px;
  }
  
  .membership-status,
  .quick-actions,
  .recent-activities,
  .notifications-section {
    padding: 15px;
  }
  
  .notification {
    flex-direction: column;
    text-align: center;
  }
  
  .notification-meta {
    flex-direction: column;
    gap: 10px;
  }
}

/* ==================================================
   DARK MODE SUPPORT (OPTIONAL)
   ================================================== */

@media (prefers-color-scheme: dark) {
  .user-dashboard {
    background-color: #1a1a1a;
    color: #f8f9fa;
  }
  
  .membership-status,
  .quick-actions,
  .recent-activities,
  .notifications-section,
  .loading-container,
  .error-container,
  .auth-error-container {
    background: #2d3748;
    border-color: #4a5568;
    color: #f8f9fa;
  }
  
  .status-header h3,
  .quick-actions h3,
  .recent-activities h3,
  .notifications-section h3,
  .activity-title {
    color: #f8f9fa;
  }
  
  .detail-item {
    border-bottom-color: #4a5568;
  }
  
  .activity-item {
    background: #4a5568;
    border-color: #5a6578;
  }
  
  .action-btn.default {
    background: #4a5568;
    color: #f8f9fa;
    border-color: #5a6578;
  }
  
  .notification.unread {
    background: #2a3441;
  }
  
  .notification.read {
    background: #3a4451;
  }
}

/* ==================================================
   UTILITY CLASSES
   ================================================== */

.text-center {
  text-align: center;
}

.text-muted {
  color: #6c757d;
}

.mt-20 {
  margin-top: 20px;
}

.mb-20 {
  margin-bottom: 20px;
}

.p-20 {
  padding: 20px;
}

.border-radius-12 {
  border-radius: 12px;
}

.shadow-sm {
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.shadow-md {
  box-shadow: 0 4px 20px rgba(0,0,0,0.12);
}

.transition-all {
  transition: all 0.3s ease;
}





NEW DOWN

ikootaclient/src/components/user/UserDashboard.css
/* Comprehensive User Dashboard Styles - Enhanced and Merged */

.user-dashboard-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  animation: fadeIn 0.8s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.user-dashboard-container.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

/* Dashboard Header */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 30px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
  border-radius: 20px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  transition: all 0.3s ease;
}

.dashboard-header:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 50px rgba(0, 0, 0, 0.15);
}

.welcome-section h1 {
  margin: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 36px;
  font-weight: 800;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.welcome-section p {
  margin: 12px 0 0 0;
  color: #6c757d;
  font-size: 18px;
  font-weight: 500;
}

.dashboard-navigation {
  display: flex;
  gap: 8px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 249, 255, 0.8) 100%);
  padding: 12px;
  border-radius: 15px;
  backdrop-filter: blur(20px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.dashboard-navigation button {
  padding: 12px 20px;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  color: #5d6d7e;
  transition: all 0.3s;
  white-space: nowrap;
}

.dashboard-navigation button:hover {
  background: white;
  color: #2c3e50;
}

.dashboard-navigation button.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
}

/* Membership Status Card - Enhanced */
.membership-status-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.12);
  margin-bottom: 30px;
  border: 1px solid rgba(102, 126, 234, 0.1);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.membership-status-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.membership-status-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 15px 60px rgba(0, 0, 0, 0.15);
}

.membership-status {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.12);
  margin-bottom: 30px;
  border: 1px solid rgba(102, 126, 234, 0.1);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.membership-status::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.membership-status:hover {
  transform: translateY(-3px);
  box-shadow: 0 15px 60px rgba(0, 0, 0, 0.15);
}

.membership-status.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.status-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 24px;
  font-weight: 600;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 20px;
  font-weight: 600;
  color: white;
}

.status-badge.success {
  background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
}

.status-badge.info {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
}

.status-badge.warning {
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
}

.status-badge.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.status-badge.danger {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
}

.status-badge.default {
  background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
}

.status-icon {
  font-size: 18px;
}

.status-text {
  font-size: 14px;
  letter-spacing: 0.5px;
}

/* Membership Progression */
.membership-progression {
  margin-bottom: 25px;
}

.progress-stages {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  padding: 20px 0;
}

.progress-stages::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 6px;
  background: linear-gradient(90deg, #ecf0f1 0%, #d6d8db 100%);
  border-radius: 3px;
  z-index: 1;
}

.progress-stages::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  width: 0%;
  height: 6px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 3px;
  z-index: 1;
  animation: progressFill 2s ease-in-out;
  transition: width 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

@keyframes progressFill {
  0% { width: 0%; }
  100% { width: var(--progress-width, 0%); }
}

.stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 2;
  background: white;
  padding: 0 15px;
  transition: all 0.3s ease;
}

.stage:hover {
  transform: translateY(-2px);
}

.stage-icon {
  font-size: 28px;
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #ecf0f1;
  transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  border: 3px solid #ecf0f1;
  position: relative;
  overflow: hidden;
}

.stage-icon::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transition: all 0.3s ease;
  transform: translate(-50%, -50%);
}

.stage.active .stage-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  transform: scale(1.1);
}

.stage.completed .stage-icon {
  background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
  color: white;
}

.stage-label {
  font-weight: 600;
  color: #7f8c8d;
  font-size: 14px;
}

.stage.active .stage-label,
.stage.completed .stage-label {
  color: #2c3e50;
}

/* Status Actions */
.status-actions {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 10px;
}

.action-message {
  text-align: center;
}

.action-message h4 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 18px;
}

.action-message p {
  margin: 0 0 15px 0;
  color: #5d6d7e;
  line-height: 1.5;
}

.action-message ul {
  list-style: none;
  padding: 0;
  margin: 15px 0;
}

.action-message li {
  padding: 5px 0;
  color: #5d6d7e;
}

.action-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s;
  margin-top: 10px;
}

.action-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.action-btn.success {
  background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
  color: white;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

/* Dashboard Overview */
.dashboard-overview {
  margin-bottom: 25px;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 15px;
}

.overview-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 25px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
  border: 1px solid #e1e5e9;
  position: relative;
  overflow: hidden;
}

.overview-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s ease;
}

.overview-card:hover::before {
  left: 100%;
}

.overview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.card-icon {
  font-size: 36px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  flex-shrink: 0;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.card-icon::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  animation: sparkle 3s ease-in-out infinite;
}

@keyframes sparkle {
  0%, 100% { opacity: 0; transform: rotate(0deg); }
  50% { opacity: 1; transform: rotate(180deg); }
}

.overview-card:hover .card-icon {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.card-content {
  flex: 1;
}

.card-content h3 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
}

.identity-status {
  font-weight: 600;
  margin-bottom: 8px;
}

.identity-status.masked {
  color: #e74c3c;
}

.identity-status.revealed {
  color: #27ae60;
}

.mentor-level {
  font-weight: 600;
  color: #8e44ad;
  margin-bottom: 5px;
}

.class-stats {
  display: flex;
  gap: 15px;
  margin-bottom: 8px;
}

.class-stats span {
  font-weight: 600;
  color: #2c3e50;
}

/* Dashboard Grid Layout */
.dashboard-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;
}

.dashboard-main {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.dashboard-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Quick Actions */
.quick-actions {
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.quick-actions h3 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 22px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 15px;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.action-card.primary {
  background: linear-gradient(135deg, #667eea05 0%, #764ba205 100%);
  border-color: rgba(102, 126, 234, 0.2);
}

.action-card.success {
  background: linear-gradient(135deg, #27ae6005 0%, #22995405 100%);
  border-color: rgba(39, 174, 96, 0.2);
}

.action-card.info {
  background: linear-gradient(135deg, #3498db05 0%, #2980b905 100%);
  border-color: rgba(52, 152, 219, 0.2);
}

.action-card.mentor {
  background: linear-gradient(135deg, #8e44ad05 0%, #71368a05 100%);
  border-color: rgba(142, 68, 173, 0.2);
}

.action-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.1);
}

.action-card.primary:hover {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea10 0%, #764ba210 100%);
}

.action-card.success:hover {
  border-color: #27ae60;
  background: linear-gradient(135deg, #27ae6010 0%, #22995410 100%);
}

.action-card.info:hover {
  border-color: #3498db;
  background: linear-gradient(135deg, #3498db10 0%, #2980b910 100%);
}

.action-card.mentor:hover {
  border-color: #8e44ad;
  background: linear-gradient(135deg, #8e44ad10 0%, #71368a10 100%);
}

.action-icon {
  font-size: 24px;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.8);
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.action-content h4 {
  margin: 0 0 5px 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
}

.action-content p {
  margin: 0;
  color: #7f8c8d;
  font-size: 14px;
  line-height: 1.4;
}

/* Activity Feed */
.activity-feed {
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.activity-feed h3 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 22px;
}

.activity-feed.empty {
  text-align: center;
  padding: 40px 25px;
}

.empty-state {
  color: #7f8c8d;
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 15px;
}

.empty-state h4 {
  margin: 0 0 10px 0;
  color: #95a5a6;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 10px;
  border-left: 4px solid #ecf0f1;
}

.activity-item.chat {
  border-left-color: #3498db;
}

.activity-item.teaching {
  border-left-color: #e67e22;
}

.activity-item.class {
  border-left-color: #27ae60;
}

.activity-item.mentorship {
  border-left-color: #8e44ad;
}

.activity-item.membership {
  border-left-color: #f39c12;
}

.activity-icon {
  font-size: 20px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 8px;
  flex-shrink: 0;
}

.activity-content h5 {
  margin: 0 0 5px 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
}

.activity-content p {
  margin: 0 0 8px 0;
  color: #5d6d7e;
  font-size: 14px;
  line-height: 1.4;
}

.activity-content small {
  color: #95a5a6;
  font-size: 12px;
}

/* Notification Center */
.notification-center {
  background: white;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.notification-center.empty {
  text-align: center;
}

.notifications-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.notifications-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
}

.notification-count {
  background: #e74c3c;
  color: white;
  padding: 4px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  position: relative;
  transition: all 0.3s;
}

.notification-item.unread {
  background: linear-gradient(135deg, #3498db05 0%, #2980b905 100%);
  border-left: 3px solid #3498db;
}

.notification-item:hover {
  background: #ecf0f1;
}

.notification-icon {
  font-size: 16px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 6px;
  flex-shrink: 0;
}

.notification-content h5 {
  margin: 0 0 4px 0;
  color: #2c3e50;
  font-size: 14px;
  font-weight: 600;
}

.notification-content p {
  margin: 0 0 4px 0;
  color: #5d6d7e;
  font-size: 13px;
  line-height: 1.3;
}

.notification-content small {
  color: #95a5a6;
  font-size: 11px;
}

.unread-dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background: #e74c3c;
  border-radius: 50%;
}

.show-more-btn {
  width: 100%;
  padding: 10px;
  background: #f8f9fa;
  border: 1px solid #ecf0f1;
  border-radius: 6px;
  cursor: pointer;
  color: #7f8c8d;
  font-weight: 600;
  margin-top: 10px;
  transition: all 0.3s;
}

.show-more-btn:hover {
  background: #ecf0f1;
  color: #5d6d7e;
}

/* Analytics Overview */
.analytics-overview {
  background: white;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.analytics-overview h3 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 18px;
}

.analytics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.analytics-card {
  text-align: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 10px;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 5px;
}

.metric-label {
  font-size: 12px;
  color: #7f8c8d;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 5px;
}

.metric-trend {
  font-size: 16px;
}

.metric-period {
  font-size: 11px;
  color: #95a5a6;
  font-style: italic;
}

/* Profile Tab Content */
.profile-tab-content {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  border: 1px solid #e1e5e9;
}

.profile-mode-selector {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 10px;
  width: fit-content;
}

.profile-mode-selector button {
  padding: 10px 20px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  color: #7f8c8d;
  transition: all 0.3s;
}

.profile-mode-selector button.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

/* Analytics Tab Content */
.analytics-tab-content {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  border: 1px solid #e1e5e9;
}

.analytics-detailed h2 {
  margin: 0 0 30px 0;
  color: #2c3e50;
  font-size: 28px;
}

.analytics-sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
}

.analytics-section {
  padding: 25px;
  background: #f8f9fa;
  border-radius: 12px;
}

.analytics-section h3 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 20px;
}

.chart-placeholder {
  height: 200px;
  background: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #95a5a6;
  font-size: 16px;
  border: 2px dashed #ecf0f1;
}

/* Enhanced Loading State */
.loading-spinner {
  width: 60px;
  height: 60px;
  border: 6px solid rgba(102, 126, 234, 0.1);
  border-top: 6px solid #667eea;
  border-bottom: 6px solid #764ba2;
  border-radius: 50%;
  animation: modernSpin 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
  margin-bottom: 20px;
  position: relative;
}

.loading-spinner::before {
  content: '';
  position: absolute;
  top: -6px;
  left: -6px;
  right: -6px;
  bottom: -6px;
  border: 2px solid transparent;
  border-top: 2px solid rgba(118, 75, 162, 0.3);
  border-radius: 50%;
  animation: modernSpin 2s linear infinite reverse;
}

@keyframes modernSpin {
  0% { 
    transform: rotate(0deg) scale(1); 
    filter: hue-rotate(0deg);
  }
  50% { 
    transform: rotate(180deg) scale(1.1); 
    filter: hue-rotate(180deg);
  }
  100% { 
    transform: rotate(360deg) scale(1); 
    filter: hue-rotate(360deg);
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Compact Dashboard Cards */
.dashboard-card-compact {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
  position: relative;
}

.dashboard-card-compact:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  border-color: #667eea;
}

.compact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.compact-grid-small {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.stat-card-compact {
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  transition: all 0.3s ease;
}

.stat-card-compact:hover {
  background: #e9ecef;
  border-color: #667eea;
}

.stat-number-compact {
  font-size: 1.8rem;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 4px;
}

.stat-label-compact {
  font-size: 0.85rem;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Beautiful Button Styles */
.btn-compact {
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.btn-compact:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.btn-compact.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-compact.secondary {
  background: #f8f9fa;
  color: #495057;
  border: 1px solid #dee2e6;
}

.btn-compact.success {
  background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
  color: white;
}

.btn-compact.info {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .overview-cards {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
  
  .analytics-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .user-dashboard-container {
    padding: 10px;
  }
  
  .dashboard-header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }
  
  .dashboard-navigation {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .overview-cards {
    grid-template-columns: 1fr;
  }
  
  .actions-grid {
    grid-template-columns: 1fr;
  }
  
  .analytics-sections {
    grid-template-columns: 1fr;
  }
  
  .dashboard-main,
  .dashboard-sidebar {
    gap: 20px;
  }
  
  .progress-stages {
    flex-wrap: wrap;
    gap: 15px;
  }
  
  .progress-stages::before {
    display: none;
  }
}

@media (max-width: 480px) {
  .overview-card {
    flex-direction: column;
    text-align: center;
    padding: 20px;
  }
  
  .action-card {
    flex-direction: column;
    text-align: center;
  }
  
  .welcome-section h1 {
    font-size: 24px;
  }
  
  .dashboard-header {
    padding: 20px;
  }
  
  .quick-actions,
  .activity-feed,
  .profile-tab-content,
  .analytics-tab-content,
  .membership-status-card,
  .membership-status {
    padding: 20px;
  }
  
  .stage-icon {
    width: 50px;
    height: 50px;
    font-size: 24px;
  }
  
  .status-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
}