CREATE DATABASE IF NOT EXISTS tiktok_tracker;
USE tiktok_tracker;

-- TikTok users
CREATE TABLE ticktok_users (
    user_id BIGINT PRIMARY KEY,                  -- TikTok unique user ID
    username VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255),
    bio TEXT,
    follower_count INT DEFAULT 0,
    following_count INT DEFAULT 0,
    likes_count INT DEFAULT 0,
    video_count INT DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    private_account BOOLEAN DEFAULT FALSE,
    profile_image_url VARCHAR(500),
    last_scraped DATETIME,
    sec_uid VARCHAR(255),                        -- secondary TikTok UID
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User analytics snapshots
CREATE TABLE ticktok_user_analytics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ticktok_user_id BIGINT NOT NULL,
    follower_count INT DEFAULT 0,
    following_count INT DEFAULT 0,
    total_likes INT DEFAULT 0,
    video_count INT DEFAULT 0,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticktok_user_id) REFERENCES ticktok_users(user_id)
);

-- TikTok tags
CREATE TABLE tiktok_tags (
    tag_id BIGINT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT
);

-- TikTok music
CREATE TABLE ticktok_music (
    music_id BIGINT PRIMARY KEY,
    title VARCHAR(255),
    artist VARCHAR(255),
    duration_ms INT,
    original_sound BOOLEAN DEFAULT FALSE,
    usage_count INT DEFAULT 0,
    trending_score DECIMAL(10,2) DEFAULT 0.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- TikTok videos
CREATE TABLE ticktok_videos (
    video_id BIGINT PRIMARY KEY,
    ticktok_user_id BIGINT NOT NULL,
    description TEXT,
    view_count BIGINT DEFAULT 0,
    like_count BIGINT DEFAULT 0,
    comment_count BIGINT DEFAULT 0,
    share_count BIGINT DEFAULT 0,
    duration_ms INT,
    video_url VARCHAR(500),
    cover_image_url VARCHAR(500),
    music_id BIGINT,
    tags TEXT,  -- could normalize to a join table, but keeping as text here
    created_at DATETIME,
    scraped_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (ticktok_user_id) REFERENCES ticktok_users(user_id),
    FOREIGN KEY (music_id) REFERENCES ticktok_music(music_id)
);

-- TikTok video analytics snapshots
CREATE TABLE tiktok_videos_analytics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    video_id BIGINT NOT NULL,
    view_count BIGINT DEFAULT 0,
    like_count BIGINT DEFAULT 0,
    comment_count BIGINT DEFAULT 0,
    share_count BIGINT DEFAULT 0,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (video_id) REFERENCES ticktok_videos(video_id)
);


-- Speed up lookups of all analytics for a video
CREATE INDEX idx_video_id ON tiktok_videos_analytics(video_id);

-- Speed up time-range queries for growth comparisons
CREATE INDEX idx_video_time ON tiktok_videos_analytics(video_id, recorded_at);
