// client/src/pages/auth/AuthCard.tsx
import React from 'react';
import { SignedOut } from "@clerk/clerk-react";
import logo from "../../assets/brand_logo.png";
import './AuthCard.css'; // Make sure this is linked

interface AuthCardProps {
  children: React.ReactNode;
}

export const AuthCard: React.FC<AuthCardProps> = ({ children }) => {
  return (
    <div className="auth-card-container">
      <div className="auth-card">
        <SignedOut>
          <div className="auth-header">
            <div className="auth-logo-icon">
              {/* Use the existing logo for brand consistency */}
              <img src={logo} alt="Financi Logo" />
            </div>
            <h1 className="auth-title">Welcome to Financi!</h1>
            <p className="auth-subtitle">Your journey to financial control starts here.</p>
          </div>
          
          <div className="auth-buttons-group">
            {children}
          </div>
        </SignedOut>
      </div>
    </div>
  );
};