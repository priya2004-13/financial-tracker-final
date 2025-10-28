// client/src/App.tsx - Updated with Global Theme and Conditional Layout Rendering
import "./App.css";
import { useState, useEffect } from "react";
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
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser
} from "@clerk/clerk-react";
import {
  Sun,
  Moon,
} from "lucide-react";
import logo from "./assets/brand_logo.png";
import MobileLayout from "./pages/MobileLayout";
import { useScreenSize } from "./hooks/useScreenSize";

const ProtectedDashboardRoute = () => {
  const { isLoaded, isSignedIn } = useUser();
  const screenSize = useScreenSize();

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
      {screenSize === "xs" ? <MobileLayout /> : <Dashboard />}
    </FinancialRecordsProvider>
  );
}

function App() {
  const { user } = useUser();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const screenSize = useScreenSize();
  const isMobile = screenSize === "xs";

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const defaultTheme = prefersDark ? 'dark' : 'light';
      setTheme(defaultTheme);
      document.documentElement.setAttribute('data-theme', defaultTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <Router>
      <div className={`app-container ${theme}`}>
        <SignedIn>
          {/* Show simplified navbar only on desktop, not on mobile */}
          {!isMobile && (
            <nav className="navbar-enhanced">
              <div className="navbar-content">
                {/* Left Section - Logo & Brand */}
                <div className="navbar-left">
                  <Link to="/" className="navbar-brand">
                    <div className="brand-logo-wrapper">
                      <img src={logo} alt="Financi Logo" className="brand-logo-img" />
                    </div>
                    <div className="brand-info">
                      <h1 className="brand-title">Financi</h1>
                      <span className="brand-subtitle">Smart Finance</span>
                    </div>
                  </Link>
                </div>

                {/* Right Section - Theme Toggle & User */}
                <div className="navbar-right">
                  {/* Theme Toggle */}
                  <button
                    className="theme-toggle-btn"
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                    title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                  >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                  </button>

                  {/* User Profile Section */}
                  <div className="user-profile-section">
                    <div className="user-info-display">
                      <div className="user-details">
                        <span className="user-name-display">
                          {user?.firstName} {user?.lastName}
                        </span>
                        <span className="user-email-display">
                          {user?.primaryEmailAddress?.emailAddress}
                        </span>
                      </div>
                      <UserButton
                        afterSignOutUrl="/auth"
                        appearance={{
                          elements: {
                            avatarBox: "w-10 h-10"
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </nav>
          )}
        </SignedIn>

        {/* Signed Out Navbar */}
        <SignedOut>
          <nav className="navbar-enhanced">
            <div className="navbar-content">
              <div className="navbar-left">
                <Link to="/" className="navbar-brand">
                  <div className="brand-logo-wrapper">
                    <img src={logo} alt="Financi Logo" className="brand-logo-img" />
                  </div>
                  <div className="brand-info">
                    <h1 className="brand-title">Financi</h1>
                    <span className="brand-subtitle">Smart Finance</span>
                  </div>
                </Link>
              </div>

              <div className="navbar-right">
                {/* Theme Toggle */}
                <button
                  className="theme-toggle-btn"
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                >
                  {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>

                <div className="auth-buttons-compact">
                  <SignUpButton mode="modal">
                    <button className="btn-signup-compact">Sign Up</button>
                  </SignUpButton>
                  <SignInButton mode="modal">
                    <button className="btn-signin-compact">Sign In</button>
                  </SignInButton>
                </div>
              </div>
            </div>
          </nav>
        </SignedOut>

        <Routes>
          <Route path="/" element={<ProtectedDashboardRoute />} />
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;