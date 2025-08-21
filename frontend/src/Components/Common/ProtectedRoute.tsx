import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Outlet, useNavigate } from "react-router";
import {
  useGetJwt,
  useGetUser,
  useLogoutUser,
} from "../../appwrite/auth/AuthApi";
import { login } from "../../slices/authSlice";

function ProtectedRoute() {
  const [checkAuthLoading, setCheckAuthLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { getUser } = useGetUser();
  const { getJwt } = useGetJwt();
  const { logOutuser } = useLogoutUser();

  useEffect(() => {
    const checkUser = async () => {
      try {
        setCheckAuthLoading(true);
        await getUser().then(async (data) => {
          const jwtData = await getJwt();

          if (data && jwtData) {
            dispatch(login({ user: data, jwtToken: jwtData.jwt }));
            navigate("/dashboard");
          } else {
            logOutuser();
          }
        });
      } catch (error) {
        logOutuser();
      } finally {
        setCheckAuthLoading(false);
      }
    };

    checkUser();
  }, []);
  return <Outlet />;
}

export default ProtectedRoute;
