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

New API Endpoints Available users (continued):

GET /api/users/:user_id - Get specific user profile
GET /api/users/:user_id/activity - Get user's content activity
PUT /api/users/:user_id - Update specific user (admin)
DELETE /api/users/:user_id - Soft delete user (super admin)
GET /api/health - API health check
GET /api/docs - API documentation

Database Schema Compatibility:
Your existing users table structure is perfect for these optimizations:
sql-- Your current users table supports all new features:
- id (primary key)
- username, email, phone (profile fields)
- avatar (profile image)
- converse_id, mentor_id, class_id (relationship fields)
- is_member (membership status: applied, granted, denied, suspended)
- role (user, admin, super_admin, mentor, moderator)
- isblocked, isbanned (moderation fields)
- createdAt, updatedAt (timestamp tracking)
- resetToken, resetTokenExpiry, verificationCode, codeExpiry (auth fields)
Role Hierarchy & Permissions:

super_admin: Full access to all operations
admin: Can manage users but not create other admins
mentor: Limited access to assigned mentees
moderator: Content moderation capabilities
user: Basic profile access only



New Survey API Endpoints:

GET /api/survey/questions - Get survey questions (public)
POST /api/survey/submit - Submit survey (authenticated)
GET /api/survey/my-surveys - Get user's surveys
GET /api/survey/logs - Get all surveys (admin)
GET /api/survey/stats - Survey statistics (admin)
GET /api/survey/:id - Get specific survey
PUT /api/survey/approve - Approve/reject survey (admin)
PUT /api/survey/questions - Update questions (admin)


Key Features Added:
New API Endpoints:

GET /api/communication/templates - Get available templates
GET /api/communication/health - Service health check (admin)
GET /api/communication/stats - Communication statistics (admin)
POST /api/communication/email/send - Send single email
POST /api/communication/email/bulk - Send bulk emails (admin)
POST /api/communication/sms/send - Send single SMS
POST /api/communication/sms/bulk - Send bulk SMS (admin)
POST /api/communication/notification - Combined notifications

Template System:
javascript// Email templates available:
- welcome: New user welcome email
- surveyApproval: Survey approval/rejection
- contentNotification: Content status updates
- passwordReset: Password reset instructions
- adminNotification: Admin alerts

// SMS templates available:
- welcome: Welcome SMS
- surveyApproval: Survey status SMS
- verificationCode: OTP codes
- passwordReset: Password reset alert
- contentNotification: Content updates
- adminAlert: Admin alerts
- maintenance: Maintenance notifications 



New API Endpoints:

GET /api/comments/stats - Comment statistics (admin)
GET /api/comments/:commentId - Get specific comment
PUT /api/comments/:commentId - Update comment
DELETE /api/comments/:commentId - Delete comment 

Authorization Matrix:

Users: Can create, view, update, delete their own comments
Admins: Can view all comments, statistics, and moderate content
Super Admins: Full access to all comment operations




MySQL [ikoota_db]> show tables;
+--------------------------------+
| Tables_in_ikoota_db            |
+--------------------------------+
| admin_membership_overview      |
| all_applications_status        |
| audit_logs                     |
| bulk_email_logs                |
| bulk_sms_logs                  |
| chats                          |
| class_content_access           |
| class_member_counts            |
| classes                        |
| comments                       |
| converse_relationships         |
| email_logs                     |
| email_templates                |
| full_membership_access         |
| full_membership_access_log     |
| full_membership_applications   |
| id_generation_log              |
| identity_masking_audit         |
| membership_review_history      |
| membership_stats               |
| pending_applications_overview  |
| pending_full_memberships       |
| pending_initial_applications   |
| reports                        |
| sms_logs                       |
| sms_templates                  |
| survey_questions               |
| surveylog                      |
| teachings                      |
| user_chats                     |
| user_class_details             |
| user_class_memberships         |
| user_communication_preferences |
| user_profiles                  |
| users                          |
| verification_codes             |
+--------------------------------+
36 rows in set (0.054 sec)

MySQL [ikoota_db]> SELECT
    ->     CONCAT('DESCRIBE ', TABLE_NAME, ';') as describe_commands
    -> FROM INFORMATION_SCHEMA.TABLES
    -> WHERE TABLE_SCHEMA = 'ikoota_db'
    ->     AND TABLE_TYPE = 'BASE TABLE'
    -> ORDER BY TABLE_NAME;
+------------------------------------------+
| describe_commands                        |
+------------------------------------------+
| DESCRIBE audit_logs;                     |
| DESCRIBE bulk_email_logs;                |
| DESCRIBE bulk_sms_logs;                  |
| DESCRIBE chats;                          |
| DESCRIBE class_content_access;           |
| DESCRIBE classes;                        |
| DESCRIBE comments;                       |
| DESCRIBE converse_relationships;         |
| DESCRIBE email_logs;                     |
| DESCRIBE email_templates;                |
| DESCRIBE full_membership_access;         |
| DESCRIBE full_membership_access_log;     |
| DESCRIBE full_membership_applications;   |
| DESCRIBE id_generation_log;              |
| DESCRIBE identity_masking_audit;         |
| DESCRIBE membership_review_history;      |
| DESCRIBE reports;                        |
| DESCRIBE sms_logs;                       |
| DESCRIBE sms_templates;                  |
| DESCRIBE survey_questions;               |
| DESCRIBE surveylog;                      |
| DESCRIBE teachings;                      |
| DESCRIBE user_chats;                     |
| DESCRIBE user_class_memberships;         |
| DESCRIBE user_communication_preferences; |
| DESCRIBE user_profiles;                  |
| DESCRIBE users;                          |
| DESCRIBE verification_codes;             |
+------------------------------------------+
28 rows in set (0.075 sec)

MySQL [ikoota_db]> DESCRIBE users;
+-----------------------------+---------------------------------------------------------------------------------------------+------+-----+-------------------+-------------------+
| Field                       | Type                                                                                        | Null | Key | Default           | Extra             |
+-----------------------------+---------------------------------------------------------------------------------------------+------+-----+-------------------+-------------------+
| id                          | int                                                                                         | NO   | PRI | NULL              | auto_increment    |
| username                    | varchar(255)                                                                                | NO   |     | NULL              |                   |
| email                       | varchar(255)                                                                                | NO   |     | NULL              |                   |
| phone                       | varchar(15)                                                                                 | YES  |     | NULL              |                   |
| avatar                      | varchar(255)                                                                                | YES  |     | NULL              |                   |
| password_hash               | varchar(255)                                                                                | NO   |     | NULL              |                   |
| converse_id                 | varchar(12)                                                                                 | YES  | UNI | NULL              |                   |
| application_ticket          | varchar(20)                                                                                 | YES  | MUL | NULL              |                   |
| mentor_id                   | char(10)                                                                                    | YES  | MUL | NULL              |                   |
| primary_class_id            | varchar(12)                                                                                 | YES  | MUL | NULL              |                   |
| is_member                   | enum('applied','pending','suspended','granted','declined','pre_member','member','rejected') | YES  |     | applied           |                   |
| membership_stage            | enum('none','applicant','pre_member','member')                                              | YES  | MUL | none              |                   |
| full_membership_ticket      | varchar(25)                                                                                 | YES  |     | NULL              |                   |
| full_membership_status      | enum('not_applied','applied','pending','suspended','approved','declined')                   | YES  | MUL | not_applied       |                   |
| full_membership_applied_at  | timestamp                                                                                   | YES  | MUL | NULL              |                   |
| full_membership_reviewed_at | timestamp                                                                                   | YES  |     | NULL              |                   |
| role                        | enum('super_admin','admin','user')                                                          | YES  |     | user              |                   |
| isblocked                   | json                                                                                        | YES  |     | NULL              |                   |
| isbanned                    | tinyint(1)                                                                                  | YES  |     | 0                 |                   |
| createdAt                   | timestamp                                                                                   | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updatedAt                   | timestamp                                                                                   | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| resetToken                  | varchar(255)                                                                                | YES  |     | NULL              |                   |
| resetTokenExpiry            | bigint                                                                                      | YES  |     | NULL              |                   |
| verification_method         | enum('email','phone')                                                                       | YES  |     | NULL              |                   |
| verification_code           | varchar(10)                                                                                 | YES  |     | NULL              |                   |
| is_verified                 | tinyint(1)                                                                                  | YES  | MUL | 0                 |                   |
| codeExpiry                  | bigint                                                                                      | YES  |     | NULL              |                   |
| converse_avatar             | varchar(255)                                                                                | YES  |     | NULL              |                   |
| is_identity_masked          | tinyint(1)                                                                                  | YES  |     | 0                 |                   |
| total_classes               | int                                                                                         | YES  |     | 0                 |                   |
+-----------------------------+---------------------------------------------------------------------------------------------+------+-----+-------------------+-------------------+
30 rows in set (0.080 sec)

MySQL [ikoota_db]> DESCRIBE surveylog;
+------------------+---------------------------------------------------------------------------+------+-----+---------------------+-----------------------------------------------+
| Field            | Type                                                                      | Null | Key | Default             | Extra                                         |
+------------------+---------------------------------------------------------------------------+------+-----+---------------------+-----------------------------------------------+
| id               | int                                                                       | NO   | PRI | NULL                | auto_increment                                |
| user_id          | char(10)                                                                  | NO   | MUL | NULL                |                                               |
| answers          | text                                                                      | YES  |     | NULL                |                                               |
| verified_by      | char(10)                                                                  | NO   | MUL | NULL                |                                               |
| rating_remarks   | varchar(255)                                                              | NO   |     | NULL                |                                               |
| approval_status  | enum('pending','approved','rejected','under_review','granted','declined') | YES  | MUL | pending             |                                               |
| createdAt        | timestamp                                                                 | YES  |     | CURRENT_TIMESTAMP   | DEFAULT_GENERATED                             |
| updatedAt        | timestamp                                                                 | YES  |     | CURRENT_TIMESTAMP   | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| processedAt      | timestamp                                                                 | YES  |     | CURRENT_TIMESTAMP   | DEFAULT_GENERATED                             |
| admin_notes      | text                                                                      | YES  |     | NULL                |                                               |
| application_type | enum('initial_application','full_membership')                             | YES  | MUL | initial_application |                                               |
| reviewed_at      | timestamp                                                                 | YES  | MUL | NULL                |                                               |
| reviewed_by      | int                                                                       | YES  | MUL | NULL                |                                               |
+------------------+---------------------------------------------------------------------------+------+-----+---------------------+-----------------------------------------------+
13 rows in set (0.049 sec)

MySQL [ikoota_db]> DESCRIBE full_membership_applications;
+-------------------+---------------------------------------------------+------+-----+-------------------+-------------------+
| Field             | Type                                              | Null | Key | Default           | Extra             |
+-------------------+---------------------------------------------------+------+-----+-------------------+-------------------+
| id                | int                                               | NO   | PRI | NULL              | auto_increment    |
| user_id           | int                                               | NO   | UNI | NULL              |                   |
| membership_ticket | varchar(25)                                       | NO   | MUL | NULL              |                   |
| answers           | json                                              | NO   |     | NULL              |                   |
| status            | enum('pending','suspended','approved','declined') | YES  | MUL | pending           |                   |
| submitted_at      | timestamp                                         | YES  | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| reviewed_at       | timestamp                                         | YES  |     | NULL              |                   |
| reviewed_by       | int                                               | YES  | MUL | NULL              |                   |
| admin_notes       | text                                              | YES  |     | NULL              |                   |
+-------------------+---------------------------------------------------+------+-----+-------------------+-------------------+
9 rows in set (0.060 sec)

MySQL [ikoota_db]> DESCRIBE full_membership_access;
+-------------------+-----------+------+-----+-------------------+-----------------------------------------------+
| Field             | Type      | Null | Key | Default           | Extra                                         |
+-------------------+-----------+------+-----+-------------------+-----------------------------------------------+
| id                | int       | NO   | PRI | NULL              | auto_increment                                |
| user_id           | int       | NO   | UNI | NULL              |                                               |
| first_accessed_at | timestamp | YES  | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| last_accessed_at  | timestamp | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| access_count      | int       | YES  |     | 1                 |                                               |
+-------------------+-----------+------+-----+-------------------+-----------------------------------------------+
5 rows in set (0.052 sec)

MySQL [ikoota_db]> DESCRIBE full_membership_access_log;
+-----------------+-------------+------+-----+-------------------+-----------------------------------------------+
| Field           | Type        | Null | Key | Default           | Extra                                         |
+-----------------+-------------+------+-----+-------------------+-----------------------------------------------+
| id              | int         | NO   | PRI | NULL              | auto_increment                                |
| user_id         | int         | NO   | UNI | NULL              |                                               |
| first_access_at | timestamp   | YES  | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| total_accesses  | int         | YES  |     | 1                 |                                               |
| last_access_at  | timestamp   | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| ip_address      | varchar(45) | YES  |     | NULL              |                                               |
| user_agent      | text        | YES  |     | NULL              |                                               |
+-----------------+-------------+------+-----+-------------------+-----------------------------------------------+
7 rows in set (0.079 sec)

