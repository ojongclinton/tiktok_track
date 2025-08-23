import ProtectedRoute from "./Components/Common/ProtectedRoute";
import Auth from "./Pages/Auth/Auth";
import AuthCallbackFailure from "./Pages/Auth/AuthCallbackFailure";
import AuthCallbackSuccess from "./Pages/Auth/AuthCallbackSuccess";
import Dashboard from "./Pages/Dashboard/Dashboard";
import HashTags from "./Pages/Dashboard/HashTags/HashTags";
import Reports from "./Pages/Dashboard/Reports/Reports";
import Sounds from "./Pages/Dashboard/Sounds/Sounds";
import Trending from "./Pages/Dashboard/Trending/Trending";
import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div>Home Page</div>} />
        {/* Authentication Routes */}
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/auth/success/callback"
          element={<AuthCallbackSuccess />}
        />
        <Route
          path="/auth/failure/callback"
          element={<AuthCallbackFailure />}
        />

        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<ProtectedRoute />}>
          <Route index element={<Dashboard />} />
          <Route path="hashtags" element={<HashTags />} />
          <Route path="sounds" element={<Sounds />} />
          <Route path="trending" element={<Trending />} />
          <Route path="reports" element={<Reports />} />
        </Route>
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
