// client/src/pages/auth/index.tsx
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
    // The main container can be kept simple as the AuthCard provides the full-screen layout
    <div className="sign-in-container">
      <SignedOut>
        {/* Wrap the buttons in the new animated card */}
        <AuthCard>
          <SignUpButton mode="modal" />
          <SignInButton mode="modal" />
        </AuthCard>
      </SignedOut>
      <SignedIn>
        <Navigate to="/" />
      </SignedIn>
    </div>
  );
};