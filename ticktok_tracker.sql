-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 17, 2025 at 01:54 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ticktok_tracker`
--

-- --------------------------------------------------------

--
-- Table structure for table `ticktok_music`
--

CREATE TABLE `ticktok_music` (
  `music_id` bigint(20) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `artist` varchar(255) DEFAULT NULL,
  `duration_ms` int(11) DEFAULT NULL,
  `original_sound` tinyint(1) DEFAULT 0,
  `usage_count` bigint(20) DEFAULT 0,
  `trending_score` decimal(10,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ticktok_users`
--

CREATE TABLE `ticktok_users` (
  `user_id` bigint(20) NOT NULL,
  `username` varchar(50) NOT NULL,
  `display_name` varchar(100) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `follower_count` bigint(20) DEFAULT 0,
  `following_count` bigint(20) DEFAULT 0,
  `likes_count` bigint(20) DEFAULT 0,
  `video_count` int(11) DEFAULT 0,
  `verified` tinyint(1) DEFAULT 0,
  `private_account` tinyint(1) DEFAULT 0,
  `profile_image_url` text DEFAULT NULL,
  `external_links` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`external_links`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_scraped` timestamp NOT NULL DEFAULT current_timestamp(),
  `sec_uid` text NOT NULL,
  `created_date` date NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ticktok_users`
--

INSERT INTO `ticktok_users` (`user_id`, `username`, `display_name`, `bio`, `follower_count`, `following_count`, `likes_count`, `video_count`, `verified`, `private_account`, `profile_image_url`, `external_links`, `created_at`, `updated_at`, `last_scraped`, `sec_uid`, `created_date`) VALUES
(6818091683918382086, 'righttouchfashionacademy', 'right_touch _fashion_academy', 'WhatsApp number 08164396911', 207010, 299, 2058203, 978, 0, 0, 'https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/a1a0ba5a0625d5575f631ed384657020~tplv-tiktokx-cropcenter:720:720.jpeg?dr=14579&refresh_token=4baa0905&x-expires=1755442800&x-signature=PPgeTSFH4M5R4Igp0f2BrzakNZw%3D&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=81f88b70&idc=maliva', NULL, '2025-08-15 15:04:29', '2025-08-15 15:04:29', '2025-08-15 15:07:33', 'MS4wLjABAAAABDB-mtWkylp4_wd0UZWbhxd8b2lUhaNNh4STDdDH6mnwfOEQLaU2HWXRinPttKWc', '0000-00-00'),
(7501666319475000325, 'lovablequeen50', 'lovablequeen', 'rose tranvan fan page 🌹❤️\n     2KCHKL', 287050, 23, 934899, 140, 0, 0, 'https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/d271eed6595da93666e4811cbdbcaeaf~tplv-tiktokx-cropcenter:720:720.jpeg?dr=14579&refresh_token=796a8106&x-expires=1755442800&x-signature=pyZQy%2BqiWELskHqxeJzwHqPkdAY%3D&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=81f88b70&idc=maliva', NULL, '2025-08-15 15:04:28', '2025-08-15 15:04:28', '2025-08-15 15:07:36', 'MS4wLjABAAAAFMqktVQN3ndfM_LlVPzzCEA2RRyjyhj8a0kDBmY5CWL45JmPdSqtyP-BGhKVaFda', '0000-00-00');

-- --------------------------------------------------------

--
-- Table structure for table `ticktok_user_analytics`
--

CREATE TABLE `ticktok_user_analytics` (
  `id` bigint(20) NOT NULL,
  `ticktok_user_id` bigint(20) DEFAULT NULL,
  `follower_count` bigint(20) DEFAULT NULL,
  `following_count` bigint(20) DEFAULT NULL,
  `total_likes` bigint(20) DEFAULT NULL,
  `video_count` int(11) DEFAULT NULL,
  `recorded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ticktok_user_analytics`
--

INSERT INTO `ticktok_user_analytics` (`id`, `ticktok_user_id`, `follower_count`, `following_count`, `total_likes`, `video_count`, `recorded_at`) VALUES
(1, 7501666319475000325, 287036, 23, 934840, 140, '2025-08-15 15:04:28'),
(2, 6818091683918382086, 207007, 299, 2058147, 978, '2025-08-15 15:04:29');

-- --------------------------------------------------------

--
-- Table structure for table `ticktok_videos`
--

CREATE TABLE `ticktok_videos` (
  `video_id` bigint(20) NOT NULL,
  `ticktok_user_id` bigint(20) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `view_count` bigint(20) DEFAULT 0,
  `like_count` bigint(20) DEFAULT 0,
  `comment_count` int(11) DEFAULT 0,
  `share_count` int(11) DEFAULT 0,
  `duration_ms` int(11) DEFAULT NULL,
  `video_url` text DEFAULT NULL,
  `cover_image_url` text DEFAULT NULL,
  `music_id` bigint(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `scraped_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `ticktok_music`
--
ALTER TABLE `ticktok_music`
  ADD PRIMARY KEY (`music_id`),
  ADD KEY `idx_usage_count` (`usage_count`),
  ADD KEY `idx_trending_score` (`trending_score`);

--
-- Indexes for table `ticktok_users`
--
ALTER TABLE `ticktok_users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_username` (`username`),
  ADD KEY `idx_follower_count` (`follower_count`),
  ADD KEY `idx_last_scraped` (`last_scraped`);

--
-- Indexes for table `ticktok_user_analytics`
--
ALTER TABLE `ticktok_user_analytics`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_recorded` (`ticktok_user_id`,`recorded_at`);

--
-- Indexes for table `ticktok_videos`
--
ALTER TABLE `ticktok_videos`
  ADD PRIMARY KEY (`video_id`),
  ADD KEY `music_id` (`music_id`),
  ADD KEY `idx_user_id` (`ticktok_user_id`),
  ADD KEY `idx_view_count` (`view_count`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_engagement` (`like_count`,`comment_count`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `ticktok_user_analytics`
--
ALTER TABLE `ticktok_user_analytics`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `ticktok_user_analytics`
--
ALTER TABLE `ticktok_user_analytics`
  ADD CONSTRAINT `ticktok_user_analytics_ibfk_1` FOREIGN KEY (`ticktok_user_id`) REFERENCES `ticktok_users` (`user_id`);

--
-- Constraints for table `ticktok_videos`
--
ALTER TABLE `ticktok_videos`
  ADD CONSTRAINT `ticktok_videos_ibfk_1` FOREIGN KEY (`ticktok_user_id`) REFERENCES `ticktok_users` (`user_id`),
  ADD CONSTRAINT `ticktok_videos_ibfk_2` FOREIGN KEY (`music_id`) REFERENCES `ticktok_music` (`music_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
