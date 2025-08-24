import User from "../models/User.js";
import { appWriteStorage } from "./appwrite.js";

export const getUserIdByAppWriteId = async (appwriteId) => {
  let foundUser = await User.findOne({
    where: {
      appwrite_user_id: appwriteId,
    },
  });

  if (foundUser) {
    return foundUser.id;
  }
  return null;
};

export const fetchAnduploadProfileImageToAppWrite = async (
  imageUrl,
  username
) => {
  try {
    // Fetch the image from TikTok URL
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error("Failed to fetch image");

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a Blob/File-like object
    const file = new File([buffer], `${username}_profile.jpg`, {
      type: "image/jpeg",
    });

    // Upload to Appwrite
    const uploadedFile = await appWriteStorage.createFile(
      "68aa397a0006a5842781",
      "unique()",
      file,
    );

    return uploadedFile; // This has the file ID, name, etc.
  } catch (err) {
    console.error("Error uploading profile image:", err);
    return null;
  }
};
