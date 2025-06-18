import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Signup.css";
import CircularLoader from "../CircularLoader/CircularLoader";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../../context/AuthContext";

const Signup = () => {
  const navigate = useNavigate();
  const { login, setIsAuthenticated, setUser, logout } = useAuth();
  const [isCircularloader, setIsCircularloader] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsCircularloader(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/${import.meta.env.VITE_API_VERSION}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        // Use auth context to handle login
        login(data.user, data.token);

        // Role-based redirect
        if (data.user.role === "contractor") {
          navigate("/contractor/dashboard");
        } else if (data.user.role === "agency") {
          navigate("/agency/dashboard");
        } else if (data.user.role === "admin") {
          navigate("/dashboard"); // or your admin dashboard route
        } else {
          navigate("/"); // fallback
        }

        toast.success("Login successful!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });

        // Clear form and redirect
        setFormData({ email: "", password: "" });
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      } else {
        toast.error(data.message || "Invalid credentials", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (error) {
      toast.error("Server error. Please try again later.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsCircularloader(false);
    }
  };

  useEffect(() => {
    const checkAuth = () => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        const tokenExpiry = localStorage.getItem('tokenExpiry');

        if (token && userData && tokenExpiry) {
            const now = new Date().getTime();

            if (now < parseInt(tokenExpiry)) {
                setIsAuthenticated(true);
                setUser(JSON.parse(userData));
            } else {
                logout();
            }
        }
    };

    checkAuth();
  }, [setIsAuthenticated, setUser, logout]);

  return (
    <div className="signuploginconainter">
      <div className="form-container">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            className="authtext"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              className="authtext"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button type="submit" className="auth-button">
            {isCircularloader ? <CircularLoader size={18} /> : "Login"}
          </button>
        </form>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Signup;
