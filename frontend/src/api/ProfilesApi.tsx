import { useState } from "react";
import { useSelector } from "react-redux";
import { useLogoutUser } from "../appwrite/auth/AuthApi";
import { showToast } from "../Components/Common/Toast";
import toast from "react-hot-toast";
import type { RegisterUser } from "../types/auth";
import axiosPriviate from "./axios";

export const useTestAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const jwtToken = useSelector((state: any) => state.auth.jwtToken);

  const testAuth = async () => {
    // return
    try {
      setIsLoading(true);
      const response = await axiosPriviate.get(
        `/profiles/test/exists?username=espn`,
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );
      console.log("Teste response:", response);
      if (response.data.success) {
        setIsAuthenticated(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { isAuthenticated, isLoading, testAuth };
};

export const useTestTiktokProfile = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const testTiktokProfile = async (userName: string) => {
    // return
    try {
      setIsLoading(true);
      const response = await axiosPriviate.get(
        `/profiles/test/exists?username=${userName}`
      );
      if (response.data.success) {
        return response.data.data; // Assuming the data contains the profile information
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, testTiktokProfile };
};

export const useRegisterUserToSystem = () => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const registerUser = async (registerData: RegisterUser) => {
    try {
      setIsLoading(true);

      const [firstName, ...rest] = registerData.user.name.trim().split(" ");
      const lastName = rest.length > 0 ? rest.join(" ") : "";

      const response = await axiosPriviate.post(`/auth/register`, {
        oauth2User: {
          ...registerData.user,
          firstName,
          lastName,
          appwrite_id: registerData.user.$id,
        },
      });
      if (response.data.success) {
        setIsRegistered(true);
        return true;
      } else {
        return false;
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { isRegistered, isLoading, registerUser };
};

export const useApiLogoutUser = () => {
  const { logOutuser: localLogoutUser } = useLogoutUser();
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const logoutUser = async () => {
    try {
      setIsLoading(true);
      const response = await axiosPriviate.post(`/auth/logout`);
      if (response.data.success) {
        localLogoutUser();
        setIsLoggedOut(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoggedOut, isLoading, logoutUser };
};

export const useAddUserTrackedProfile = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const addUserTrackedProfile = async (profileData: any) => {
    try {
      let loadingToast = showToast({
        loading: true,
        type: "info",
        title: "Adding profile...",
        message: `Adding @${profileData.tiktokProfileToTrack.username} to your tracked profiles`,
      });
      setIsLoading(true);
      let res = await axiosPriviate.post(`/profiles/add`, profileData);
      toast.dismiss(loadingToast);
      showToast({
        type: "success",
        title: "Profile added!",
        message: `You are now tracking @${profileData.tiktokProfileToTrack.username}`,
      });
      return res.data;
    } catch (e: any) {
      toast.dismiss();
      let error = e.response.data;
      console.error("Error adding tracked profile:", error);
      showToast({
        type: "danger",
        title: "An error occurred",
        message: `${error.message || "Unable to add profile."}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, addUserTrackedProfile };
};

export const useGetTrackedProfiles = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const getTrackedProfiles = async () => {
    try {
      setIsLoading(true);
      let res = await axiosPriviate.get(`/profiles/tracked`);
      return res.data;
    } catch (e: any) {
      let error = e.response.data;
      console.error("Error getting tracked profiles:", error);
      showToast({
        type: "danger",
        title: "An error occurred",
        message: `${error.message || "Unable to get tracked profiles."}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, getTrackedProfiles };
};
