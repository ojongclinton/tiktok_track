export type RegisterUser = {
  user: AppwriteUser;
  jwtToken: string;
};

export type AppwriteUser = {
  $id: string;
  name: string;
};

export type TikTokUser = {
  id: string;
};
