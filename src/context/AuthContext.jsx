import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('usuarioLogado');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const login = (usuario) => {
    setCurrentUser(usuario);
    localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('usuarioLogado');
  };

  const isGestor = currentUser?.cargo === 'gestor';
  const isSupervisor = currentUser?.cargo === 'supervisor';
  const isOperador = currentUser?.cargo === 'operador' || currentUser?.cargo === 'elite';

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isGestor, isSupervisor, isOperador }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
}
