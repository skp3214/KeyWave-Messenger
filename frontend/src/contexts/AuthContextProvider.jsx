import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../constants";

const AuthContext = createContext();

function AuthContextProvider({ children }) {
    const [auth, setAuth] = useState(null);

    const checkAuthStatus = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/users/me`, {
                withCredentials: true, 
            });

            if (response.data?.user) {
                setAuth(response.data.user);
            } else {
                setAuth(null);
            }
        } catch (error) {
            console.error("Error checking auth status:", error);
            setAuth(null);
        }
    };

    useEffect(() => {
        checkAuthStatus();
    }, []);

    function updateAuth(userData) {
        setAuth(userData); 
    }

    return (
        <AuthContext.Provider
            value={{ auth, setAuth: updateAuth, checkAuthStatus }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}

export default AuthContextProvider;