MySQL [ikoota_db]> DESCRIBE membership_review_history;
+-------------------+-------------------------------------------------------------+------+-----+-------------------+-------------------+
| Field             | Type                                                        | Null | Key | Default           | Extra             |
+-------------------+-------------------------------------------------------------+------+-----+-------------------+-------------------+
| id                | int                                                         | NO   | PRI | NULL              | auto_increment    |
| user_id           | int                                                         | NO   | MUL | NULL              |                   |
| application_type  | enum('initial_application','full_membership')               | NO   | MUL | NULL              |                   |
| application_id    | int                                                         | YES  |     | NULL              |                   |
| reviewer_id       | int                                                         | YES  | MUL | NULL              |                   |
| previous_status   | enum('pending','suspended','approved','declined')           | YES  |     | NULL              |                   |
| new_status        | enum('pending','suspended','approved','declined')           | YES  |     | NULL              |                   |
| review_notes      | text                                                        | YES  |     | NULL              |                   |
| action_taken      | enum('approve','decline','suspend','request_info','reopen') | NO   |     | NULL              |                   |
| reviewed_at       | timestamp                                                   | YES  | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| notification_sent | tinyint(1)                                                  | YES  |     | 0                 |                   |
+-------------------+-------------------------------------------------------------+------+-----+-------------------+-------------------+
11 rows in set (0.059 sec)

MySQL [ikoota_db]> DESCRIBE verification_codes;
+-----------+-----------------------+------+-----+-------------------+-------------------+
| Field     | Type                  | Null | Key | Default           | Extra             |
+-----------+-----------------------+------+-----+-------------------+-------------------+
| id        | int                   | NO   | PRI | NULL              | auto_increment    |
| email     | varchar(255)          | NO   | MUL | NULL              |                   |
| phone     | varchar(15)           | YES  |     | NULL              |                   |
| code      | varchar(10)           | NO   |     | NULL              |                   |
| method    | enum('email','phone') | NO   |     | NULL              |                   |
| expiresAt | timestamp             | NO   | MUL | NULL              |                   |
| createdAt | timestamp             | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+-----------+-----------------------+------+-----+-------------------+-------------------+
7 rows in set (0.061 sec)

MySQL [ikoota_db]>
MySQL [ikoota_db]> -- Admin and communication tables
MySQL [ikoota_db]> DESCRIBE email_templates;
+------------+--------------+------+-----+-------------------+-----------------------------------------------+
| Field      | Type         | Null | Key | Default           | Extra                                         |
+------------+--------------+------+-----+-------------------+-----------------------------------------------+
| id         | int          | NO   | PRI | NULL              | auto_increment                                |
| name       | varchar(100) | NO   | UNI | NULL              |                                               |
| subject    | varchar(500) | NO   |     | NULL              |                                               |
| body_text  | text         | YES  |     | NULL              |                                               |
| body_html  | text         | YES  |     | NULL              |                                               |
| variables  | json         | YES  |     | NULL              |                                               |
| is_active  | tinyint(1)   | YES  | MUL | 1                 |                                               |
| created_by | char(10)     | YES  | MUL | NULL              |                                               |
| createdAt  | timestamp    | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt  | timestamp    | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
+------------+--------------+------+-----+-------------------+-----------------------------------------------+
10 rows in set (0.045 sec)

MySQL [ikoota_db]> DESCRIBE email_logs;
+---------------+---------------------------------+------+-----+-------------------+-----------------------------------------------+
| Field         | Type                            | Null | Key | Default           | Extra                                         |
+---------------+---------------------------------+------+-----+-------------------+-----------------------------------------------+
| id            | int                             | NO   | PRI | NULL              | auto_increment                                |
| recipient     | varchar(255)                    | NO   | MUL | NULL              |                                               |
| subject       | varchar(500)                    | YES  |     | NULL              |                                               |
| template      | varchar(100)                    | YES  | MUL | NULL              |                                               |
| status        | enum('sent','failed','pending') | YES  | MUL | pending           |                                               |
| message_id    | varchar(255)                    | YES  |     | NULL              |                                               |
| error_message | text                            | YES  |     | NULL              |                                               |
| sender_id     | char(10)                        | YES  | MUL | NULL              |                                               |
| createdAt     | timestamp                       | YES  | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt     | timestamp                       | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| processedAt   | timestamp                       | YES  |     | NULL              |                                               |
+---------------+---------------------------------+------+-----+-------------------+-----------------------------------------------+
11 rows in set (0.050 sec)

MySQL [ikoota_db]> DESCRIBE sms_templates;
+------------+--------------+------+-----+-------------------+-----------------------------------------------+
| Field      | Type         | Null | Key | Default           | Extra                                         |
+------------+--------------+------+-----+-------------------+-----------------------------------------------+
| id         | int          | NO   | PRI | NULL              | auto_increment                                |
| name       | varchar(100) | NO   | UNI | NULL              |                                               |
| message    | text         | NO   |     | NULL              |                                               |
| variables  | json         | YES  |     | NULL              |                                               |
| is_active  | tinyint(1)   | YES  | MUL | 1                 |                                               |
| created_by | char(10)     | YES  | MUL | NULL              |                                               |
| createdAt  | timestamp    | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt  | timestamp    | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
+------------+--------------+------+-----+-------------------+-----------------------------------------------+
8 rows in set (0.062 sec)

MySQL [ikoota_db]> DESCRIBE sms_logs;
+---------------+---------------------------------+------+-----+-------------------+-----------------------------------------------+
| Field         | Type                            | Null | Key | Default           | Extra                                         |
+---------------+---------------------------------+------+-----+-------------------+-----------------------------------------------+
| id            | int                             | NO   | PRI | NULL              | auto_increment                                |
| recipient     | varchar(20)                     | NO   | MUL | NULL              |                                               |
| message       | text                            | YES  |     | NULL              |                                               |
| template      | varchar(100)                    | YES  | MUL | NULL              |                                               |
| status        | enum('sent','failed','pending') | YES  | MUL | pending           |                                               |
| sid           | varchar(100)                    | YES  |     | NULL              |                                               |
| error_message | text                            | YES  |     | NULL              |                                               |
| sender_id     | char(10)                        | YES  | MUL | NULL              |                                               |
| createdAt     | timestamp                       | YES  | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt     | timestamp                       | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| processedAt   | timestamp                       | YES  |     | NULL              |                                               |
+---------------+---------------------------------+------+-----+-------------------+-----------------------------------------------+
11 rows in set (0.046 sec)

MySQL [ikoota_db]> DESCRIBE bulk_email_logs;
+------------------+--------------+------+-----+-------------------+-----------------------------------------------+
| Field            | Type         | Null | Key | Default           | Extra                                         |
+------------------+--------------+------+-----+-------------------+-----------------------------------------------+
| id               | int          | NO   | PRI | NULL              | auto_increment                                |
| recipients_count | int          | NO   |     | NULL              |                                               |
| subject          | varchar(500) | YES  |     | NULL              |                                               |
| template         | varchar(100) | YES  | MUL | NULL              |                                               |
| successful_count | int          | YES  |     | 0                 |                                               |
| failed_count     | int          | YES  |     | 0                 |                                               |
| sender_id        | char(10)     | YES  | MUL | NULL              |                                               |
| createdAt        | timestamp    | YES  | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt        | timestamp    | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| processedAt      | timestamp    | YES  |     | NULL              |                                               |
+------------------+--------------+------+-----+-------------------+-----------------------------------------------+
10 rows in set (0.043 sec)

MySQL [ikoota_db]> DESCRIBE bulk_sms_logs;
+------------------+--------------+------+-----+-------------------+-----------------------------------------------+
| Field            | Type         | Null | Key | Default           | Extra                                         |
+------------------+--------------+------+-----+-------------------+-----------------------------------------------+
| id               | int          | NO   | PRI | NULL              | auto_increment                                |
| recipients_count | int          | NO   |     | NULL              |                                               |
| message          | text         | YES  |     | NULL              |                                               |
| template         | varchar(100) | YES  | MUL | NULL              |                                               |
| successful_count | int          | YES  |     | 0                 |                                               |
| failed_count     | int          | YES  |     | 0                 |                                               |
| sender_id        | char(10)     | YES  | MUL | NULL              |                                               |
| createdAt        | timestamp    | YES  | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt        | timestamp    | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| processedAt      | timestamp    | YES  |     | NULL              |                                               |
+------------------+--------------+------+-----+-------------------+-----------------------------------------------+
10 rows in set (0.043 sec)

MySQL [ikoota_db]>
MySQL [ikoota_db]> -- Class and content tables
MySQL [ikoota_db]> DESCRIBE classes;
+---------------+--------------------------------------------------+------+-----+-------------------+-------------------+
| Field         | Type                                             | Null | Key | Default           | Extra             |
+---------------+--------------------------------------------------+------+-----+-------------------+-------------------+
| id            | int                                              | NO   | PRI | NULL              | auto_increment    |
| class_id      | varchar(12)                                      | NO   | UNI | NULL              |                   |
| class_name    | varchar(255)                                     | NO   |     | NULL              |                   |
| public_name   | varchar(255)                                     | YES  |     | NULL              |                   |
| description   | text                                             | YES  |     | NULL              |                   |
| class_type    | enum('demographic','subject','public','special') | YES  | MUL | demographic       |                   |
| is_public     | tinyint(1)                                       | YES  | MUL | 0                 |                   |
| max_members   | int                                              | YES  |     | 50                |                   |
| privacy_level | enum('public','members_only','admin_only')       | YES  |     | members_only      |                   |
| created_by    | int                                              | YES  | MUL | NULL              |                   |
| is_active     | tinyint(1)                                       | YES  | MUL | 1                 |                   |
| createdAt     | timestamp                                        | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updatedAt     | timestamp                                        | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+---------------+--------------------------------------------------+------+-----+-------------------+-------------------+
13 rows in set (0.058 sec)

MySQL [ikoota_db]> DESCRIBE teachings;
+---------------+--------------------------------------+------+-----+-------------------+-----------------------------------------------+
| Field         | Type                                 | Null | Key | Default           | Extra                                         |
+---------------+--------------------------------------+------+-----+-------------------+-----------------------------------------------+
| id            | int                                  | NO   | PRI | NULL              | auto_increment                                |
| topic         | varchar(255)                         | NO   |     | NULL              |                                               |
| description   | text                                 | YES  |     | NULL              |                                               |
| lessonNumber  | varchar(255)                         | NO   |     | NULL              |                                               |
| subjectMatter | varchar(255)                         | YES  |     | NULL              |                                               |
| audience      | varchar(255)                         | YES  |     | NULL              |                                               |
| content       | text                                 | YES  |     | NULL              |                                               |
| media_url1    | varchar(255)                         | YES  |     | NULL              |                                               |
| media_type1   | enum('image','video','audio','file') | YES  |     | NULL              |                                               |
| media_url2    | varchar(255)                         | YES  |     | NULL              |                                               |
| media_type2   | enum('image','video','audio','file') | YES  |     | NULL              |                                               |
| media_url3    | varchar(255)                         | YES  |     | NULL              |                                               |
| media_type3   | enum('image','video','audio','file') | YES  |     | NULL              |                                               |
| createdAt     | timestamp                            | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt     | timestamp                            | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| user_id       | char(10)                             | NO   | MUL | NULL              |                                               |
| prefixed_id   | varchar(20)                          | YES  | UNI | NULL              |                                               |
+---------------+--------------------------------------+------+-----+-------------------+-----------------------------------------------+
17 rows in set (0.048 sec)

MySQL [ikoota_db]> DESCRIBE class_content_access;
+--------------+----------------------------------------+------+-----+-------------------+-------------------+
| Field        | Type                                   | Null | Key | Default           | Extra             |
+--------------+----------------------------------------+------+-----+-------------------+-------------------+
| id           | int                                    | NO   | PRI | NULL              | auto_increment    |
| content_id   | int                                    | NO   | MUL | NULL              |                   |
| content_type | enum('chat','teaching','announcement') | NO   |     | NULL              |                   |
| class_id     | varchar(12)                            | NO   | MUL | NULL              |                   |
| access_level | enum('read','comment','contribute')    | YES  |     | read              |                   |
| createdAt    | timestamp                              | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+--------------+----------------------------------------+------+-----+-------------------+-------------------+
6 rows in set (0.042 sec)

MySQL [ikoota_db]> DESCRIBE class_member_counts;
+-----------------+--------------------------------------------------+------+-----+-------------+-------+
| Field           | Type                                             | Null | Key | Default     | Extra |
+-----------------+--------------------------------------------------+------+-----+-------------+-------+
| class_id        | varchar(12)                                      | NO   |     | NULL        |       |
| class_name      | varchar(255)                                     | NO   |     | NULL        |       |
| class_type      | enum('demographic','subject','public','special') | YES  |     | demographic |       |
| is_public       | tinyint(1)                                       | YES  |     | 0           |       |
| total_members   | bigint                                           | NO   |     | 0           |       |
| moderators      | bigint                                           | NO   |     | 0           |       |
| pending_members | bigint                                           | NO   |     | 0           |       |
+-----------------+--------------------------------------------------+------+-----+-------------+-------+
7 rows in set (0.045 sec)

MySQL [ikoota_db]> DESCRIBE user_class_details;
+--------------------+--------------------------------------------------+------+-----+-------------------+-------------------+
| Field              | Type                                             | Null | Key | Default           | Extra             |
+--------------------+--------------------------------------------------+------+-----+-------------------+-------------------+
| user_id            | int                                              | NO   |     | NULL              |                   |
| username           | varchar(255)                                     | NO   |     | NULL              |                   |
| converse_id        | varchar(12)                                      | YES  |     | NULL              |                   |
| class_id           | varchar(12)                                      | NO   |     | NULL              |                   |
| class_name         | varchar(255)                                     | NO   |     | NULL              |                   |
| public_name        | varchar(255)                                     | YES  |     | NULL              |                   |
| class_type         | enum('demographic','subject','public','special') | YES  |     | demographic       |                   |
| is_public          | tinyint(1)                                       | YES  |     | 0                 |                   |
| membership_status  | enum('active','pending','suspended','expired')   | YES  |     | active            |                   |
| role_in_class      | enum('member','moderator','assistant')           | YES  |     | member            |                   |
| can_see_class_name | tinyint(1)                                       | YES  |     | 1                 |                   |
| joined_at          | timestamp                                        | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+--------------------+--------------------------------------------------+------+-----+-------------------+-------------------+
12 rows in set (0.042 sec)

