// client/src/App.tsx - Enhanced with Detailed Navbar and Theme Toggle
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
import { Notifications } from "./components/Notifications";
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
  Wallet, 
  TrendingUp, 
  Calendar,
  Bell,
  Settings,
  HelpCircle,
  Menu,
  X,
  User as UserIcon,
  LogOut
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
  const [currentTime, setCurrentTime] = useState(new Date());

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const defaultTheme = prefersDark ? 'dark' : 'light';
      setTheme(defaultTheme);
      document.documentElement.setAttribute('data-theme', defaultTheme);
    }
  }, []);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Router>
      <div className={`app-container ${theme}`}>
        <nav className="navbar-enhanced">
          <div className="navbar-content">
            {/* Left Section - Logo & Brand */}
            <div className="navbar-left">
              <SignedIn>
                <button 
                  className="menu-toggle-btn"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label="Toggle menu"
                >
                  {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </SignedIn>
              
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

            {/* Center Section - Quick Info (Desktop Only) */}
            <SignedIn>
              {/* <div className="navbar-center">
                <div className="navbar-stat">
                  <Calendar size={16} className="stat-icon" />
                  <div className="stat-content">
                    <span className="stat-label">{formatDate(currentTime)}</span>
                    <span className="stat-value">{formatTime(currentTime)}</span>
                  </div>
                </div>
                
                <div className="navbar-stat">
                  <Wallet size={16} className="stat-icon" />
                  <div className="stat-content">
                    <span className="stat-label">Your Finance</span>
                    <span className="stat-value">Dashboard</span>
                  </div>
                </div>
              </div> */}
            </SignedIn>

            {/* Right Section - Actions */}
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

              <SignedOut>
                <div className="auth-buttons-compact">
                  <SignUpButton mode="modal">
                    <button className="btn-signup-compact">Sign Up</button>
                  </SignUpButton>
                  <SignInButton mode="modal">
                    <button className="btn-signin-compact">Sign In</button>
                  </SignInButton>
                </div>
              </SignedOut>

              <SignedIn>
                {/* Help Button */}
                {/* <button className="icon-action-btn" title="Help & Support">
                  <HelpCircle size={20} />
                </button> */}

                {/* Notifications */}
                {/* <Notifications /> */}

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
              </SignedIn>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <SignedIn>
              <div className="mobile-menu-dropdown">
                {/* User Info Mobile */}
                <div className="mobile-user-info">
                  <div className="mobile-user-avatar">
                    <UserIcon size={32} />
                  </div>
                  <div className="mobile-user-details">
                    <h3>{user?.firstName} {user?.lastName}</h3>
                    <p>{user?.primaryEmailAddress?.emailAddress}</p>
                    <span className="member-badge">
                      Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Quick Stats Mobile */}
                <div className="mobile-quick-stats">
                  <div className="mobile-stat-item">
                    <Calendar size={18} />
                    <div>
                      <span className="mobile-stat-label">Today</span>
                      <span className="mobile-stat-text">{formatDate(currentTime)}</span>
                    </div>
                  </div>
                  <div className="mobile-stat-item">
                    <Wallet size={18} />
                    <div>
                      <span className="mobile-stat-label">Dashboard</span>
                      <span className="mobile-stat-text">Active</span>
                    </div>
                  </div>
                </div>

                {/* Mobile Menu Actions */}
                <div className="mobile-menu-actions">
                  <button className="mobile-action-item">
                    <UserIcon size={20} />
                    <span>Profile Settings</span>
                  </button>
                  <button className="mobile-action-item">
                    <Settings size={20} />
                    <span>Preferences</span>
                  </button>
                  <button className="mobile-action-item">
                    <HelpCircle size={20} />
                    <span>Help & Support</span>
                  </button>
                  <button 
                    className="mobile-action-item theme-item"
                    onClick={toggleTheme}
                  >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    <span>{theme === 'light' ? 'Dark' : 'Light'} Mode</span>
                  </button>
                </div>
              </div>
            </SignedIn>
          )}
        </nav>

        <Routes>
          <Route path="/" element={<ProtectedDashboardRoute />} />
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;