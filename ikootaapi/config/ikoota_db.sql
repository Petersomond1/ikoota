-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: ikootadb.cvugpfnl4vcp.us-east-1.rds.amazonaws.com
-- Generation Time: Jan 25, 2025 at 06:57 AM
-- Server version: 8.0.39
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ikoota_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int NOT NULL,
  `admin_id` varchar(36) NOT NULL,
  `action` varchar(255) NOT NULL,
  `target_id` varchar(36) DEFAULT NULL,
  `details` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chats`
--

CREATE TABLE `chats` (
  `id` int NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `created_by` varchar(36) DEFAULT NULL,
  `audience` varchar(36) DEFAULT NULL,
  `summary` text,
  `text` text NOT NULL,
  `approval_status` enum('pending','approved','rejected') DEFAULT 'pending',
  `media_url1` varchar(255) DEFAULT NULL,
  `media_type1` enum('image','video','audio','file') DEFAULT NULL,
  `media_url2` varchar(255) DEFAULT NULL,
  `media_type2` enum('image','video','audio','file') DEFAULT NULL,
  `media_url3` varchar(255) DEFAULT NULL,
  `media_type3` enum('image','video','audio','file') DEFAULT NULL,
  `is_flagged` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `classes`
--

CREATE TABLE `classes` (
  `class_id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `classes`
--

INSERT INTO `classes` (`class_id`, `name`, `description`, `created_at`, `updated_at`) VALUES
('59QGJ9', 'Ika', 'Indigene of Ika', '2025-01-12 05:37:54', '2025-01-12 05:37:54'),
('J9L1A7', 'Igbanke-33', 'Indigene of Igbanke-33', '2025-01-12 05:37:13', '2025-01-12 05:37:13'),
('XMZHFH', 'Ottah', 'Indigene of Ottah', '2025-01-11 07:21:28', '2025-01-11 07:21:28');

-- --------------------------------------------------------

--
-- Table structure for table `comments`
--

CREATE TABLE `comments` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `chat_id` int NOT NULL,
  `comment` text NOT NULL,
  `media_url1` varchar(255) DEFAULT NULL,
  `media_type1` enum('image','video','audio','file') DEFAULT NULL,
  `media_url2` varchar(255) DEFAULT NULL,
  `media_type2` enum('image','video','audio','file') DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `id` int NOT NULL,
  `reporter_id` varchar(36) NOT NULL,
  `reported_id` varchar(36) DEFAULT NULL,
  `reason` text NOT NULL,
  `status` enum('pending','reviewed','resolved') DEFAULT 'pending',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `surveylog`
--