MySQL [ikoota_db]> DESCRIBE user_class_memberships;
+-----------------------+------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| Field                 | Type                                           | Null | Key | Default           | Extra                                         |
+-----------------------+------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| id                    | int                                            | NO   | PRI | NULL              | auto_increment                                |
| user_id               | int                                            | NO   | MUL | NULL              |                                               |
| class_id              | varchar(12)                                    | NO   | MUL | NULL              |                                               |
| membership_status     | enum('active','pending','suspended','expired') | YES  | MUL | active            |                                               |
| role_in_class         | enum('member','moderator','assistant')         | YES  |     | member            |                                               |
| joined_at             | timestamp                                      | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| assigned_by           | int                                            | YES  | MUL | NULL              |                                               |
| expires_at            | timestamp                                      | YES  |     | NULL              |                                               |
| can_see_class_name    | tinyint(1)                                     | YES  |     | 1                 |                                               |
| receive_notifications | tinyint(1)                                     | YES  |     | 1                 |                                               |
| createdAt             | timestamp                                      | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt             | timestamp                                      | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
+-----------------------+------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
12 rows in set (0.068 sec)

MySQL [ikoota_db]>
MySQL [ikoota_db]> -- Chat and social features
MySQL [ikoota_db]> DESCRIBE chats;
+-----------------+---------------------------------------+------+-----+-------------------+-------------------+
| Field           | Type                                  | Null | Key | Default           | Extra             |
+-----------------+---------------------------------------+------+-----+-------------------+-------------------+
| id              | int                                   | NO   | PRI | NULL              | auto_increment    |
| title           | varchar(255)                          | NO   |     | NULL              |                   |
| user_id         | char(10)                              | NO   | MUL | NULL              |                   |
| audience        | varchar(255)                          | YES  |     | NULL              |                   |
| summary         | text                                  | YES  |     | NULL              |                   |
| text            | text                                  | YES  |     | NULL              |                   |
| approval_status | enum('pending','approved','rejected') | YES  |     | pending           |                   |
| media_url1      | varchar(255)                          | YES  |     | NULL              |                   |
| media_type1     | enum('image','video','audio','file')  | YES  |     | NULL              |                   |
| media_url2      | varchar(255)                          | YES  |     | NULL              |                   |
| media_type2     | enum('image','video','audio','file')  | YES  |     | NULL              |                   |
| media_url3      | varchar(255)                          | YES  |     | NULL              |                   |
| is_flagged      | tinyint(1)                            | YES  |     | 0                 |                   |
| media_type3     | enum('image','video','audio','file')  | YES  |     | NULL              |                   |
| createdAt       | timestamp                             | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updatedAt       | timestamp                             | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| prefixed_id     | varchar(20)                           | YES  | UNI | NULL              |                   |
+-----------------+---------------------------------------+------+-----+-------------------+-------------------+
17 rows in set (0.059 sec)

MySQL [ikoota_db]> DESCRIBE user_chats;
+----------------------+--------------------------------+------+-----+-------------------+-------------------+
| Field                | Type                           | Null | Key | Default           | Extra             |
+----------------------+--------------------------------+------+-----+-------------------+-------------------+
| id                   | int                            | NO   | PRI | NULL              | auto_increment    |
| user_id              | char(10)                       | NO   | MUL | NULL              |                   |
| chat_id              | char(10)                       | NO   |     | NULL              |                   |
| last_message         | varchar(255)                   | YES  |     | NULL              |                   |
| is_seen              | tinyint(1)                     | YES  |     | 0                 |                   |
| role                 | enum('admin','member','owner') | NO   |     | NULL              |                   |
| is_muted             | tinyint(1)                     | YES  |     | 0                 |                   |
| last_read_message_id | varchar(36)                    | YES  |     | NULL              |                   |
| joined_at            | datetime                       | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updatedAt            | timestamp                      | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+----------------------+--------------------------------+------+-----+-------------------+-------------------+
10 rows in set (0.058 sec)

MySQL [ikoota_db]> DESCRIBE comments;
+-------------+--------------------------------------+------+-----+-------------------+-------------------+
| Field       | Type                                 | Null | Key | Default           | Extra             |
+-------------+--------------------------------------+------+-----+-------------------+-------------------+
| id          | int                                  | NO   | PRI | NULL              | auto_increment    |
| user_id     | char(10)                             | NO   | MUL | NULL              |                   |
| chat_id     | int                                  | YES  | MUL | NULL              |                   |
| teaching_id | int                                  | YES  | MUL | NULL              |                   |
| comment     | text                                 | NO   |     | NULL              |                   |
| media_url1  | varchar(255)                         | YES  |     | NULL              |                   |
| media_type1 | enum('image','video','audio','file') | YES  |     | NULL              |                   |
| media_url2  | varchar(255)                         | YES  |     | NULL              |                   |
| media_type2 | enum('image','video','audio','file') | YES  |     | NULL              |                   |
| media_url3  | varchar(255)                         | YES  |     | NULL              |                   |
| media_type3 | enum('image','video','audio','file') | YES  |     | NULL              |                   |
| createdAt   | timestamp                            | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updatedAt   | timestamp                            | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+-------------+--------------------------------------+------+-----+-------------------+-------------------+
13 rows in set (0.054 sec)

MySQL [ikoota_db]> DESCRIBE converse_relationships;
+--------------------+-------------------------------+------+-----+-------------------+-------------------+
| Field              | Type                          | Null | Key | Default           | Extra             |
+--------------------+-------------------------------+------+-----+-------------------+-------------------+
| id                 | int                           | NO   | PRI | NULL              | auto_increment    |
| mentor_converse_id | varchar(12)                   | YES  | MUL | NULL              |                   |
| mentee_converse_id | varchar(12)                   | YES  | MUL | NULL              |                   |
| relationship_type  | enum('mentor','peer','admin') | YES  |     | mentor            |                   |
| created_at         | timestamp                     | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| is_active          | tinyint(1)                    | YES  |     | 1                 |                   |
+--------------------+-------------------------------+------+-----+-------------------+-------------------+
6 rows in set (0.057 sec)

MySQL [ikoota_db]>
MySQL [ikoota_db]> -- User management tables
MySQL [ikoota_db]> DESCRIBE user_profiles;
+--------------------+--------------+------+-----+-------------------+-------------------+
| Field              | Type         | Null | Key | Default           | Extra             |
+--------------------+--------------+------+-----+-------------------+-------------------+
| id                 | int          | NO   | PRI | NULL              | auto_increment    |
| user_id            | int          | NO   | UNI | NULL              |                   |
| encrypted_username | text         | NO   |     | NULL              |                   |
| encrypted_email    | text         | NO   |     | NULL              |                   |
| encrypted_phone    | text         | YES  |     | NULL              |                   |
| encryption_key     | varchar(255) | YES  |     | NULL              |                   |
| createdAt          | timestamp    | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updatedAt          | timestamp    | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+--------------------+--------------+------+-----+-------------------+-------------------+
8 rows in set (0.046 sec)

MySQL [ikoota_db]> DESCRIBE user_communication_preferences;
+-----------------------+-------------+------+-----+-------------------+-----------------------------------------------+
| Field                 | Type        | Null | Key | Default           | Extra                                         |
+-----------------------+-------------+------+-----+-------------------+-----------------------------------------------+
| id                    | int         | NO   | PRI | NULL              | auto_increment                                |
| user_id               | int         | NO   | UNI | NULL              |                                               |
| email_notifications   | tinyint(1)  | YES  |     | 1                 |                                               |
| sms_notifications     | tinyint(1)  | YES  |     | 0                 |                                               |
| marketing_emails      | tinyint(1)  | YES  |     | 1                 |                                               |
| marketing_sms         | tinyint(1)  | YES  |     | 0                 |                                               |
| survey_notifications  | tinyint(1)  | YES  |     | 1                 |                                               |
| content_notifications | tinyint(1)  | YES  |     | 1                 |                                               |
| admin_notifications   | tinyint(1)  | YES  |     | 1                 |                                               |
| preferred_language    | varchar(10) | YES  |     | en                |                                               |
| timezone              | varchar(50) | YES  |     | UTC               |                                               |
| createdAt             | timestamp   | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt             | timestamp   | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| converse_id           | char(10)    | YES  | MUL | NULL              |                                               |
+-----------------------+-------------+------+-----+-------------------+-----------------------------------------------+
14 rows in set (0.057 sec)

MySQL [ikoota_db]> DESCRIBE identity_masking_audit;
+--------------------+--------------+------+-----+-------------------+-------------------+
| Field              | Type         | Null | Key | Default           | Extra             |
+--------------------+--------------+------+-----+-------------------+-------------------+
| id                 | int          | NO   | PRI | NULL              | auto_increment    |
| user_id            | int          | NO   | MUL | NULL              |                   |
| converse_id        | varchar(12)  | YES  | MUL | NULL              |                   |
| masked_by_admin_id | varchar(12)  | YES  | MUL | NULL              |                   |
| original_username  | varchar(255) | YES  |     | NULL              |                   |
| createdAt          | timestamp    | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| reason             | text         | YES  |     | NULL              |                   |
+--------------------+--------------+------+-----+-------------------+-------------------+
7 rows in set (0.043 sec)

MySQL [ikoota_db]>
MySQL [ikoota_db]> -- System and audit tables
MySQL [ikoota_db]> DESCRIBE audit_logs;
+-----------+--------------+------+-----+-------------------+-------------------+
| Field     | Type         | Null | Key | Default           | Extra             |
+-----------+--------------+------+-----+-------------------+-------------------+
| id        | int          | NO   | PRI | NULL              | auto_increment    |
| admin_id  | char(10)     | NO   | MUL | NULL              |                   |
| action    | varchar(255) | NO   |     | NULL              |                   |
| target_id | char(10)     | YES  | MUL | NULL              |                   |
| details   | text         | YES  |     | NULL              |                   |
| createdAt | timestamp    | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+-----------+--------------+------+-----+-------------------+-------------------+
6 rows in set (0.047 sec)

MySQL [ikoota_db]> DESCRIBE reports;
+-------------+---------------------------------------+------+-----+-------------------+-------------------+
| Field       | Type                                  | Null | Key | Default           | Extra             |
+-------------+---------------------------------------+------+-----+-------------------+-------------------+
| id          | int                                   | NO   | PRI | NULL              | auto_increment    |
| reporter_id | char(10)                              | NO   | MUL | NULL              |                   |
| reported_id | char(10)                              | YES  | MUL | NULL              |                   |
| reason      | text                                  | NO   |     | NULL              |                   |
| status      | enum('pending','reviewed','resolved') | YES  |     | pending           |                   |
| createdAt   | timestamp                             | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+-------------+---------------------------------------+------+-----+-------------------+-------------------+
6 rows in set (0.050 sec)

MySQL [ikoota_db]> DESCRIBE survey_questions;
+----------------+------------+------+-----+-------------------+-----------------------------------------------+
| Field          | Type       | Null | Key | Default           | Extra                                         |
+----------------+------------+------+-----+-------------------+-----------------------------------------------+
| id             | int        | NO   | PRI | NULL              | auto_increment                                |
| question       | text       | NO   |     | NULL              |                                               |
| createdAt      | timestamp  | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updatedAt      | timestamp  | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| is_active      | tinyint(1) | YES  |     | 1                 |                                               |
| question_order | int        | YES  |     | 0                 |                                               |
+----------------+------------+------+-----+-------------------+-----------------------------------------------+
6 rows in set (0.047 sec)

MySQL [ikoota_db]> DESCRIBE id_generation_log;
+--------------+----------------------+------+-----+-------------------+-------------------+
| Field        | Type                 | Null | Key | Default           | Extra             |
+--------------+----------------------+------+-----+-------------------+-------------------+
| id           | int                  | NO   | PRI | NULL              | auto_increment    |
| generated_id | char(10)             | NO   | MUL | NULL              |                   |
| id_type      | enum('user','class') | NO   | MUL | NULL              |                   |
| generated_by | char(10)             | YES  | MUL | NULL              |                   |
| generated_at | timestamp            | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| purpose      | varchar(100)         | YES  |     | NULL              |                   |
+--------------+----------------------+------+-----+-------------------+-------------------+
6 rows in set (0.052 sec)

MySQL [ikoota_db]> SELECT
    ->     TABLE_NAME,
    ->     TABLE_TYPE,
    ->     ENGINE,
    ->     TABLE_ROWS,
    ->     DATA_LENGTH,
    ->     INDEX_LENGTH
    -> FROM INFORMATION_SCHEMA.TABLES
    -> WHERE TABLE_SCHEMA = 'ikoota_db'
    -> ORDER BY TABLE_NAME;
