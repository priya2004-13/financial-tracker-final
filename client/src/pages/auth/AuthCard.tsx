// client/src/pages/auth/AuthCard.tsx
import React from 'react';
import logo from "../../assets/brand_logo.png";
import './AuthCard.css';

interface AuthCardProps {
  children: React.ReactNode;
}

export const AuthCard: React.FC<AuthCardProps> = ({ children }) => {
  return (
    <div className="auth-card-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-icon">
            <img src={logo} alt="MoneyFlow Logo" />
          </div>
          <h1 className="auth-title">Welcome to MoneyFlow!</h1>
          <p className="auth-subtitle">Your journey to financial control starts here.</p>
        </div>

        <div className="auth-body">
          {children}
        </div>
      </div>
    </div>
  );
};