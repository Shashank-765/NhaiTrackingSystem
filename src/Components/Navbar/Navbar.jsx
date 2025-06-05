import React, { useEffect } from "react";
import "./Navbar.css";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../Images/companylogo.png";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import bell from "../../Images/bell.png";
import Pusher from "pusher-js";

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();
  const { hasNewNotification, addNotification, clearNewNotificationStatus } =
    useNotifications();

  useEffect(() => {
    if (user?.role !== "admin") return;

    // Initialize Pusher
    const pusher = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
      cluster: import.meta.env.VITE_PUSHER_CLUSTER,
    });

    // Subscribe to admin channel
    const channel = pusher.subscribe("admin-channel");

    // Listen for work completion events
    channel.bind("work-completed", (data) => {
      console.log("Received notification:", data);
      const newNotification = {
        id: Date.now(),
        message: data.message,
        timestamp: new Date(data.completedAt),
        batchId: data.batchId,
      };
      addNotification(newNotification);
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [user]);

  const navigatetohome = () => {
    navigate("/");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getDashboardPath = () => {
    const role = user?.role?.toLowerCase();
    switch (role) {
      case "admin":
        return "/admin/dashboard";
      case "agency":
        return "/agency/dashboard";
      case "contractor":
        return "/contractor/dashboard";
      default:
        return "/dashboard";
    }
  };

  return (
    <nav className="navbar">
      <div className="logocontainercompany">
        <img onClick={navigatetohome} src={logo} alt="images" />
      </div>
      <ul className="navbarUl">
        <li>
          <Link to="/">Home</Link>
        </li>
        {isAuthenticated && (
          <li>
            <Link to={getDashboardPath()}>Dashboard</Link>
          </li>
        )}
        {isAuthenticated && (
          <li>
            <Link to="/profile">Profile</Link>
          </li>
        )}
        {!isAuthenticated ? (
          <li>
            <Link to="/login">Login</Link>
          </li>
        ) : (
          <li>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </li>
        )}
        {/* {isAuthenticated && user?.role?.toLowerCase() === "admin" && ( */}
        {isAuthenticated && (
          <li className="notification-bell">
            <Link to="/notifications" onClick={clearNewNotificationStatus}>
              <img src={bell} alt="" className="bell-icon" />
              {hasNewNotification && <span className="notification-dot"></span>}
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