+--------------------------------+------------+--------+------------+-------------+--------------+
| TABLE_NAME                     | TABLE_TYPE | ENGINE | TABLE_ROWS | DATA_LENGTH | INDEX_LENGTH |
+--------------------------------+------------+--------+------------+-------------+--------------+
| admin_membership_overview      | VIEW       | NULL   |       NULL |        NULL |         NULL |
| all_applications_status        | VIEW       | NULL   |       NULL |        NULL |         NULL |
| audit_logs                     | BASE TABLE | InnoDB |          0 |       16384 |        32768 |
| bulk_email_logs                | BASE TABLE | InnoDB |          0 |       16384 |        49152 |
| bulk_sms_logs                  | BASE TABLE | InnoDB |          0 |       16384 |        49152 |
| chats                          | BASE TABLE | InnoDB |         17 |       16384 |        49152 |
| class_content_access           | BASE TABLE | InnoDB |          0 |       16384 |        49152 |
| class_member_counts            | VIEW       | NULL   |       NULL |        NULL |         NULL |
| classes                        | BASE TABLE | InnoDB |          7 |       16384 |       114688 |
| comments                       | BASE TABLE | InnoDB |         10 |       16384 |        49152 |
| converse_relationships         | BASE TABLE | InnoDB |          0 |       16384 |        49152 |
| email_logs                     | BASE TABLE | InnoDB |          0 |       16384 |        81920 |
| email_templates                | BASE TABLE | InnoDB |         10 |       16384 |        65536 |
| full_membership_access         | BASE TABLE | InnoDB |          0 |       16384 |        32768 |
| full_membership_access_log     | BASE TABLE | InnoDB |          0 |       16384 |        49152 |
| full_membership_applications   | BASE TABLE | InnoDB |          0 |       16384 |        98304 |
| id_generation_log              | BASE TABLE | InnoDB |          1 |       16384 |        49152 |
| identity_masking_audit         | BASE TABLE | InnoDB |          1 |       16384 |        49152 |
| membership_review_history      | BASE TABLE | InnoDB |          0 |       16384 |        65536 |
| membership_stats               | VIEW       | NULL   |       NULL |        NULL |         NULL |
| pending_applications_overview  | VIEW       | NULL   |       NULL |        NULL |         NULL |
| pending_full_memberships       | VIEW       | NULL   |       NULL |        NULL |         NULL |
| pending_initial_applications   | VIEW       | NULL   |       NULL |        NULL |         NULL |
| reports                        | BASE TABLE | InnoDB |          0 |       16384 |        32768 |
| sms_logs                       | BASE TABLE | InnoDB |          0 |       16384 |        81920 |
| sms_templates                  | BASE TABLE | InnoDB |          7 |       16384 |        65536 |
| survey_questions               | BASE TABLE | InnoDB |          0 |       16384 |            0 |
| surveylog                      | BASE TABLE | InnoDB |          3 |       16384 |       114688 |
| teachings                      | BASE TABLE | InnoDB |         15 |       49152 |        49152 |
| user_chats                     | BASE TABLE | InnoDB |          0 |       16384 |        16384 |
| user_class_details             | VIEW       | NULL   |       NULL |        NULL |         NULL |
| user_class_memberships         | BASE TABLE | InnoDB |          0 |       16384 |        98304 |
| user_communication_preferences | BASE TABLE | InnoDB |          3 |       16384 |        49152 |
| user_profiles                  | BASE TABLE | InnoDB |          0 |       16384 |        16384 |
| users                          | BASE TABLE | InnoDB |          3 |       16384 |       147456 |
| verification_codes             | BASE TABLE | InnoDB |          0 |       16384 |        32768 |
+--------------------------------+------------+--------+------------+-------------+--------------+
36 rows in set (0.087 sec)

MySQL [ikoota_db]> SELECT
    ->     TABLE_NAME,
    ->     COLUMN_NAME,
    ->     DATA_TYPE,
    ->     IS_NULLABLE,
    ->     COLUMN_DEFAULT,
    ->     COLUMN_KEY,
    ->     EXTRA,
    ->     COLUMN_COMMENT
    -> FROM INFORMATION_SCHEMA.COLUMNS
    -> WHERE TABLE_SCHEMA = 'ikoota_db'
    -> ORDER BY TABLE_NAME, ORDINAL_POSITION;