CREATE TABLE `surveylog` (
  `id` int NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `answers` text,
  `verified_by` varchar(36) NOT NULL,
  `rating_remarks` varchar(255) NOT NULL,
  `approval_status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `surveylog`
--

INSERT INTO `surveylog` (`id`, `user_id`, `answers`, `verified_by`, `rating_remarks`, `approval_status`, `created_at`) VALUES
(1, '1', '[\"sasa\",\"gfg\",\"ererre\",\"uyuyu\",\"vcvvc\"]', '', '', 'pending', '2025-01-07 06:06:56'),
(2, '2', '[\"oloill\",\"yujyujty\",\"yjutyhtrtrh\",\"jjyhrhtsgaeff\",\"gfrgrfewerewr\"]', '', '', 'pending', '2025-01-07 06:08:15'),
(3, '3', '[\"trfrrf\",\"988989\",\"zxxx\",\"iuiuyu\",\"2123ewds\"]', '', '', 'pending', '2025-01-07 06:09:46');

-- --------------------------------------------------------

--
-- Table structure for table `survey_questions`
--

CREATE TABLE `survey_questions` (
  `id` int NOT NULL,
  `question` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `teachings`
--

CREATE TABLE `teachings` (
  `id` int NOT NULL,
  `topic` varchar(255) NOT NULL,
  `description` text,
  `lessonNumber` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `subjectMatter` varchar(255) DEFAULT NULL,
  `audience` varchar(255) DEFAULT NULL,
  `content` text,
  `media_url1` varchar(255) DEFAULT NULL,
  `media_type1` enum('image','video','audio','file') DEFAULT NULL,
  `media_url2` varchar(255) DEFAULT NULL,
  `media_type2` enum('image','video','audio','file') DEFAULT NULL,
  `media_url3` varchar(255) DEFAULT NULL,
  `media_type3` enum('image','video','audio','file') DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `teachings`
--

INSERT INTO `teachings` (`id`, `topic`, `description`, `lessonNumber`, `subjectMatter`, `audience`, `content`, `media_url1`, `media_type1`, `media_url2`, `media_type2`, `media_url3`, `media_type3`, `createdAt`, `updatedAt`) VALUES
(1, '', NULL, '1-1736971117185', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-01-15 19:58:37', '2025-01-15 19:58:37'),
(2, '', NULL, '2-1736971160796', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-01-15 19:59:21', '2025-01-15 19:59:21'),
(3, '', NULL, '3-1736971232196', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-01-15 20:00:32', '2025-01-15 20:00:32'),
(4, '', NULL, '4-1736971452973', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-01-15 20:04:13', '2025-01-15 20:04:13'),
(5, '', NULL, '5-1736973093498', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-01-15 20:31:33', '2025-01-15 20:31:33'),
(6, 'one', 'two', '0-1737461681', 'three', 'four', 'five', NULL, 'image', NULL, NULL, NULL, NULL, '2025-01-21 12:14:41', '2025-01-21 12:14:41'),
(7, 'one ', 'tw', '0-1737635354', 'threw', 'foure', 'khh   bkbhik   kbikb  ', 'https://ikoota.s3.us-east-1.amazonaws.com/9e6ee1ab-86e2-4686-a3bc-875153f0fa8e-earth.png', 'image', NULL, NULL, NULL, NULL, '2025-01-23 12:29:14', '2025-01-23 12:29:14'),
(8, 'h', 'hjg', '0-1737635603', 'hj', 'hj', 'hgjhj', 'https://ikoota.s3.us-east-1.amazonaws.com/60f02191-a824-4be3-bd97-25ff9f38376e-aerbio was our name west africa.png', 'image', 'https://ikoota.s3.us-east-1.amazonaws.com/019c579b-a007-44e3-aaa1-a8037cc41147-Banana Bunch.jpg', 'image', NULL, NULL, '2025-01-23 12:33:23', '2025-01-23 12:33:23'),
(9, 'first', 'secon', '0-1737642438', 'thri', 'fout', 'k\'lk,lk kn[ij[ ;oihj ;kjnoi ;kh[oih auy0 api] ig76r9 \'lmk[oyt0 ;npiuy0a lbp78  mhphion[oi \r\nbb;uhpiihn jhpihn piuhoi iuhoi puhpiuh ;kjhpiu ;kuhpiu ;kuhpiuh kjbp ', 'https://ikoota.s3.us-east-1.amazonaws.com/d05ac071-9977-4246-a2e2-235cf44015f5-aerbio was our name west africa.png', 'image', NULL, NULL, NULL, NULL, '2025-01-23 14:27:18', '2025-01-23 14:27:18'),
(10, 'qwer', 'asdfg', '0-1737642737', 'zxcvbb', 'bnmklou n', 'After this the chairman informed us that we should all do all possible to make the meeting of today to be very brief, as he intends that we\'ll hold the meeting in a low key and enjoy ourselves since we are not going to have an end of the year Xmas party. And  Mr Emefiele however added reminding him that we actually have something to discuss as today being the last meeting for the year when we’re supposed to discuss all that happened through the year. This the chairman agreed as he assured us that he is aware that we would need to  discuss all that happened through this year but in utmost brevity.\r\nMembership Excuses for Absence. The following members sent in their excuses and notifications for their absence. Mr. and Mrs. George Imarhia, and Mr & Mrs Amos Omobude; our vice chairman, Dr and Dr (Mrs). Osayi, F (our national chairman), Mr. Stanley Ejeme, Mr. Rotimi Adekeji and Mr. Clement Ighodaro. \r\nAgenda 3. The chairman Mr. Imarhia, appreciated us all for attending this special meeting and used the opportunity to once again appreciate all past leaders and founders of the meeting for the efforts they have put in in building this enviable union that we have today and wish to use the occasion to assured them again that he will do all to the best of his abilities, to keep their aim and flag flying high. \r\nMatters arising from the Read minutes.\r\nThe chairman called for members to up their game in the payment of their  dues especially that of the national dues as it has now been observed that other chapters are leading us in the payment for national dues.  He specifically stated that Houston chapter is now beating us in the payment of national due and appeal that individual should find time to check the spreadsheet which is always communicated to us through the whatsapp chat to check if we are up to date, or hence pay up if we aren’t so that we once again become the leading chapter as we’ve always been in the payment of our national dues for the past years.\r\n', 'https://ikoota.s3.us-east-1.amazonaws.com/c9c217a7-943f-4721-9708-5711b8b60511-Bounty Quick Size Paper Towels.jpg', 'image', NULL, NULL, NULL, NULL, '2025-01-23 14:32:17', '2025-01-23 14:32:17'),
(11, 'eeee', 'dddd', '0-1737662256', 'fgbb', 'ghgy', 'hhyh', 'https://ikoota.s3.us-east-1.amazonaws.com/2f729d97-4987-4055-a43a-69f7a1e16aa1-bigimage3.jpg', 'image', 'https://ikoota.s3.us-east-1.amazonaws.com/9ba6ab47-72b6-4cf5-bf99-976e26ffb3e8-A People\'s History of the United States.webm', 'video', 'https://ikoota.s3.us-east-1.amazonaws.com/796683e7-c3a5-43fe-8267-41bad12659bb-JEHOVIAH SONG.m4a', 'audio', '2025-01-23 19:57:36', '2025-01-23 19:57:36'),
(12, 'abc', 'def', '0-1737751998', 'ghi', 'jkl', 'mno', 'https://ikoota.s3.us-east-1.amazonaws.com/2e7d6da3-60ee-4914-ae8a-a6f24b4c3b1e-Amazon ping logo3.png', 'image', 'https://ikoota.s3.us-east-1.amazonaws.com/38d86f6e-8896-439e-87a8-068cf1c22a64-JEHOVIAH SONG.m4a', 'audio', 'https://ikoota.s3.us-east-1.amazonaws.com/29a87881-0dae-40e3-8004-ac89bde15d97-designer dresses for spring.webm', 'video', '2025-01-24 20:53:18', '2025-01-24 20:53:18'),
(13, 'abc', 'def', '0-1737752030', 'ghi', 'jkl', 'mno', 'https://ikoota.s3.us-east-1.amazonaws.com/d5a98ffe-cf56-4a1b-a81c-8c2de06da31d-Amazon ping logo3.png', 'image', 'https://ikoota.s3.us-east-1.amazonaws.com/44bf25c6-ae6a-4d38-9f01-efbd7fab3209-JEHOVIAH SONG.m4a', 'audio', 'https://ikoota.s3.us-east-1.amazonaws.com/8995a964-1fca-42ea-8c98-b14877c69c29-designer dresses for spring.webm', 'video', '2025-01-24 20:53:50', '2025-01-24 20:53:50'),
(14, 'eze goes to school', 'the story of a young Afrikan boy from the Igbo tribe attending school', '0-1737753674', 'English language', 'agh23n', 'national level dues, though Ejeme claimed that there are an other official already positioned to do that for the national level amongst us.\r\nAnnouncement and Discussion on the bereavement of the Ighodaro\'s family and the need to visit urgently. The meeting officially received the news of the passing to glory of our members’ beloved mother Mrs Ighodaro; mother to our Mr. Clement Ighodaro that happened back at home in Nigeria and discussion was opened on need to visit Mr. Clement and know more on the arrangements about the interment and how the union can be available to render usual assistances. Members that have been able to reach him through phone informed the union of the little they then know about the arrangement on ground. The chairman personally said he had called him and asked him if there are any specific urgent thing he wants us to help him out with and that he replied that he will let us know in due time. And more discussions were taken and a phone call was also put to him where the chairman ascertained his availability, and at the end of much discussion on it, our chairman constituted members that will pay a visit to Mr. Clement Ighodaro so as to pass our message of condolences to his family and get a better information on what plans is on ground. The following memebers; Chairman; Mr Imarhia, (Mr. Emeifele, R), Mr. Monday Peters, (Mr Stanley Ejeme) and Mr. Ejeme David, were constituted to pay a visit to Mr. Clement the next day by 2:00 PM.  The chairman at the end of it all called for members to also take out time from their busy schedule to visit or always call him and be close to him during this challenging period of their bereavement for the loose of a mother is such a very difficult time.\r\nNational Update: On the national update, our chairman appealed to us all to always make out time to join the conference call which is the general meeting for the national level so that we will have a first hand knowledge of what is happening at the national union, and be able to ask our questions on the ongoing projects.\r\nFinancial update: On the financial update, our secretary Mr. David Ejeme, informed us that as at that day; November 16, 2024, the financial statement or account of the union stands at $7,568.08, and members happily clapped at the information.\r\nGeneral Agenda Continue: the secretary Mr. Monday Peters informed the union of his recent observation of our female members not always sitting among us in the general meeting but always sitting as another group at the corners of the meeting and hence is appealing that we should all be seated together as one body of a union so that our children that are observing us will not in future take it again as a tradition which they would mis-interpret as leaving out our great womanhood to the background of things in our Afrikan society.\r\n', 'https://ikoota.s3.us-east-1.amazonaws.com/7b11f677-2cc2-4897-9128-3def5ebf70f2-caps hats africa native hides skins 002.PNG', 'image', 'https://ikoota.s3.us-east-1.amazonaws.com/389b7594-2022-4967-8038-7b3176dd76c5-Voice 002 rebuilding altar.m4a', 'audio', 'https://ikoota.s3.us-east-1.amazonaws.com/a89ee803-a40d-4947-b46b-e656385bb47a-Backend of Ama Ecom prjt2 from ousamma 16mins.webm', 'video', '2025-01-24 21:21:14', '2025-01-24 21:21:14');

--
-- Triggers `teachings`
--
DELIMITER $$
CREATE TRIGGER `before_insert_teachings` BEFORE INSERT ON `teachings` FOR EACH ROW BEGIN
    SET NEW.lessonNumber = CONCAT(NEW.id, '-', UNIX_TIMESTAMP());
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `username` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `phone` varchar(15) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `avatar` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `converse_id` char(6) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `mentor_id` char(6) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `class_id` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `is_member` enum('applied','granted','declined') COLLATE utf8mb4_general_ci DEFAULT 'applied',
  `role` enum('super_admin','admin','user') COLLATE utf8mb4_general_ci DEFAULT 'user',
  `isblocked` json DEFAULT NULL,
  `isbanned` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `resetToken` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `resetTokenExpiry` bigint DEFAULT NULL,
  `verificationCode` varchar(10) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `codeExpiry` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `phone`, `avatar`, `password_hash`, `converse_id`, `mentor_id`, `class_id`, `is_member`, `role`, `isblocked`, `isbanned`, `created_at`, `updated_at`, `resetToken`, `resetTokenExpiry`, `verificationCode`, `codeExpiry`) VALUES
(1, 'abc', 'abc@abc.com', '1234', NULL, '$2b$10$H6fjXoIqCC79PYlQzsgkLOjxgZh1EFRZfr79ISvFDeTBDcdRes2AK', NULL, NULL, NULL, 'applied', 'user', NULL, 0, '2025-01-07 06:06:41', '2025-01-07 06:14:01', NULL, NULL, NULL, NULL),
(2, 'pet', 'petersomond@gmail.com', '123456', NULL, '$2b$10$fUOHFXtTWxRaky0kJ0h5zuxTrBaJbjUpc0MncBcBzbudxaHSlURk6', NULL, NULL, NULL, 'granted', 'super_admin', NULL, 0, '2025-01-07 06:08:01', '2025-01-07 06:14:14', NULL, NULL, NULL, NULL),
(3, 'yahoomond', 'peters_o_mond@yahoo.com', '54321', NULL, '$2b$10$yRQW/vsAzFOj/NV1KpV7/eSTzpt1caaEtr9BGk/5W84KB5CsbX7/a', NULL, NULL, NULL, 'granted', 'admin', NULL, 0, '2025-01-07 06:09:31', '2025-01-07 06:14:24', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_chats`
--

CREATE TABLE `user_chats` (
  `id` int NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `chat_id` varchar(36) NOT NULL,
  `last_message` varchar(255) DEFAULT NULL,
  `is_seen` tinyint(1) DEFAULT '0',
  `role` enum('admin','member','owner') NOT NULL,
  `is_muted` tinyint(1) DEFAULT '0',
  `last_read_message_id` varchar(36) DEFAULT NULL,
  `joined_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `chats`
--
ALTER TABLE `chats`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `classes`
--
ALTER TABLE `classes`
  ADD PRIMARY KEY (`class_id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `message_id` (`chat_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `surveylog`
--
ALTER TABLE `surveylog`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `survey_questions`
--
ALTER TABLE `survey_questions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `teachings`
--
ALTER TABLE `teachings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD KEY `class_id` (`class_id`);

--
-- Indexes for table `user_chats`
--
ALTER TABLE `user_chats`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chats`
--
ALTER TABLE `chats`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `comments`
--
ALTER TABLE `comments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reports`
--
ALTER TABLE `reports`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `surveylog`
--
ALTER TABLE `surveylog`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `survey_questions`
--
ALTER TABLE `survey_questions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `teachings`
--
ALTER TABLE `teachings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `user_chats`
--
ALTER TABLE `user_chats`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `comments`
--
ALTER TABLE `comments`
  ADD CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`chat_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `classes` (`class_id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
