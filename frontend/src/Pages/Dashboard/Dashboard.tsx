import React from "react";
import { useLogoutUser } from "../../appwrite/auth/AuthApi";


function Dashboard() {
  const { logOutuser } = useLogoutUser();
  return (
    <div>
      <h1>Dashboard</h1>
      <button onClick={logOutuser}>Logout</button>
    </div>
  );
}

export default Dashboard;