+--------------------------------+-----------------------------+------------+-------------+---------------------+------------+-----------------------------------------------+----------------+
| TABLE_NAME                     | COLUMN_NAME                 | DATA_TYPE  | IS_NULLABLE | COLUMN_DEFAULT      | COLUMN_KEY | EXTRA                                         | COLUMN_COMMENT |
+--------------------------------+-----------------------------+------------+-------------+---------------------+------------+-----------------------------------------------+----------------+
| admin_membership_overview      | id                          | int        | NO          | 0                   |            |                                               |                |
| admin_membership_overview      | username                    | varchar    | NO          | NULL                |            |                                               |                |
| admin_membership_overview      | email                       | varchar    | NO          | NULL                |            |                                               |                |
| admin_membership_overview      | converse_id                 | varchar    | YES         | NULL                |            |                                               |                |
| admin_membership_overview      | initial_status              | enum       | YES         | applied             |            |                                               |                |
| admin_membership_overview      | membership_stage            | enum       | YES         | none                |            |                                               |                |
| admin_membership_overview      | initial_ticket              | varchar    | YES         | NULL                |            |                                               |                |
| admin_membership_overview      | full_membership_status      | enum       | YES         | not_applied         |            |                                               |                |
| admin_membership_overview      | full_membership_ticket      | varchar    | YES         | NULL                |            |                                               |                |
| admin_membership_overview      | full_membership_applied_at  | timestamp  | YES         | NULL                |            |                                               |                |
| admin_membership_overview      | initial_submitted           | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED                             |                |
| admin_membership_overview      | initial_approval_status     | enum       | YES         | pending             |            |                                               |                |
| admin_membership_overview      | initial_reviewer            | int        | YES         | NULL                |            |                                               |                |
| admin_membership_overview      | initial_reviewed_at         | timestamp  | YES         | NULL                |            |                                               |                |
| admin_membership_overview      | initial_verified_by         | char       | YES         | NULL                |            |                                               |                |
| admin_membership_overview      | initial_admin_notes         | text       | YES         | NULL                |            |                                               |                |
| admin_membership_overview      | full_submitted              | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED                             |                |
| admin_membership_overview      | full_application_status     | enum       | YES         | pending             |            |                                               |                |
| admin_membership_overview      | full_reviewed_at            | timestamp  | YES         | NULL                |            |                                               |                |
| admin_membership_overview      | full_reviewer               | int        | YES         | NULL                |            |                                               |                |
| admin_membership_overview      | full_admin_notes            | text       | YES         | NULL                |            |                                               |                |
| admin_membership_overview      | full_reviewer_name          | varchar    | YES         | NULL                |            |                                               |                |
| admin_membership_overview      | user_created                | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED                             |                |
| all_applications_status        | application_type            | varchar    | NO          |                     |            |                                               |                |
| all_applications_status        | user_id                     | int        | NO          | 0                   |            |                                               |                |
| all_applications_status        | username                    | varchar    | NO          |                     |            |                                               |                |
| all_applications_status        | email                       | varchar    | NO          |                     |            |                                               |                |
| all_applications_status        | ticket                      | varchar    | YES         | NULL                |            |                                               |                |
| all_applications_status        | status                      | varchar    | YES         | NULL                |            |                                               |                |
| all_applications_status        | submitted_at                | timestamp  | YES         | NULL                |            |                                               |                |
| all_applications_status        | reviewed_at                 | timestamp  | YES         | NULL                |            |                                               |                |
| all_applications_status        | reviewed_by                 | int        | YES         | NULL                |            |                                               |                |
| all_applications_status        | admin_notes                 | mediumtext | YES         | NULL                |            |                                               |                |
| all_applications_status        | reviewer_name               | varchar    | YES         | NULL                |            |                                               |                |
| audit_logs                     | id                          | int        | NO          | NULL                | PRI        | auto_increment                                |                |
| audit_logs                     | admin_id                    | char       | NO          | NULL                | MUL        |                                               |                |
| audit_logs                     | action                      | varchar    | NO          | NULL                |            |                                               |                |
| audit_logs                     | target_id                   | char       | YES         | NULL                | MUL        |                                               |                |
| audit_logs                     | details                     | text       | YES         | NULL                |            |                                               |                |
| audit_logs                     | createdAt                   | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED                             |                |
| bulk_email_logs                | id                          | int        | NO          | NULL                | PRI        | auto_increment                                |                |
| bulk_email_logs                | recipients_count            | int        | NO          | NULL                |            |                                               |                |
| bulk_email_logs                | subject                     | varchar    | YES         | NULL                |            |                                               |                |
| bulk_email_logs                | template                    | varchar    | YES         | NULL                | MUL        |                                               |                |
| bulk_email_logs                | successful_count            | int        | YES         | 0                   |            |                                               |                |
| bulk_email_logs                | failed_count                | int        | YES         | 0                   |            |                                               |                |
| bulk_email_logs                | sender_id                   | char       | YES         | NULL                | MUL        |                                               |                |
| bulk_email_logs                | createdAt                   | timestamp  | YES         | CURRENT_TIMESTAMP   | MUL        | DEFAULT_GENERATED                             |                |
| bulk_email_logs                | updatedAt                   | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |                |
| bulk_email_logs                | processedAt                 | timestamp  | YES         | NULL                |            |                                               |                |
| bulk_sms_logs                  | id                          | int        | NO          | NULL                | PRI        | auto_increment                                |                |
| bulk_sms_logs                  | recipients_count            | int        | NO          | NULL                |            |                                               |                |
| bulk_sms_logs                  | message                     | text       | YES         | NULL                |            |                                               |                |
| bulk_sms_logs                  | template                    | varchar    | YES         | NULL                | MUL        |                                               |                |
| bulk_sms_logs                  | successful_count            | int        | YES         | 0                   |            |                                               |                |
| bulk_sms_logs                  | failed_count                | int        | YES         | 0                   |            |                                               |                |
| bulk_sms_logs                  | sender_id                   | char       | YES         | NULL                | MUL        |                                               |                |
| bulk_sms_logs                  | createdAt                   | timestamp  | YES         | CURRENT_TIMESTAMP   | MUL        | DEFAULT_GENERATED                             |                |
| bulk_sms_logs                  | updatedAt                   | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |                |
| bulk_sms_logs                  | processedAt                 | timestamp  | YES         | NULL                |            |                                               |                |
| chats                          | id                          | int        | NO          | NULL                | PRI        | auto_increment                                |                |
| chats                          | title                       | varchar    | NO          | NULL                |            |                                               |                |
| chats                          | user_id                     | char       | NO          | NULL                | MUL        |                                               |                |
| chats                          | audience                    | varchar    | YES         | NULL                |            |                                               |                |
| chats                          | summary                     | text       | YES         | NULL                |            |                                               |                |
| chats                          | text                        | text       | YES         | NULL                |            |                                               |                |
| chats                          | approval_status             | enum       | YES         | pending             |            |                                               |                |
| chats                          | media_url1                  | varchar    | YES         | NULL                |            |                                               |                |
| chats                          | media_type1                 | enum       | YES         | NULL                |            |                                               |                |
| chats                          | media_url2                  | varchar    | YES         | NULL                |            |                                               |                |
| chats                          | media_type2                 | enum       | YES         | NULL                |            |                                               |                |
| chats                          | media_url3                  | varchar    | YES         | NULL                |            |                                               |                |
| chats                          | is_flagged                  | tinyint    | YES         | 0                   |            |                                               |                |
| chats                          | media_type3                 | enum       | YES         | NULL                |            |                                               |                |
| chats                          | createdAt                   | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED                             |                |
| chats                          | updatedAt                   | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED                             |                |
| chats                          | prefixed_id                 | varchar    | YES         | NULL                | UNI        |                                               |                |
| class_content_access           | id                          | int        | NO          | NULL                | PRI        | auto_increment                                |                |
| class_content_access           | content_id                  | int        | NO          | NULL                | MUL        |                                               |                |
| class_content_access           | content_type                | enum       | NO          | NULL                |            |                                               |                |
| class_content_access           | class_id                    | varchar    | NO          | NULL                | MUL        |                                               |                |
| class_content_access           | access_level                | enum       | YES         | read                |            |                                               |                |
| class_content_access           | createdAt                   | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED                             |                |
| class_member_counts            | class_id                    | varchar    | NO          | NULL                |            |                                               |                |
| class_member_counts            | class_name                  | varchar    | NO          | NULL                |            |                                               |                |
| class_member_counts            | class_type                  | enum       | YES         | demographic         |            |                                               |                |
| class_member_counts            | is_public                   | tinyint    | YES         | 0                   |            |                                               |                |
| class_member_counts            | total_members               | bigint     | NO          | 0                   |            |                                               |                |
| class_member_counts            | moderators                  | bigint     | NO          | 0                   |            |                                               |                |
| class_member_counts            | pending_members             | bigint     | NO          | 0                   |            |                                               |                |
| classes                        | id                          | int        | NO          | NULL                | PRI        | auto_increment                                |                |
| classes                        | class_id                    | varchar    | NO          | NULL                | UNI        |                                               |                |
| classes                        | class_name                  | varchar    | NO          | NULL                |            |                                               |                |
| classes                        | public_name                 | varchar    | YES         | NULL                |            |                                               |                |
| classes                        | description                 | text       | YES         | NULL                |            |                                               |                |
| classes                        | class_type                  | enum       | YES         | demographic         | MUL        |                                               |                |
| classes                        | is_public                   | tinyint    | YES         | 0                   | MUL        |                                               |                |
| classes                        | max_members                 | int        | YES         | 50                  |            |                                               |                |
| classes                        | privacy_level               | enum       | YES         | members_only        |            |                                               |                |
| classes                        | created_by                  | int        | YES         | NULL                | MUL        |                                               |                |
| classes                        | is_active                   | tinyint    | YES         | 1                   | MUL        |                                               |                |
| classes                        | createdAt                   | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED                             |                |
| classes                        | updatedAt                   | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED                             |                |
| comments                       | id                          | int        | NO          | NULL                | PRI        | auto_increment                                |                |
| comments                       | user_id                     | char       | NO          | NULL                | MUL        |                                               |                |
| comments                       | chat_id                     | int        | YES         | NULL                | MUL        |                                               |                |
| comments                       | teaching_id                 | int        | YES         | NULL                | MUL        |                                               |                |
| comments                       | comment                     | text       | NO          | NULL                |            |                                               |                |
| comments                       | media_url1                  | varchar    | YES         | NULL                |            |                                               |                |
| comments                       | media_type1                 | enum       | YES         | NULL                |            |                                               |                |
| comments                       | media_url2                  | varchar    | YES         | NULL                |            |                                               |                |
| comments                       | media_type2                 | enum       | YES         | NULL                |            |                                               |                |
| comments                       | media_url3                  | varchar    | YES         | NULL                |            |                                               |                |
| comments                       | media_type3                 | enum       | YES         | NULL                |            |                                               |                |
| comments                       | createdAt                   | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED                             |                |
| comments                       | updatedAt                   | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED                             |                |
| converse_relationships         | id                          | int        | NO          | NULL                | PRI        | auto_increment                                |                |
| converse_relationships         | mentor_converse_id          | varchar    | YES         | NULL                | MUL        |                                               |                |
| converse_relationships         | mentee_converse_id          | varchar    | YES         | NULL                | MUL        |                                               |                |
| converse_relationships         | relationship_type           | enum       | YES         | mentor              |            |                                               |                |
| converse_relationships         | created_at                  | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED                             |                |
| converse_relationships         | is_active                   | tinyint    | YES         | 1                   |            |                                               |                |
| email_logs                     | id                          | int        | NO          | NULL                | PRI        | auto_increment                                |                |
| email_logs                     | recipient                   | varchar    | NO          | NULL                | MUL        |                                               |                |
| email_logs                     | subject                     | varchar    | YES         | NULL                |            |                                               |                |
| email_logs                     | template                    | varchar    | YES         | NULL                | MUL        |                                               |                |
| email_logs                     | status                      | enum       | YES         | pending             | MUL        |                                               |                |
| email_logs                     | message_id                  | varchar    | YES         | NULL                |            |                                               |                |
| email_logs                     | error_message               | text       | YES         | NULL                |            |                                               |                |
| email_logs                     | sender_id                   | char       | YES         | NULL                | MUL        |                                               |                |
| email_logs                     | createdAt                   | timestamp  | YES         | CURRENT_TIMESTAMP   | MUL        | DEFAULT_GENERATED                             |                |
| email_logs                     | updatedAt                   | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |                |
| email_logs                     | processedAt                 | timestamp  | YES         | NULL                |            |                                               |                |
| email_templates                | id                          | int        | NO          | NULL                | PRI        | auto_increment                                |                |
| email_templates                | name                        | varchar    | NO          | NULL                | UNI        |                                               |                |
| email_templates                | subject                     | varchar    | NO          | NULL                |            |                                               |                |
| email_templates                | body_text                   | text       | YES         | NULL                |            |                                               |                |
| email_templates                | body_html                   | text       | YES         | NULL                |            |                                               |                |
| email_templates                | variables                   | json       | YES         | NULL                |            |                                               |                |
| email_templates                | is_active                   | tinyint    | YES         | 1                   | MUL        |                                               |                |
| email_templates                | created_by                  | char       | YES         | NULL                | MUL        |                                               |                |
| email_templates                | createdAt                   | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED                             |                |
| email_templates                | updatedAt                   | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |                |
| full_membership_access         | id                          | int        | NO          | NULL                | PRI        | auto_increment                                |                |
| full_membership_access         | user_id                     | int        | NO          | NULL                | UNI        |                                               |                |
| full_membership_access         | first_accessed_at           | timestamp  | YES         | CURRENT_TIMESTAMP   | MUL        | DEFAULT_GENERATED                             |                |
| full_membership_access         | last_accessed_at            | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |                |
| full_membership_access         | access_count                | int        | YES         | 1                   |            |                                               |                |
| full_membership_access_log     | id                          | int        | NO          | NULL                | PRI        | auto_increment                                |                |
| full_membership_access_log     | user_id                     | int        | NO          | NULL                | UNI        |                                               |                |
| full_membership_access_log     | first_access_at             | timestamp  | YES         | CURRENT_TIMESTAMP   | MUL        | DEFAULT_GENERATED                             |                |
| full_membership_access_log     | total_accesses              | int        | YES         | 1                   |            |                                               |                |
| full_membership_access_log     | last_access_at              | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |                |
| full_membership_access_log     | ip_address                  | varchar    | YES         | NULL                |            |                                               |                |
| full_membership_access_log     | user_agent                  | text       | YES         | NULL                |            |                                               |                |
| full_membership_applications   | id                          | int        | NO          | NULL                | PRI        | auto_increment                                |                |
| full_membership_applications   | user_id                     | int        | NO          | NULL                | UNI        |                                               |                |
| full_membership_applications   | membership_ticket           | varchar    | NO          | NULL                | MUL        |                                               |                |
| full_membership_applications   | answers                     | json       | NO          | NULL                |            |                                               |                |
| full_membership_applications   | status                      | enum       | YES         | pending             | MUL        |                                               |                |
| full_membership_applications   | submitted_at                | timestamp  | YES         | CURRENT_TIMESTAMP   | MUL        | DEFAULT_GENERATED                             |                |
| full_membership_applications   | reviewed_at                 | timestamp  | YES         | NULL                |            |                                               |                |
| full_membership_applications   | reviewed_by                 | int        | YES         | NULL                | MUL        |                                               |                |
| full_membership_applications   | admin_notes                 | text       | YES         | NULL                |            |                                               |                |
| id_generation_log              | id                          | int        | NO          | NULL                | PRI        | auto_increment                                |                |
| id_generation_log              | generated_id                | char       | NO          | NULL                | MUL        |                                               |                |
| id_generation_log              | id_type                     | enum       | NO          | NULL                | MUL        |                                               |                |
| id_generation_log              | generated_by                | char       | YES         | NULL                | MUL        |                                               |                |
| id_generation_log              | generated_at                | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED                             |                |
| id_generation_log              | purpose                     | varchar    | YES         | NULL                |            |                                               |                |
| identity_masking_audit         | id                          | int        | NO          | NULL                | PRI        | auto_increment                                |                |
| identity_masking_audit         | user_id                     | int        | NO          | NULL                | MUL        |                                               |                |
| identity_masking_audit         | converse_id                 | varchar    | YES         | NULL                | MUL        |                                               |                |
| identity_masking_audit         | masked_by_admin_id          | varchar    | YES         | NULL                | MUL        |                                               |                |
| identity_masking_audit         | original_username           | varchar    | YES         | NULL                |            |                                               |                |
| identity_masking_audit         | createdAt                   | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED                             |                |
| identity_masking_audit         | reason                      | text       | YES         | NULL                |            |                                               |                |
| membership_review_history      | id                          | int        | NO          | NULL                | PRI        | auto_increment                                |                |
| membership_review_history      | user_id                     | int        | NO          | NULL                | MUL        |                                               |                |
| membership_review_history      | application_type            | enum       | NO          | NULL                | MUL        |                                               |                |
| membership_review_history      | application_id              | int        | YES         | NULL                |            |                                               |                |
| membership_review_history      | reviewer_id                 | int        | YES         | NULL                | MUL        |                                               |                |
| membership_review_history      | previous_status             | enum       | YES         | NULL                |            |                                               |                |
| membership_review_history      | new_status                  | enum       | YES         | NULL                |            |                                               |                |
| membership_review_history      | review_notes                | text       | YES         | NULL                |            |                                               |                |
| membership_review_history      | action_taken                | enum       | NO          | NULL                |            |                                               |                |
| membership_review_history      | reviewed_at                 | timestamp  | YES         | CURRENT_TIMESTAMP   | MUL        | DEFAULT_GENERATED                             |                |
| membership_review_history      | notification_sent           | tinyint    | YES         | 0                   |            |                                               |                |
| membership_stats               | category                    | varchar    | NO          |                     |            |                                               |                |
| membership_stats               | status                      | varchar    | YES         | NULL                |            |                                               |                |
| membership_stats               | count                       | bigint     | NO          | 0                   |            |                                               |                |
| pending_applications_overview  | application_stage           | varchar    | NO          |                     |            |                                               |                |
| pending_applications_overview  | user_id                     | int        | NO          | 0                   |            |                                               |                |
| pending_applications_overview  | username                    | varchar    | NO          |                     |            |                                               |                |
| pending_applications_overview  | email                       | varchar    | NO          |                     |            |                                               |                |
| pending_applications_overview  | ticket                      | varchar    | YES         | NULL                |            |                                               |                |
| pending_applications_overview  | submitted_at                | timestamp  | YES         | NULL                |            |                                               |                |
| pending_applications_overview  | status                      | varchar    | YES         | NULL                |            |                                               |                |
| pending_applications_overview  | days_pending                | bigint     | YES         | NULL                |            |                                               |                |
| pending_applications_overview  | answers                     | mediumtext | YES         | NULL                |            |                                               |                |
| pending_applications_overview  | application_id              | int        | NO          | 0                   |            |                                               |                |
| pending_applications_overview  | notes                       | mediumtext | YES         | NULL                |            |                                               |                |
| pending_full_memberships       | application_stage           | varchar    | NO          |                     |            |                                               |                |
| pending_full_memberships       | user_id                     | int        | NO          | 0                   |            |                                               |                |
| pending_full_memberships       | username                    | varchar    | NO          | NULL                |            |                                               |                |
| pending_full_memberships       | email                       | varchar    | NO          | NULL                |            |                                               |                |
| pending_full_memberships       | ticket                      | varchar    | NO          | NULL                |            |                                               |                |
| pending_full_memberships       | submitted_at                | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED                             |                |
| pending_full_memberships       | status                      | enum       | YES         | pending             |            |                                               |                |
| pending_full_memberships       | days_pending                | int        | YES         | NULL                |            |                                               |                |
| pending_full_memberships       | answers                     | text       | NO          | NULL                |            |                                               |                |
| pending_full_memberships       | application_id              | int        | NO          | 0                   |            |                                               |                |
| pending_full_memberships       | notes                       | text       | YES         | NULL                |            |                                               |                |
| pending_initial_applications   | application_stage           | varchar    | NO          |                     |            |                                               |                |
| pending_initial_applications   | user_id                     | int        | NO          | 0                   |            |                                               |                |
| pending_initial_applications   | username                    | varchar    | NO          | NULL                |            |                                               |                |
| pending_initial_applications   | email                       | varchar    | NO          | NULL                |            |                                               |                |
| pending_initial_applications   | ticket                      | varchar    | YES         | NULL                |            |                                               |                |
| pending_initial_applications   | submitted_at                | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED                             |                |
| pending_initial_applications   | status                      | enum       | YES         | pending             |            |                                               |                |
| pending_initial_applications   | days_pending                | int        | YES         | NULL                |            |                                               |                |
| pending_initial_applications   | answers                     | text       | YES         | NULL                |            |                                               |                |
| pending_initial_applications   | application_id              | int        | NO          | 0                   |            |                                               |                |
| pending_initial_applications   | notes                       | text       | YES         | NULL                |            |                                               |                |
| reports                        | id                          | int        | NO          | NULL                | PRI        | auto_increment                                |                |
| reports                        | reporter_id                 | char       | NO          | NULL                | MUL        |                                               |                |
| reports                        | reported_id                 | char       | YES         | NULL                | MUL        |                                               |                |
| reports                        | reason                      | text       | NO          | NULL                |            |                                               |                |
| reports                        | status                      | enum       | YES         | pending             |            |                                               |                |
| reports                        | createdAt                   | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED                             |                |
| sms_logs                       | id                          | int        | NO          | NULL                | PRI        | auto_increment                                |                |
| sms_logs                       | recipient                   | varchar    | NO          | NULL                | MUL        |                                               |                |
| sms_logs                       | message                     | text       | YES         | NULL                |            |                                               |                |
| sms_logs                       | template                    | varchar    | YES         | NULL                | MUL        |                                               |                |
| sms_logs                       | status                      | enum       | YES         | pending             | MUL        |                                               |                |
| sms_logs                       | sid                         | varchar    | YES         | NULL                |            |                                               |                |
| sms_logs                       | error_message               | text       | YES         | NULL                |            |                                               |                |
| sms_logs                       | sender_id                   | char       | YES         | NULL                | MUL        |                                               |                |
| sms_logs                       | createdAt                   | timestamp  | YES         | CURRENT_TIMESTAMP   | MUL        | DEFAULT_GENERATED                             |                |
| sms_logs                       | updatedAt                   | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |                |
| sms_logs                       | processedAt                 | timestamp  | YES         | NULL                |            |                                               |                |
| sms_templates                  | id                          | int        | NO          | NULL                | PRI        | auto_increment                                |                |
| sms_templates                  | name                        | varchar    | NO          | NULL                | UNI        |                                               |                |
| sms_templates                  | message                     | text       | NO          | NULL                |            |                                               |                |
| sms_templates                  | variables                   | json       | YES         | NULL                |            |                                               |                |
| sms_templates                  | is_active                   | tinyint    | YES         | 1                   | MUL        |                                               |                |
| sms_templates                  | created_by                  | char       | YES         | NULL                | MUL        |                                               |                |
| sms_templates                  | createdAt                   | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED                             |                |
| sms_templates                  | updatedAt                   | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |                |
| survey_questions               | id                          | int        | NO          | NULL                | PRI        | auto_increment                                |                |
| survey_questions               | question                    | text       | NO          | NULL                |            |                                               |                |
| survey_questions               | createdAt                   | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED                             |                |
| survey_questions               | updatedAt                   | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |                |
| survey_questions               | is_active                   | tinyint    | YES         | 1                   |            |                                               |                |
| survey_questions               | question_order              | int        | YES         | 0                   |            |                                               |                |
| surveylog                      | id                          | int        | NO          | NULL                | PRI        | auto_increment                                |                |
| surveylog                      | user_id                     | char       | NO          | NULL                | MUL        |                                               |                |
| surveylog                      | answers                     | text       | YES         | NULL                |            |                                               |                |
| surveylog                      | verified_by                 | char       | NO          | NULL                | MUL        |                                               |                |
| surveylog                      | rating_remarks              | varchar    | NO          | NULL                |            |                                               |                |
| surveylog                      | approval_status             | enum       | YES         | pending             | MUL        |                                               |                |
| surveylog                      | createdAt                   | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED                             |                |
| surveylog                      | updatedAt                   | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |                |
| surveylog                      | processedAt                 | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED                             |                |
| surveylog                      | admin_notes                 | text       | YES         | NULL                |            |                                               |                |
| surveylog                      | application_type            | enum       | YES         | initial_application | MUL        |                                               |                |
| surveylog                      | reviewed_at                 | timestamp  | YES         | NULL                | MUL        |                                               |                |
| surveylog                      | reviewed_by                 | int        | YES         | NULL                | MUL        |                                               |                |
| teachings                      | id                          | int        | NO          | NULL                | PRI        | auto_increment                                |                |
| teachings                      | topic                       | varchar    | NO          | NULL                |            |                                               |                |
| teachings                      | description                 | text       | YES         | NULL                |            |                                               |                |
| teachings                      | lessonNumber                | varchar    | NO          | NULL                |            |                                               |                |
| teachings                      | subjectMatter               | varchar    | YES         | NULL                |            |                                               |                |
| teachings                      | audience                    | varchar    | YES         | NULL                |            |                                               |                |
| teachings                      | content                     | text       | YES         | NULL                |            |                                               |                |
| teachings                      | media_url1                  | varchar    | YES         | NULL                |            |                                               |                |
| teachings                      | media_type1                 | enum       | YES         | NULL                |            |                                               |                |
| teachings                      | media_url2                  | varchar    | YES         | NULL                |            |                                               |                |
| teachings                      | media_type2                 | enum       | YES         | NULL                |            |                                               |                |
| teachings                      | media_url3                  | varchar    | YES         | NULL                |            |                                               |                |
| teachings                      | media_type3                 | enum       | YES         | NULL                |            |                                               |                |
| teachings                      | createdAt                   | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED                             |                |
| teachings                      | updatedAt                   | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |                |
| teachings                      | user_id                     | char       | NO          | NULL                | MUL        |                                               |                |
| teachings                      | prefixed_id                 | varchar    | YES         | NULL                | UNI        |                                               |                |
| user_chats                     | id                          | int        | NO          | NULL                | PRI        | auto_increment                                |                |
| user_chats                     | user_id                     | char       | NO          | NULL                | MUL        |                                               |                |
| user_chats                     | chat_id                     | char       | NO          | NULL                |            |                                               |                |
| user_chats                     | last_message                | varchar    | YES         | NULL                |            |                                               |                |
| user_chats                     | is_seen                     | tinyint    | YES         | 0                   |            |                                               |                |
| user_chats                     | role                        | enum       | NO          | NULL                |            |                                               |                |
| user_chats                     | is_muted                    | tinyint    | YES         | 0                   |            |                                               |                |
| user_chats                     | last_read_message_id        | varchar    | YES         | NULL                |            |                                               |                |
| user_chats                     | joined_at                   | datetime   | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED                             |                |
| user_chats                     | updatedAt                   | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED                             |                |
| user_class_details             | user_id                     | int        | NO          | NULL                |            |                                               |                |
| user_class_details             | username                    | varchar    | NO          | NULL                |            |                                               |                |
| user_class_details             | converse_id                 | varchar    | YES         | NULL                |            |                                               |                |
| user_class_details             | class_id                    | varchar    | NO          | NULL                |            |                                               |                |
| user_class_details             | class_name                  | varchar    | NO          | NULL                |            |                                               |                |
| user_class_details             | public_name                 | varchar    | YES         | NULL                |            |                                               |                |
| user_class_details             | class_type                  | enum       | YES         | demographic         |            |                                               |                |
| user_class_details             | is_public                   | tinyint    | YES         | 0                   |            |                                               |                |
| user_class_details             | membership_status           | enum       | YES         | active              |            |                                               |                |
| user_class_details             | role_in_class               | enum       | YES         | member              |            |                                               |                |
| user_class_details             | can_see_class_name          | tinyint    | YES         | 1                   |            |                                               |                |
| user_class_details             | joined_at                   | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED                             |                |
| user_class_memberships         | id                          | int        | NO          | NULL                | PRI        | auto_increment                                |                |
| user_class_memberships         | user_id                     | int        | NO          | NULL                | MUL        |                                               |                |
| user_class_memberships         | class_id                    | varchar    | NO          | NULL                | MUL        |                                               |                |
| user_class_memberships         | membership_status           | enum       | YES         | active              | MUL        |                                               |                |
| user_class_memberships         | role_in_class               | enum       | YES         | member              |            |                                               |                |
| user_class_memberships         | joined_at                   | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED                             |                |
| user_class_memberships         | assigned_by                 | int        | YES         | NULL                | MUL        |                                               |                |
| user_class_memberships         | expires_at                  | timestamp  | YES         | NULL                |            |                                               |                |
| user_class_memberships         | can_see_class_name          | tinyint    | YES         | 1                   |            |                                               |                |
| user_class_memberships         | receive_notifications       | tinyint    | YES         | 1                   |            |                                               |                |
| user_class_memberships         | createdAt                   | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED                             |                |
| user_class_memberships         | updatedAt                   | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |                |
| user_communication_preferences | id                          | int        | NO          | NULL                | PRI        | auto_increment                                |                |
| user_communication_preferences | user_id                     | int        | NO          | NULL                | UNI        |                                               |                |
| user_communication_preferences | email_notifications         | tinyint    | YES         | 1                   |            |                                               |                |
| user_communication_preferences | sms_notifications           | tinyint    | YES         | 0                   |            |                                               |                |
| user_communication_preferences | marketing_emails            | tinyint    | YES         | 1                   |            |                                               |                |
| user_communication_preferences | marketing_sms               | tinyint    | YES         | 0                   |            |                                               |                |
| user_communication_preferences | survey_notifications        | tinyint    | YES         | 1                   |            |                                               |                |
| user_communication_preferences | content_notifications       | tinyint    | YES         | 1                   |            |                                               |                |
| user_communication_preferences | admin_notifications         | tinyint    | YES         | 1                   |            |                                               |                |
| user_communication_preferences | preferred_language          | varchar    | YES         | en                  |            |                                               |                |
| user_communication_preferences | timezone                    | varchar    | YES         | UTC                 |            |                                               |                |
| user_communication_preferences | createdAt                   | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED                             |                |
| user_communication_preferences | updatedAt                   | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |                |
| user_communication_preferences | converse_id                 | char       | YES         | NULL                | MUL        |                                               |                |
| user_profiles                  | id                          | int        | NO          | NULL                | PRI        | auto_increment                                |                |
| user_profiles                  | user_id                     | int        | NO          | NULL                | UNI        |                                               |                |
| user_profiles                  | encrypted_username          | text       | NO          | NULL                |            |                                               |                |
| user_profiles                  | encrypted_email             | text       | NO          | NULL                |            |                                               |                |
| user_profiles                  | encrypted_phone             | text       | YES         | NULL                |            |                                               |                |
| user_profiles                  | encryption_key              | varchar    | YES         | NULL                |            |                                               |                |
| user_profiles                  | createdAt                   | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED                             |                |
| user_profiles                  | updatedAt                   | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED                             |                |
| users                          | id                          | int        | NO          | NULL                | PRI        | auto_increment                                |                |
| users                          | username                    | varchar    | NO          | NULL                |            |                                               |                |
| users                          | email                       | varchar    | NO          | NULL                |            |                                               |                |
| users                          | phone                       | varchar    | YES         | NULL                |            |                                               |                |
| users                          | avatar                      | varchar    | YES         | NULL                |            |                                               |                |
| users                          | password_hash               | varchar    | NO          | NULL                |            |                                               |                |
| users                          | converse_id                 | varchar    | YES         | NULL                | UNI        |                                               |                |
| users                          | application_ticket          | varchar    | YES         | NULL                | MUL        |                                               |                |
| users                          | mentor_id                   | char       | YES         | NULL                | MUL        |                                               |                |
| users                          | primary_class_id            | varchar    | YES         | NULL                | MUL        |                                               |                |
| users                          | is_member                   | enum       | YES         | applied             |            |                                               |                |
| users                          | membership_stage            | enum       | YES         | none                | MUL        |                                               |                |
| users                          | full_membership_ticket      | varchar    | YES         | NULL                |            |                                               |                |
| users                          | full_membership_status      | enum       | YES         | not_applied         | MUL        |                                               |                |
| users                          | full_membership_applied_at  | timestamp  | YES         | NULL                | MUL        |                                               |                |
| users                          | full_membership_reviewed_at | timestamp  | YES         | NULL                |            |                                               |                |
| users                          | role                        | enum       | YES         | user                |            |                                               |                |
| users                          | isblocked                   | json       | YES         | NULL                |            |                                               |                |
| users                          | isbanned                    | tinyint    | YES         | 0                   |            |                                               |                |
| users                          | createdAt                   | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED                             |                |
| users                          | updatedAt                   | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED                             |                |
| users                          | resetToken                  | varchar    | YES         | NULL                |            |                                               |                |
| users                          | resetTokenExpiry            | bigint     | YES         | NULL                |            |                                               |                |
| users                          | verification_method         | enum       | YES         | NULL                |            |                                               |                |
| users                          | verification_code           | varchar    | YES         | NULL                |            |                                               |                |
| users                          | is_verified                 | tinyint    | YES         | 0                   | MUL        |                                               |                |
| users                          | codeExpiry                  | bigint     | YES         | NULL                |            |                                               |                |
| users                          | converse_avatar             | varchar    | YES         | NULL                |            |                                               |                |
| users                          | is_identity_masked          | tinyint    | YES         | 0                   |            |                                               |                |
| users                          | total_classes               | int        | YES         | 0                   |            |                                               |                |
| verification_codes             | id                          | int        | NO          | NULL                | PRI        | auto_increment                                |                |
| verification_codes             | email                       | varchar    | NO          | NULL                | MUL        |                                               |                |
| verification_codes             | phone                       | varchar    | YES         | NULL                |            |                                               |                |
| verification_codes             | code                        | varchar    | NO          | NULL                |            |                                               |                |
| verification_codes             | method                      | enum       | NO          | NULL                |            |                                               |                |
| verification_codes             | expiresAt                   | timestamp  | NO          | NULL                | MUL        |                                               |                |
| verification_codes             | createdAt                   | timestamp  | YES         | CURRENT_TIMESTAMP   |            | DEFAULT_GENERATED                             |                |
+--------------------------------+-----------------------------+------------+-------------+---------------------+------------+-----------------------------------------------+----------------+
378 rows in set (0.138 sec)

