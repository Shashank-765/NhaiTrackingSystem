import React from "react";
import "./CircularLoader.css";

const CircularLoader = ({ size }) => {
    if (size !== null || size !== undefined) {
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{ height: size, width: size }}
            className="circular-loader"
          ></div>
        </div>
      );
    } else {
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{ height: "40px", width: "40px" }}
            className="circular-loader"
          ></div>
        </div>
      );
    }
  };

export default CircularLoader;
