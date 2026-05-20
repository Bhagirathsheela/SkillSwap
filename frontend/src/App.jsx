import { Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./components/NavBar";
// import HeroSection from "./components/HeroSection";
import HowItWorks from "./components/HowItWorks";
import CreateSwap from "./pages/CreateSwap";
import UserCard from "./pages/UserCard";
//import MyTask from "./components/user/MyTask";
import Settings from "./pages/Settings";
import ProfileView from "./pages/ProfileView";
import SignIn from "./pages/SignIn";
import PrivateRoute from "./routes/PrivateRoute";
import ConfirmSignupPage from "./pages/ConfirmSignupPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import RequestsPage from "./pages/RequestsPage";
import MyTasks from "./pages/MyTasks";
import ChatPage from "./pages/ChatPage";
import ChangePassword from "./pages/ChangePassword";

function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<UserCard />} />
        <Route
          path="/create-swap"
          element={
            <PrivateRoute>
              <CreateSwap />
            </PrivateRoute>
          }
        />
        <Route path="/settings" element={<Settings />} />
        <Route
          path="/profileview"
          element={
            <ProfileView user={JSON.parse(localStorage.getItem("user"))} />
          }
        />
        <Route path="/my-tasks" element={<MyTasks />} />
        <Route path="/login" element={<SignIn />} />
        <Route path="/confirm-signup" element={<ConfirmSignupPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route
          path="/requests"
          element={
            <PrivateRoute>
              <RequestsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/chats"
          element={
            <PrivateRoute>
              <ChatPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/change_password"
          element={
            <PrivateRoute>
              <ChangePassword />
            </PrivateRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