MySQL [ikoota_db]> SELECT
    ->     t.TABLE_NAME,
    ->     GROUP_CONCAT(k.COLUMN_NAME ORDER BY k.ORDINAL_POSITION) as PRIMARY_KEY_COLUMNS
    -> FROM INFORMATION_SCHEMA.TABLES t
    -> LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
    ->     ON t.TABLE_SCHEMA = k.TABLE_SCHEMA
    ->     AND t.TABLE_NAME = k.TABLE_NAME
    ->     AND k.CONSTRAINT_NAME = 'PRIMARY'
    -> WHERE t.TABLE_SCHEMA = 'ikoota_db'
    ->     AND t.TABLE_TYPE = 'BASE TABLE'
    -> GROUP BY t.TABLE_NAME
    -> ORDER BY t.TABLE_NAME;
+--------------------------------+---------------------+
| TABLE_NAME                     | PRIMARY_KEY_COLUMNS |
+--------------------------------+---------------------+
| audit_logs                     | id                  |
| bulk_email_logs                | id                  |
| bulk_sms_logs                  | id                  |
| chats                          | id                  |
| class_content_access           | id                  |
| classes                        | id                  |
| comments                       | id                  |
| converse_relationships         | id                  |
| email_logs                     | id                  |
| email_templates                | id                  |
| full_membership_access         | id                  |
| full_membership_access_log     | id                  |
| full_membership_applications   | id                  |
| id_generation_log              | id                  |
| identity_masking_audit         | id                  |
| membership_review_history      | id                  |
| reports                        | id                  |
| sms_logs                       | id                  |
| sms_templates                  | id                  |
| survey_questions               | id                  |
| surveylog                      | id                  |
| teachings                      | id                  |
| user_chats                     | id                  |
| user_class_memberships         | id                  |
| user_communication_preferences | id                  |
| user_profiles                  | id                  |
| users                          | id                  |
| verification_codes             | id                  |
+--------------------------------+---------------------+
28 rows in set (0.109 sec)

