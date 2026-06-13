'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Interceptar fetch de manera global en el cliente para incluir cookies HttpOnly de forma automática
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    init = init || {};
    init.credentials = init.credentials || 'include';
    return originalFetch(input, init);
  };
}

// Define user type
export interface User {
  nombreUsuario: string;
  correo: string;
  cedula?: string | number;
  rol?: string;
}

// Define Context State
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  logout: () => void;
}

// Create context
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: () => { },
  logout: () => { },
});

// Custom hook to use AuthContext
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check localStorage on initial load and handle bfcache / back button navigation
  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error parsing stored user data', error);
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    checkAuth();

    const handlePageShow = (event: PageTransitionEvent) => {
      // Si la página se restaura desde bfcache, volvemos a verificar el estado de autenticación
      if (event.persisted) {
        checkAuth();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');

    try {
      // Hacer la petición al backend para destruir la cookie HttpOnly
      const { API_ROUTES } = await import('@/config/api');
      await fetch(API_ROUTES.LOGOUT, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error al cerrar sesión en el servidor:', error);
    } finally {
      // Redirigir usando replace para limpiar el historial y prevenir navegación atrás a páginas protegidas
      window.location.replace('/login');
    }
  };

  // Avoid hydration mismatch by not rendering until loaded from localStorage
  if (isLoading) {
    return null; // Or a global loading spinner
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
