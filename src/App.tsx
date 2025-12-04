import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/LoginPage";

import HomePage from "./pages/HomePage";

import ParentDashboard from "./pages/ParentDashboard";

import ChildDashboard from "./pages/ChildDashboard";

import TaskPage from "./pages/TaskPage";

import { AuthProvider, useAuth } from "./context/AuthContext";



function PrivateParentRoute() {

  const { appUser } = useAuth();

  if (!appUser) return <Navigate to="/login" replace />;

  if (appUser.role !== "parent") return <Navigate to="/child" replace />;

  return <ParentDashboard />;

}



function PrivateChildRoute() {

  const { appUser } = useAuth();

  if (!appUser) return <Navigate to="/login" replace />;

  if (appUser.role !== "child") return <Navigate to="/parent" replace />;

  return <ChildDashboard />;

}



export default function App() {

  return (

    <AuthProvider>

      <BrowserRouter>

        <Routes>

          <Route path="/" element={<HomePage />} />

          <Route path="/login" element={<LoginPage />} />

          <Route path="/parent" element={<PrivateParentRoute />} />

          <Route path="/child" element={<PrivateChildRoute />} />

          <Route path="/task/:id" element={<TaskPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>

      </BrowserRouter>

    </AuthProvider>

  );

}