MySQL [ikoota_db]> SELECT 'ACTUAL TABLES' as type;
+---------------+
| type          |
+---------------+
| ACTUAL TABLES |
+---------------+
1 row in set (0.073 sec)

MySQL [ikoota_db]> SELECT TABLE_NAME
    -> FROM INFORMATION_SCHEMA.TABLES
    -> WHERE TABLE_SCHEMA = 'ikoota_db'
    ->     AND TABLE_TYPE = 'BASE TABLE'
    -> ORDER BY TABLE_NAME;
+--------------------------------+
| TABLE_NAME                     |
+--------------------------------+
| audit_logs                     |
| bulk_email_logs                |
| bulk_sms_logs                  |
| chats                          |
| class_content_access           |
| classes                        |
| comments                       |
| converse_relationships         |
| email_logs                     |
| email_templates                |
| full_membership_access         |
| full_membership_access_log     |
| full_membership_applications   |
| id_generation_log              |
| identity_masking_audit         |
| membership_review_history      |
| reports                        |
| sms_logs                       |
| sms_templates                  |
| survey_questions               |
| surveylog                      |
| teachings                      |
| user_chats                     |
| user_class_memberships         |
| user_communication_preferences |
| user_profiles                  |
| users                          |
| verification_codes             |
+--------------------------------+
28 rows in set (0.069 sec)

MySQL [ikoota_db]>
MySQL [ikoota_db]> -- Show only views
MySQL [ikoota_db]> SELECT 'VIEWS' as type;
+-------+
| type  |
+-------+
| VIEWS |
+-------+
1 row in set (0.047 sec)

MySQL [ikoota_db]> SELECT TABLE_NAME
    -> FROM INFORMATION_SCHEMA.TABLES
    -> WHERE TABLE_SCHEMA = 'ikoota_db'
    ->     AND TABLE_TYPE = 'VIEW'
    -> ORDER BY TABLE_NAME;
+-------------------------------+
| TABLE_NAME                    |
+-------------------------------+
| admin_membership_overview     |
| all_applications_status       |
| class_member_counts           |
| membership_stats              |
| pending_applications_overview |
| pending_full_memberships      |
| pending_initial_applications  |
| user_class_details            |
+-------------------------------+
8 rows in set (0.042 sec)

MySQL [ikoota_db]> SELECT 'MEMBERSHIP SYSTEM TABLES' as category;
+--------------------------+
| category                 |
+--------------------------+
| MEMBERSHIP SYSTEM TABLES |
+--------------------------+
1 row in set (0.050 sec)

MySQL [ikoota_db]>
MySQL [ikoota_db]> DESCRIBE users;
+-----------------------------+---------------------------------------------------------------------------------------------+------+-----+-------------------+-------------------+
| Field                       | Type                                                                                        | Null | Key | Default           | Extra             |
+-----------------------------+---------------------------------------------------------------------------------------------+------+-----+-------------------+-------------------+
| id                          | int                                                                                         | NO   | PRI | NULL              | auto_increment    |
| username                    | varchar(255)                                                                                | NO   |     | NULL              |                   |
| email                       | varchar(255)                                                                                | NO   |     | NULL              |                   |
| phone                       | varchar(15)                                                                                 | YES  |     | NULL              |                   |
| avatar                      | varchar(255)                                                                                | YES  |     | NULL              |                   |
| password_hash               | varchar(255)                                                                                | NO   |     | NULL              |                   |
| converse_id                 | varchar(12)                                                                                 | YES  | UNI | NULL              |                   |
| application_ticket          | varchar(20)                                                                                 | YES  | MUL | NULL              |                   |
| mentor_id                   | char(10)                                                                                    | YES  | MUL | NULL              |                   |
| primary_class_id            | varchar(12)                                                                                 | YES  | MUL | NULL              |                   |
| is_member                   | enum('applied','pending','suspended','granted','declined','pre_member','member','rejected') | YES  |     | applied           |                   |
| membership_stage            | enum('none','applicant','pre_member','member')                                              | YES  | MUL | none              |                   |
| full_membership_ticket      | varchar(25)                                                                                 | YES  |     | NULL              |                   |
| full_membership_status      | enum('not_applied','applied','pending','suspended','approved','declined')                   | YES  | MUL | not_applied       |                   |
| full_membership_applied_at  | timestamp                                                                                   | YES  | MUL | NULL              |                   |
| full_membership_reviewed_at | timestamp                                                                                   | YES  |     | NULL              |                   |
| role                        | enum('super_admin','admin','user')                                                          | YES  |     | user              |                   |
| isblocked                   | json                                                                                        | YES  |     | NULL              |                   |
| isbanned                    | tinyint(1)                                                                                  | YES  |     | 0                 |                   |
| createdAt                   | timestamp                                                                                   | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updatedAt                   | timestamp                                                                                   | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| resetToken                  | varchar(255)                                                                                | YES  |     | NULL              |                   |
| resetTokenExpiry            | bigint                                                                                      | YES  |     | NULL              |                   |
| verification_method         | enum('email','phone')                                                                       | YES  |     | NULL              |                   |
| verification_code           | varchar(10)                                                                                 | YES  |     | NULL              |                   |
| is_verified                 | tinyint(1)                                                                                  | YES  | MUL | 0                 |                   |
| codeExpiry                  | bigint                                                                                      | YES  |     | NULL              |                   |
| converse_avatar             | varchar(255)                                                                                | YES  |     | NULL              |                   |
| is_identity_masked          | tinyint(1)                                                                                  | YES  |     | 0                 |                   |
| total_classes               | int                                                                                         | YES  |     | 0                 |                   |
+-----------------------------+---------------------------------------------------------------------------------------------+------+-----+-------------------+-------------------+
30 rows in set (0.053 sec)

MySQL [ikoota_db]> SELECT '';
+--+
|  |
+--+
|  |
+--+
1 row in set (0.050 sec)

MySQL [ikoota_db]> DESCRIBE surveylog;
+------------------+---------------------------------------------------------------------------+------+-----+---------------------+-----------------------------------------------+
| Field            | Type                                                                      | Null | Key | Default             | Extra                                         |
+------------------+---------------------------------------------------------------------------+------+-----+---------------------+-----------------------------------------------+
| id               | int                                                                       | NO   | PRI | NULL                | auto_increment                                |
| user_id          | char(10)                                                                  | NO   | MUL | NULL                |                                               |
| answers          | text                                                                      | YES  |     | NULL                |                                               |
| verified_by      | char(10)                                                                  | NO   | MUL | NULL                |                                               |
| rating_remarks   | varchar(255)                                                              | NO   |     | NULL                |                                               |
| approval_status  | enum('pending','approved','rejected','under_review','granted','declined') | YES  | MUL | pending             |                                               |
| createdAt        | timestamp                                                                 | YES  |     | CURRENT_TIMESTAMP   | DEFAULT_GENERATED                             |
| updatedAt        | timestamp                                                                 | YES  |     | CURRENT_TIMESTAMP   | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| processedAt      | timestamp                                                                 | YES  |     | CURRENT_TIMESTAMP   | DEFAULT_GENERATED                             |
| admin_notes      | text                                                                      | YES  |     | NULL                |                                               |
| application_type | enum('initial_application','full_membership')                             | YES  | MUL | initial_application |                                               |
| reviewed_at      | timestamp                                                                 | YES  | MUL | NULL                |                                               |
| reviewed_by      | int                                                                       | YES  | MUL | NULL                |                                               |
+------------------+---------------------------------------------------------------------------+------+-----+---------------------+-----------------------------------------------+
13 rows in set (0.059 sec)

MySQL [ikoota_db]> SELECT '';
+--+
|  |
+--+
|  |
+--+
1 row in set (0.050 sec)

MySQL [ikoota_db]> DESCRIBE full_membership_applications;
+-------------------+---------------------------------------------------+------+-----+-------------------+-------------------+
| Field             | Type                                              | Null | Key | Default           | Extra             |
+-------------------+---------------------------------------------------+------+-----+-------------------+-------------------+
| id                | int                                               | NO   | PRI | NULL              | auto_increment    |
| user_id           | int                                               | NO   | UNI | NULL              |                   |
| membership_ticket | varchar(25)                                       | NO   | MUL | NULL              |                   |
| answers           | json                                              | NO   |     | NULL              |                   |
| status            | enum('pending','suspended','approved','declined') | YES  | MUL | pending           |                   |
| submitted_at      | timestamp                                         | YES  | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| reviewed_at       | timestamp                                         | YES  |     | NULL              |                   |
| reviewed_by       | int                                               | YES  | MUL | NULL              |                   |
| admin_notes       | text                                              | YES  |     | NULL              |                   |
+-------------------+---------------------------------------------------+------+-----+-------------------+-------------------+
9 rows in set (0.070 sec)

MySQL [ikoota_db]> SELECT '';
+--+
|  |
+--+
|  |
+--+
1 row in set (0.057 sec)

MySQL [ikoota_db]> DESCRIBE full_membership_access;
+-------------------+-----------+------+-----+-------------------+-----------------------------------------------+
| Field             | Type      | Null | Key | Default           | Extra                                         |
+-------------------+-----------+------+-----+-------------------+-----------------------------------------------+
| id                | int       | NO   | PRI | NULL              | auto_increment                                |
| user_id           | int       | NO   | UNI | NULL              |                                               |
| first_accessed_at | timestamp | YES  | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| last_accessed_at  | timestamp | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| access_count      | int       | YES  |     | 1                 |                                               |
+-------------------+-----------+------+-----+-------------------+-----------------------------------------------+
5 rows in set (0.047 sec)

MySQL [ikoota_db]> SELECT '';
+--+
|  |
+--+
|  |
+--+
1 row in set (0.050 sec)

MySQL [ikoota_db]> DESCRIBE membership_review_history;
+-------------------+-------------------------------------------------------------+------+-----+-------------------+-------------------+
| Field             | Type                                                        | Null | Key | Default           | Extra             |
+-------------------+-------------------------------------------------------------+------+-----+-------------------+-------------------+
| id                | int                                                         | NO   | PRI | NULL              | auto_increment    |
| user_id           | int                                                         | NO   | MUL | NULL              |                   |
| application_type  | enum('initial_application','full_membership')               | NO   | MUL | NULL              |                   |
| application_id    | int                                                         | YES  |     | NULL              |                   |
| reviewer_id       | int                                                         | YES  | MUL | NULL              |                   |
| previous_status   | enum('pending','suspended','approved','declined')           | YES  |     | NULL              |                   |
| new_status        | enum('pending','suspended','approved','declined')           | YES  |     | NULL              |                   |
| review_notes      | text                                                        | YES  |     | NULL              |                   |
| action_taken      | enum('approve','decline','suspend','request_info','reopen') | NO   |     | NULL              |                   |
| reviewed_at       | timestamp                                                   | YES  | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| notification_sent | tinyint(1)                                                  | YES  |     | 0                 |                   |
+-------------------+-------------------------------------------------------------+------+-----+-------------------+-------------------+
11 rows in set (0.059 sec)

MySQL [ikoota_db]> SELECT '';
+--+
|  |
+--+
|  |
+--+
1 row in set (0.047 sec)

MySQL [ikoota_db]> DESCRIBE verification_codes;
+-----------+-----------------------+------+-----+-------------------+-------------------+
| Field     | Type                  | Null | Key | Default           | Extra             |
+-----------+-----------------------+------+-----+-------------------+-------------------+
| id        | int                   | NO   | PRI | NULL              | auto_increment    |
| email     | varchar(255)          | NO   | MUL | NULL              |                   |
| phone     | varchar(15)           | YES  |     | NULL              |                   |
| code      | varchar(10)           | NO   |     | NULL              |                   |
| method    | enum('email','phone') | NO   |     | NULL              |                   |
| expiresAt | timestamp             | NO   | MUL | NULL              |                   |
| createdAt | timestamp             | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+-----------+-----------------------+------+-----+-------------------+-------------------+
7 rows in set (0.054 sec)

MySQL [ikoota_db]> SELECT
    ->     TABLE_NAME,
    ->     COLUMN_NAME,
    ->     CONSTRAINT_NAME,
    ->     REFERENCED_TABLE_NAME,
    ->     REFERENCED_COLUMN_NAME
    -> FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    -> WHERE TABLE_SCHEMA = 'ikoota_db'
    ->     AND REFERENCED_TABLE_NAME IS NOT NULL
    -> ORDER BY TABLE_NAME, COLUMN_NAME;
