export type UserTrackedProfile = {
  user_id: string;
  username: string;
  previous_followers_count: number;
  followers_count: number;
  likes_count: number;
  previous_likes_count: number;
  video_count: number;
  previous_video_count: number;
  display_name: string;
  profile_image_url: string;
  private_account: boolean;
  verified: boolean;
  following_count: number;
  last_scraped: number;
};

export type SearchedTikTokProfileType = {
  userMeta: {
    createTime: number;
    id: string;
    uniqueId: string;
    displayName: string;
    secUid: string;
    verified: boolean;
  };
  statsV2: {
    followerCount: number;
    followingCount: number;
    heartCount: number;
    videoCount: number;
  };
  avatars: {
    avatarMedium: string;
  };
  shareMeta:{
    desc:string
  }
};
