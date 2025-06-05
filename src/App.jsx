import React from "react";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./App.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./Components/Navbar/Navbar";
import Home from "./Components/Home/Home";
import Footer from "./Components/Footer/Footer";
import NotFound from "./Components/NotFound/NotFound";
import Dashboard from "./Components/Dashboard/Dashboard";
import Signup from "./Components/Signup/Signup";
import ProtectedRoute from "./Components/ProtectedRoute/ProtectedRoute";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AgencyDashboard from "./Components/AgencyDashboard/AgencyDashboard";
import ContractorDashboard from "./Components/ContractorDashboard/ContractorDashboard";
import Notification from "./Components/Notification/Notification";
import { NotificationProvider } from "./context/NotificationContext";
import Tracker from "./Components/Tracker/Tracker";

function App() {
  const DashboardSelector = () => {
    const { user } = useAuth();
    const role = user?.role?.toLowerCase();

    switch (role) {
      case "agency":
        return <Navigate to="/agency/dashboard" replace />;
      case "contractor":
        return <Navigate to="/contractor/dashboard" replace />;
      case "admin":
        return <Navigate to="/admin/dashboard" replace />;
      default:
        return <NotFound />;
    }
  };

  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Signup />} />
            
            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Agency Routes */}
            <Route
              path="/agency/dashboard"
              element={
                <ProtectedRoute allowedRoles={["agency"]}>
                  <AgencyDashboard />
                </ProtectedRoute>
              }
            />

            {/* Contractor Routes */}
            <Route
              path="/contractor/dashboard"
              element={
                <ProtectedRoute allowedRoles={["contractor"]}>
                  <ContractorDashboard />
                </ProtectedRoute>
              }
            />

            {/* Default Dashboard Route */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardSelector />
                </ProtectedRoute>
              }
            />

            {/* Tracker Route */}
            <Route
              path="/tracker/:batchId"
              element={
                <ProtectedRoute>
                  <Tracker />
                </ProtectedRoute>
              }
            />

            {/* Notifications Route */}
            <Route 
              path="/notifications" 
              element={
                <ProtectedRoute>
                  <Notification/>
                </ProtectedRoute>
              } 
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer />
          <ToastContainer position="top-right" autoClose={1500} />
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