+--------------------------------+------------------+---------------------------------------+-----------------------+------------------------+
| TABLE_NAME                     | COLUMN_NAME      | CONSTRAINT_NAME                       | REFERENCED_TABLE_NAME | REFERENCED_COLUMN_NAME |
+--------------------------------+------------------+---------------------------------------+-----------------------+------------------------+
| class_content_access           | class_id         | class_content_access_ibfk_1           | classes               | class_id               |
| classes                        | created_by       | classes_ibfk_1                        | users                 | id                     |
| comments                       | chat_id          | comments_ibfk_2                       | chats                 | id                     |
| comments                       | teaching_id      | comments_ibfk_3                       | teachings             | id                     |
| full_membership_access         | user_id          | full_membership_access_ibfk_1         | users                 | id                     |
| full_membership_access_log     | user_id          | full_membership_access_log_ibfk_1     | users                 | id                     |
| full_membership_applications   | reviewed_by      | full_membership_applications_ibfk_2   | users                 | id                     |
| full_membership_applications   | user_id          | full_membership_applications_ibfk_1   | users                 | id                     |
| membership_review_history      | reviewer_id      | membership_review_history_ibfk_2      | users                 | id                     |
| membership_review_history      | user_id          | membership_review_history_ibfk_1      | users                 | id                     |
| surveylog                      | reviewed_by      | fk_surveylog_reviewed_by              | users                 | id                     |
| surveylog                      | reviewed_by      | surveylog_ibfk_1                      | users                 | id                     |
| user_class_memberships         | assigned_by      | user_class_memberships_ibfk_2         | users                 | id                     |
| user_class_memberships         | class_id         | user_class_memberships_ibfk_3         | classes               | class_id               |
| user_class_memberships         | user_id          | user_class_memberships_ibfk_1         | users                 | id                     |
| user_communication_preferences | user_id          | user_communication_preferences_ibfk_1 | users                 | id                     |
| user_profiles                  | user_id          | fk_user_profiles_user_id              | users                 | id                     |
| user_profiles                  | user_id          | user_profiles_ibfk_1                  | users                 | id                     |
| users                          | primary_class_id | users_ibfk_1                          | classes               | class_id               |
+--------------------------------+------------------+---------------------------------------+-----------------------+------------------------+
19 rows in set (0.063 sec)

MySQL [ikoota_db]> SELECT
    ->     TABLE_NAME,
    ->     TABLE_ROWS,
    ->     ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) AS "Size (MB)",
    ->     ENGINE
    -> FROM INFORMATION_SCHEMA.TABLES
    -> WHERE TABLE_SCHEMA = 'ikoota_db'
    ->     AND TABLE_TYPE = 'BASE TABLE'
    -> ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC;
+--------------------------------+------------+-----------+--------+
| TABLE_NAME                     | TABLE_ROWS | Size (MB) | ENGINE |
+--------------------------------+------------+-----------+--------+
| users                          |          3 |      0.16 | InnoDB |
| classes                        |          7 |      0.13 | InnoDB |
| surveylog                      |          3 |      0.13 | InnoDB |
| user_class_memberships         |          0 |      0.11 | InnoDB |
| full_membership_applications   |          0 |      0.11 | InnoDB |
| teachings                      |         15 |      0.09 | InnoDB |
| email_logs                     |          0 |      0.09 | InnoDB |
| sms_logs                       |          0 |      0.09 | InnoDB |
| sms_templates                  |          7 |      0.08 | InnoDB |
| email_templates                |         10 |      0.08 | InnoDB |
| membership_review_history      |          0 |      0.08 | InnoDB |
| bulk_email_logs                |          0 |      0.06 | InnoDB |
| user_communication_preferences |          3 |      0.06 | InnoDB |
| identity_masking_audit         |          1 |      0.06 | InnoDB |
| id_generation_log              |          1 |      0.06 | InnoDB |
| full_membership_access_log     |          0 |      0.06 | InnoDB |
| converse_relationships         |          0 |      0.06 | InnoDB |
| comments                       |         10 |      0.06 | InnoDB |
| class_content_access           |          0 |      0.06 | InnoDB |
| chats                          |         17 |      0.06 | InnoDB |
| bulk_sms_logs                  |          0 |      0.06 | InnoDB |
| reports                        |          0 |      0.05 | InnoDB |
| full_membership_access         |          0 |      0.05 | InnoDB |
| audit_logs                     |          0 |      0.05 | InnoDB |
| verification_codes             |          0 |      0.05 | InnoDB |
| user_chats                     |          0 |      0.03 | InnoDB |
| user_profiles                  |          0 |      0.03 | InnoDB |
| survey_questions               |          0 |      0.02 | InnoDB |
+--------------------------------+------------+-----------+--------+
28 rows in set (0.058 sec)

MySQL [ikoota_db]>


ikootaclient\node_modules
ikootaclient\public
ikootaclient\public\arrowDown.png
ikootaclient\public\arrowUp.png
ikootaclient\public\avatar.png
ikootaclient\public\bg.jpg
ikootaclient\public\camera.png
ikootaclient\public\download.png
ikootaclient\public\edit.png
ikootaclient\public\emoji.png
ikootaclient\public\favicon.png
ikootaclient\public\iko background4.png
ikootaclient\public\img.png
ikootaclient\public\info.png
ikootaclient\public\mic.png
ikootaclient\public\minus.png
ikootaclient\public\more.png
ikootaclient\public\palmTree.png
ikootaclient\public\palmTree2.png
ikootaclient\public\palmTree3.png
ikootaclient\public\phone.png
ikootaclient\public\plus.png
ikootaclient\public\public
ikootaclient\public\search.png
ikootaclient\public\sky.png
ikootaclient\public\theme.png
ikootaclient\public\video.png
ikootaclient\src
ikootaclient\src\assets
ikootaclient\src\assets\react.svg
ikootaclient\src\components
ikootaclient\src\components\admin
ikootaclient\src\components\admin\admin.css
ikootaclient\src\components\admin\Admin.jsx
ikootaclient\src\components\admin\Analytics.jsx
ikootaclient\src\components\admin\audienceclassmgr.css
ikootaclient\src\components\admin\AudienceClassMgr.jsx
ikootaclient\src\components\admin\converseId.css
ikootaclient\src\components\admin\Dashboard.jsx
ikootaclient\src\components\admin\KeyStats.jsx
ikootaclient\src\components\admin\navbar.css
ikootaclient\src\components\admin\Navbar.jsx
ikootaclient\src\components\admin\PendingReports.jsx
ikootaclient\src\components\admin\Reports.jsx
ikootaclient\src\components\admin\sidbar.css
ikootaclient\src\components\admin\Sidebar.jsx
ikootaclient\src\components\admin\userManagement.css
ikootaclient\src\components\admin\UserManagement.jsx
ikootaclient\src\components\auth
ikootaclient\src\components\auth\AdminRoute.jsx
ikootaclient\src\components\auth\applicationsurvey.css
ikootaclient\src\components\auth\Applicationsurvey.jsx
ikootaclient\src\components\auth\authControls.css
ikootaclient\src\components\auth\AuthControls.jsx
ikootaclient\src\components\auth\LandingPage.css
ikootaclient\src\components\auth\LandingPage.jsx
ikootaclient\src\components\auth\login.css
ikootaclient\src\components\auth\Login.jsx
ikootaclient\src\components\auth\LoginForm.jsx
ikootaclient\src\components\auth\NavigationWrapper.css
ikootaclient\src\components\auth\NavigationWrapper.jsx
ikootaclient\src\components\auth\passwordreset.css
ikootaclient\src\components\auth\Passwordreset.jsx
ikootaclient\src\components\auth\ProtectedRoute.jsx
ikootaclient\src\components\auth\signup.css
ikootaclient\src\components\auth\Signup.jsx
ikootaclient\src\components\auth\userManagement.css
ikootaclient\src\components\auth\UserManagement.jsx
ikootaclient\src\components\auth\UserStatus.jsx
ikootaclient\src\components\iko
ikootaclient\src\components\iko\chat.css
ikootaclient\src\components\iko\Chat.jsx
ikootaclient\src\components\iko\iko.css
ikootaclient\src\components\iko\Iko.jsx
ikootaclient\src\components\iko\ikocontrols.css
ikootaclient\src\components\iko\IkoControls.jsx
ikootaclient\src\components\iko\list.css
ikootaclient\src\components\iko\List.jsx
ikootaclient\src\components\iko\listchats.css
ikootaclient\src\components\iko\ListChats.jsx
ikootaclient\src\components\iko\listcomments.css
ikootaclient\src\components\iko\ListComments.jsx
ikootaclient\src\components\iko\MediaGallery.jsx
ikootaclient\src\components\iko\userinfo.css
ikootaclient\src\components\iko\Userinfo.jsx
ikootaclient\src\components\info
ikootaclient\src\components\info\applicationThankyou.css
ikootaclient\src\components\info\ApplicationThankYou.jsx
ikootaclient\src\components\info\approveverifyinfo.css
ikootaclient\src\components\info\Approveverifyinfo.jsx
ikootaclient\src\components\info\pendverifyinfo.css
ikootaclient\src\components\info\Pendverifyinfo.jsx
ikootaclient\src\components\info\surveySubmitted.css
ikootaclient\src\components\info\SurveySubmitted.jsx
ikootaclient\src\components\info\suspendedverifyinfo.css
ikootaclient\src\components\info\Suspendedverifyinfo.jsx
ikootaclient\src\components\info\Thankyou.jsx
ikootaclient\src\components\info\verifysurvey.css
ikootaclient\src\components\info\VerifySurvey.jsx
ikootaclient\src\components\membership
ikootaclient\src\components\membership\FullMembershipDeclined.jsx
ikootaclient\src\components\membership\FullMembershipInfo.jsx
ikootaclient\src\components\membership\FullMembershipSubmitted.jsx
ikootaclient\src\components\membership\FullMembershipSurvey.jsx
ikootaclient\src\components\search
ikootaclient\src\components\search\searchcontrols.css
ikootaclient\src\components\search\SearchControls.jsx
ikootaclient\src\components\service
ikootaclient\src\components\service\api.js
ikootaclient\src\components\service\commentServices.js
ikootaclient\src\components\service\idGenerationService.js
ikootaclient\src\components\service\surveypageservice.js
ikootaclient\src\components\service\useFetchChats.js
ikootaclient\src\components\service\useFetchComments.js
ikootaclient\src\components\service\useFetchTeachings.js
ikootaclient\src\components\towncrier
ikootaclient\src\components\towncrier\revTeaching.css
ikootaclient\src\components\towncrier\RevTeaching.jsx
ikootaclient\src\components\towncrier\revtopics.css
ikootaclient\src\components\towncrier\RevTopics.jsx
ikootaclient\src\components\towncrier\StepsForm.jsx
ikootaclient\src\components\towncrier\teaching.css
ikootaclient\src\components\towncrier\Teaching.jsx
ikootaclient\src\components\towncrier\towncrier.css
ikootaclient\src\components\towncrier\Towncrier.jsx
ikootaclient\src\components\towncrier\TowncrierControls.jsx
ikootaclient\src\components\user
ikootaclient\src\components\user\UserDashboard.jsx
ikootaclient\src\components\utils
ikootaclient\src\components\utils\apiDebugHelper.js
ikootaclient\src\components\utils\DebugWrapper.jsx
ikootaclient\src\components\utils\IdDisplay.jsx
ikootaclient\src\hooks
ikootaclient\src\hooks\useAuth.js
ikootaclient\src\hooks\useUpload.js
ikootaclient\src\hooks\useUploadCommentFiles.js
ikootaclient\src\App.css
ikootaclient\src\App.jsx
ikootaclient\src\dummyData.js
ikootaclient\src\main.jsx
ikootaclient\src\Test.jsx
ikootaclient\.env
ikootaclient\.gitignore
ikootaclient\eslint.config.js
ikootaclient\index.html
ikootaclient\package-lock.json
ikootaclient\package.json
ikootaclient\README.md
ikootaclient\vite.config.js




ikootaapi\config
ikootaapi\config\db.js
ikootaapi\config\ikoota_db.sql
ikootaapi\config\s3.js
ikootaapi\controllers
ikootaapi\controllers\adminControllers.js
ikootaapi\controllers\authControllers.js
ikootaapi\controllers\chatControllers.js
ikootaapi\controllers\classControllers.js
ikootaapi\controllers\commentControllers.js
ikootaapi\controllers\communicationControllers.js
ikootaapi\controllers\identityController.js
ikootaapi\controllers\membershipControllers.js
ikootaapi\controllers\surveyControllers.js
ikootaapi\controllers\teachingsControllers.js
ikootaapi\controllers\userControllers.js
ikootaapi\logs
ikootaapi\logs\app.log
ikootaapi\middlewares
ikootaapi\middlewares\auth.middleware.js
ikootaapi\middlewares\upload.middleware.js
ikootaapi\node_modules
ikootaapi\routes
ikootaapi\routes\adminRoutes.js
ikootaapi\routes\authRoutes.js
ikootaapi\routes\chatRoutes.js
ikootaapi\routes\classRoutes.js
ikootaapi\routes\commentRoutes.js
ikootaapi\routes\communicationRoutes.js
ikootaapi\routes\identityRoutes.js
ikootaapi\routes\index.js
ikootaapi\routes\membershipRoutes.js
ikootaapi\routes\surveyRoutes.js
ikootaapi\routes\teachingsRoutes.js
ikootaapi\routes\userRoutes.js
ikootaapi\services
ikootaapi\services\adminServices.js
ikootaapi\services\authServices.js
ikootaapi\services\chatServices.js
ikootaapi\services\classServices.js
ikootaapi\services\commentServices.js
ikootaapi\services\communicationServices.js
ikootaapi\services\identityMaskingService.js
ikootaapi\services\s3Service.js
ikootaapi\services\surveyServices.js
ikootaapi\services\teachingsServices.js
ikootaapi\services\userServices.js
ikootaapi\utils
ikootaapi\utils\CustomError.js
ikootaapi\utils\email.js
ikootaapi\utils\errorHandler.js
ikootaapi\utils\idGenerator.js
ikootaapi\utils\jwt.js
ikootaapi\utils\logger.js
ikootaapi\utils\notifications.js
ikootaapi\utils\responseHandler.js
ikootaapi\utils\sms.js
ikootaapi\.env
ikootaapi\.gitignore
ikootaapi\app.js
ikootaapi\package-lock.json
ikootaapi\package.json
ikootaapi\server.js
ikootaapi\socket.js
ikootaapi\testDBConnection.js