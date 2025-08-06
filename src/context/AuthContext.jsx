import { createContext } from "react";
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";


export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [accessToken, setAccessToken] = useState(null);
    const [refreshToken, setRefreshToken] = useState(null);
    const [user, setUser] = useState(null);
    

    useEffect(() => {
        const storedAccessToken = localStorage.getItem("access");
        const storedRefreshToken = localStorage.getItem("refresh");
        if (storedAccessToken && storedRefreshToken) {
            setAccessToken(storedAccessToken);
            setRefreshToken(storedRefreshToken);

            try {
                const decoded = jwtDecode(storedAccessToken);
                setUser(decoded);
            } catch (error) {
                console.error("JWT 디코딩 실패:", error);
                setUser(null);
            }
        }
    }, []);

    return (
        <AuthContext.Provider value={{ accessToken, setAccessToken, refreshToken, setRefreshToken, user, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}