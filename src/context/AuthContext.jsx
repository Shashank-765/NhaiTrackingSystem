import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const logout = () => {
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('tokenExpiry');
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
            setLoading(false);
        };

        checkAuth();
    }, []);

    const login = (userData, token) => {
        const expiryDate = new Date().getTime() + 7 * 24 * 60 * 60 * 1000; // 7 days

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('tokenExpiry', expiryDate.toString());

        setIsAuthenticated(true);
        setUser(userData);
        setLoading(false);
    };

    if (loading) {
        return null; // or return a loading spinner component
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
