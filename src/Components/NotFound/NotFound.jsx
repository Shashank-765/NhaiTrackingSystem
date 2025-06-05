import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

function NotFound() {
    return (
        <div className="notfound-wrapper">
            <div className="notfound-box">
                <h1>404</h1>
                <p>Sorry, the page you're looking for doesn't exist.</p>
                <Link to="/" className="back-home-btn">← Go to Home</Link>
            </div>
        </div>
    );
}

export default NotFound;
