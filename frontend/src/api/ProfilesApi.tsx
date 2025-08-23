import axios from "axios";
import { useState } from "react";
import { useSelector } from "react-redux";
import { useLogoutUser } from "../appwrite/auth/AuthApi";

const API_URL = "http://localhost:3001/api";

export const useTestAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const user = useSelector((state: any) => state.auth.user);
  const jwtToken = useSelector((state: any) => state.auth.jwtToken);

  const testAuth = async () => {
    console.log(user);
    console.log(jwtToken);
    // return
    try {
      setIsLoading(true);
      // const response = await axios.get(`${API_URL}/auth/testAuth`, {
      const response = await axios.get(`${API_URL}/profiles/test/exists?username=espn`, {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      });
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

export const useRegisterUserToSystem = () => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const registerUser = async (registerData) => {
    try {
      setIsLoading(true);

      const [firstName, ...rest] = registerData.user.name.trim().split(" ");
      const lastName = rest.length > 0 ? rest.join(" ") : "";

      const response = await axios.post(
        `${API_URL}/auth/register`,
        {
          oauth2User: {
            ...registerData.user,
            firstName,
            lastName,
            appwrite_id: registerData.user.$id,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${registerData.jwtToken}`,
          },
        }
      );

      console.log("Register response:", response);
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
  const jwtToken = useSelector((state: any) => state.auth.jwtToken);

  const logoutUser = async () => {
    console.log(jwtToken)
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_URL}/auth/logout`, null, {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      });
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
