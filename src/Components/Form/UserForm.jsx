import React, { useState } from "react";
import "./Form.css";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";

const UserForm = ({ handleCloseUserForm }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/${
          import.meta.env.VITE_API_VERSION
        }/users`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("User created successfully!");
        handleCloseUserForm();
      } else {
        toast.error(data.message || "Error creating user");
      }
    } catch (error) {
      toast.error("Server error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="overlay">
      {" "}
      <form className="user-form" onSubmit={handleSubmit}>
        <h2>Add User</h2>
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <input
          type="tel"
          name="phone"
          placeholder="Phone"
          pattern="[0-9]{10}"
          value={formData.phone}
          onChange={handleChange}
          required
        />
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          required
        >
          <option value="">Select Role</option>
          <option value="Agency">Agency</option>
          <option value="Contractor">Contractor</option>
        </select>
        <div className="button-div">
          <button
            type="button"
            className="cancel-btn"
            onClick={handleCloseUserForm}
          >
            Cancel
          </button>
          <button type="submit" className="primary-btn">
            Add User
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
