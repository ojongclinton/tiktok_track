// src/auth.js
import { useDispatch } from "react-redux";
import { account, OAuthProvider } from "../appwrite";
import { logout } from "../../slices/authSlice";
import { useNavigate } from "react-router";

export const useLoginWithGoogle = () => {
  const loginWithGoogle = async () => {
    try {
      await account.createOAuth2Session(
        OAuthProvider.Google,
        `${import.meta.env.VITE_BASE_URL}/auth/success/callback`,
        `${import.meta.env.VITE_BASE_URL}/auth/failure/callback`
      );
    } catch (error) {
      console.error(error);
    }
  };

  return { loginWithGoogle };
};

export const useLogoutUser = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const logOutuser = async () => {
    try {
      await account.deleteSession("current");
      dispatch(logout());
      navigate("/auth");
    } catch (error) {
      navigate("/auth");
      console.error(error);
    }
  };

  return { logOutuser };
};

export const useGetUser = () => {
  const getUser = async () => {
    try {
      return await account.get();
    } catch (error) {
      console.error(error);
    }
  };

  return { getUser };
};

export const useGetJwt = () => {
  const getJwt = async () => {
    try {
      return await account.createJWT();
    } catch (error) {
      console.error(error);
    }
  };

  return { getJwt };
};