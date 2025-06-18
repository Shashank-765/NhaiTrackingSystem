import React, { useEffect } from "react";
import "./Navbar.css";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import bell from "../../Images/bell.png";
import Pusher from "pusher-js";
import logo from "../../Images/logo.png";
import logoutIcon from "../../Images/logout.png";

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();
  const { hasNewNotification, addNotification, clearNewNotificationStatus } =
    useNotifications();

  const scrollToSection = (sectionId) => {
    if (window.location.pathname !== '/') {
      navigate('/');
      // Wait for navigation to complete before scrolling
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

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
    <nav id="mainNavbar" className="navbar">
      <div className="logocontainercompany" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <img src={logo} alt="ContractChain NHAI Logo" className="navbar-logo-image" /> ContractChain NHAI
      </div>
      <div className="navbar-middle-links">
        <ul className="navbarUl">
          <li>
            <a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}>About</a>
          </li>
          <li>
            <a href="#platform-features-section" onClick={(e) => { e.preventDefault(); scrollToSection('platform-features-section'); }}>Features</a>
          </li>
          <li>
            <a href="#who-uses-section" onClick={(e) => { e.preventDefault(); scrollToSection('who-uses-section'); }}>Users</a>
          </li>
          <li>
            <a href="#faqs-section" onClick={(e) => { e.preventDefault(); scrollToSection('faqs-section'); }}>FAQ</a>
          </li>
        </ul>
      </div>
      <div className="navbar-right-section">
        {isAuthenticated ? (
          <Link to={getDashboardPath()} className="navbar-button">
            Dashboard
          </Link>
        ) : (
          <Link to="/login" className="navbar-button">
            Get Started
          </Link>
        )}
        {isAuthenticated && user?.role !== "admin" && (
          <>
            <div className="notification-bell-container">
              <Link to="/notifications" onClick={clearNewNotificationStatus}>
                <img src={bell} alt="" className="bell-icon" />
                {hasNewNotification && <span className="notification-dot"></span>}
              </Link>
            </div>
            <img
              src={logoutIcon}
              alt="Logout"
              className="logout-icon"
              style={{ width: "32px", height: "32px", cursor: "pointer", marginLeft: "16px" }}
              onClick={() => {
                logout();
                navigate("/");
              }}
              title="Logout"
            />
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
