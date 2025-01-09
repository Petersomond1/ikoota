-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: ikootadb.cvugpfnl4vcp.us-east-1.rds.amazonaws.com
-- Generation Time: Jan 07, 2025 at 11:55 PM
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
  `id` varchar(36) NOT NULL,
  `is_group` tinyint(1) DEFAULT '0',
  `title` varchar(255) DEFAULT NULL,
  `created_by` varchar(36) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `classes`
--

CREATE TABLE `classes` (
  `id` int NOT NULL,
  `name` varchar(6) NOT NULL,
  `description` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `comments`
--

CREATE TABLE `comments` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `message_id` int NOT NULL,
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
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int NOT NULL,
  `chat_id` varchar(36) NOT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `class_id` int DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
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
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `converse_id` char(6) DEFAULT NULL,
  `mentor_id` char(6) DEFAULT NULL,
  `class_id` int DEFAULT NULL,
  `is_member` enum('applied','granted','declined') DEFAULT 'applied',
  `role` enum('super_admin','admin','user') DEFAULT 'user',
  `isblocked` json DEFAULT NULL,
  `isbanned` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `phone`, `avatar`, `password_hash`, `converse_id`, `mentor_id`, `class_id`, `is_member`, `role`, `isblocked`, `isbanned`, `created_at`, `updated_at`) VALUES
(1, 'abc', 'abc@abc.com', '1234', NULL, '$2b$10$H6fjXoIqCC79PYlQzsgkLOjxgZh1EFRZfr79ISvFDeTBDcdRes2AK', NULL, NULL, NULL, 'applied', 'user', NULL, 0, '2025-01-07 06:06:41', '2025-01-07 06:14:01'),
(2, 'pet', 'petersomond@gmail.com', '123456', NULL, '$2b$10$fUOHFXtTWxRaky0kJ0h5zuxTrBaJbjUpc0MncBcBzbudxaHSlURk6', NULL, NULL, NULL, 'granted', 'super_admin', NULL, 0, '2025-01-07 06:08:01', '2025-01-07 06:14:14'),
(3, 'yahoomond', 'peters_o_mond@yahoo.com', '54321', NULL, '$2b$10$yRQW/vsAzFOj/NV1KpV7/eSTzpt1caaEtr9BGk/5W84KB5CsbX7/a', NULL, NULL, NULL, 'granted', 'admin', NULL, 0, '2025-01-07 06:09:31', '2025-01-07 06:14:24');

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

-- Table structure for table `teachings`


CREATE TABLE teachings (
  id INT AUTO_INCREMENT PRIMARY KEY, -- Unique identifier for each teaching
  topic VARCHAR(255) NOT NULL, -- The Topic of the teaching
  description TEXT, -- The Description of the teaching
  lessonNumber VARCHAR(50) NOT NULL, -- The Unique lesson number
  subjectMatter VARCHAR(255), -- The Subject matter of the teaching
  audience VARCHAR(255), -- The Target audience for the teaching (e.g., class_id)
  content TEXT, -- The Content including text, emojis, URLs
  media_url1 VARCHAR(255) DEFAULT NULL, -- URL for the first media file
  media_type1 ENUM('image', 'video', 'audio', 'file') DEFAULT NULL, -- Type of the first media
  media_url2 VARCHAR(255) DEFAULT NULL, -- URL for the second media file
  media_type2 ENUM('image', 'video', 'audio', 'file') DEFAULT NULL, -- Type of the second media
  media_url3 VARCHAR(255) DEFAULT NULL, -- URL for the third media file
  media_type3 ENUM('image', 'video', 'audio', 'file') DEFAULT NULL, -- Type of the third media
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Date the teaching was created
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- Date the teaching was last updated
);


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
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `message_id` (`message_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`);

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
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `converse_id` (`converse_id`),
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
-- AUTO_INCREMENT for table `classes`
--
ALTER TABLE `classes`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `comments`
--
ALTER TABLE `comments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
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
  ADD CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
