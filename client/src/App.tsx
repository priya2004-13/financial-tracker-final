// client/src/App.tsx - Updated with Notifications
import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate
} from "react-router-dom";
import { Dashboard } from "./pages/dashboard";
import { Auth } from "./pages/auth";
import { FinancialRecordsProvider } from "./contexts/financial-record-context";
import { Notifications } from "./components/Notifications";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser
} from "@clerk/clerk-react";
import logo from "./assets/brand_logo.png";

const ProtectedDashboardRoute = () => {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return (
      <div className="dashboard-container">
        <div className="loading-dashboard">
          <div className="loading-spinner"></div>
          <p>Authenticating user...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <FinancialRecordsProvider>
      <Dashboard />
    </FinancialRecordsProvider>
  );
}

function App() {
  return (
    <Router>
      <div className="app-container">
        <div className="navbar">
          <Link to="/" className="navbar-link">
            <img src={logo} alt="brand logo" />
            <h1>Financi</h1>
          </Link>
          <div className="auth-buttons">
            <SignedOut>
              <SignUpButton mode="modal" />
              <SignInButton mode="modal" />
            </SignedOut>
            <SignedIn>
              {/* Add Notifications component here */}
              <Notifications />
              <UserButton />
            </SignedIn>
          </div>
        </div>
        <Routes>
          <Route path="/" element={<ProtectedDashboardRoute />} />
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;