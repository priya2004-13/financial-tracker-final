// client/src/pages/auth/index.tsx - FIXED VERSION
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
} from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { AuthCard } from "./AuthCard";

export const Auth = () => {
  return (
    <div className="sign-in-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <SignedOut>
        {/* Wrap the buttons in the animated card */}
        <AuthCard>
          <SignUpButton
            mode="modal"
            fallbackRedirectUrl="/"
          >
            <button className="btn-primary" style={{ width: '100%', padding: '0.875rem 1.5rem' }}>
              Sign Up
            </button>
          </SignUpButton>
          <SignInButton
            mode="modal"
            fallbackRedirectUrl="/"
          >
            <button className="btn-secondary" style={{ width: '100%', padding: '0.875rem 1.5rem' }}>
              Sign In
            </button>
          </SignInButton>
        </AuthCard>
      </SignedOut>
      <SignedIn>
        <Navigate to="/" replace />
      </SignedIn>
    </div>
  );
};