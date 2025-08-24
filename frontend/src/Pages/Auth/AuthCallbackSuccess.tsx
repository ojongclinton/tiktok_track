import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import { login, logout } from "../../slices/authSlice";
import logoTransparentSvg from "../../assets/BuzzWatch.png";
import { ImSpinner10 } from "react-icons/im";
import { useGetJwt, useGetUser } from "../../appwrite/auth/AuthApi";
import { useRegisterUserToSystem } from "../../api/ProfilesApi";

function AuthCallbackSuccess() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { registerUser } = useRegisterUserToSystem();

  const { getUser } = useGetUser();
  const { getJwt } = useGetJwt();

  useEffect(() => {
    const checkAndRegisterUser = async () => {
      try {
        await getUser().then(async (data) => {
          const jwtData = await getJwt();

          if (data && jwtData) {
            dispatch(login({ user: data, jwtToken: jwtData.jwt }));
            const res2 = await registerUser({
              user: data,
              jwtToken: jwtData.jwt,
            });
            if (res2) {
              navigate("/dashboard");
            } else {
              //TODO: Handle registration failure
              dispatch(logout());
              navigate("/auth");
            }
          } else {
            dispatch(logout());
            navigate("/auth");
          }
        });
      } catch (error) {
        dispatch(logout());
        navigate("/auth");
      } finally {
      }
    };

    checkAndRegisterUser();
  }, []);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-[70px]">
      <img src={logoTransparentSvg} className="w-[300px] h-[300px]" />
      <p className="flex flex-col items-center gap-2">
        <ImSpinner10 className="animate-spin text-gray-600 w-[100px] h-[100px]" />
        <p className="text-md text-gray-600 ">Letting you in.....</p>
      </p>
    </div>
  );
}

export default AuthCallbackSuccess;
