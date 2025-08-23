import React from "react";
import { useLogoutUser } from "../../appwrite/auth/AuthApi";
import { useTestAuth } from "../../api/ProfilesApi";

function Dashboard() {
  const { isAuthenticated, isLoading, testAuth } = useTestAuth();
  const { logOutuser } = useLogoutUser();
  return (
    <div>
      <h1>Dashboard</h1>
      <button onClick={logOutuser}>Logout</button>

      <p onClick={testAuth}>CLICK ME</p>
    </div>
  );
}

export default Dashboard;
