// client/src/App.tsx
import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import { Dashboard } from "./pages/dashboard";
import { Auth } from "./pages/auth";
import { TransactionsPage } from "./pages/transactions";
import { BudgetPage } from "./pages/budget";
import { AnalyticsPage } from "./pages/analytics";
import { GoalsPage } from "./pages/goals";
import { FinancialRecordsProvider } from "./contexts/financial-record-context";
import { ThemeProvider, useTheme } from "./contexts/themeContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser
} from "@clerk/clerk-react";
import { Sun, Moon } from "lucide-react";
import logo from "./assets/brand_logo.png";
import MobileLayout from "./pages/MobileLayout";
import { useScreenSize } from "./hooks/useScreenSize";
import { PageLoader } from "./components/PageLoader";
import { Navigation } from "./components/Navigation";

const ProtectedDashboardRoute = () => {
  const { isLoaded, isSignedIn } = useUser();
  const screenSize = useScreenSize();

  if (!isLoaded) {
    return <PageLoader message="Authenticating user..." variant="fullscreen" />;
  }

  if (!isSignedIn) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <ErrorBoundary level="section">
      <FinancialRecordsProvider>
        {screenSize === "xs" ? <MobileLayout /> : <Dashboard />}
      </FinancialRecordsProvider>
    </ErrorBoundary>
  );
}

// Navbar Component with Theme Toggle
const Navbar = () => {
  const { user } = useUser();
  const { theme, toggleTheme } = useTheme();
  const screenSize = useScreenSize();
  const isMobile = screenSize === "xs";

  return (
    <>
      <SignedIn>
        {!isMobile && (
          <nav className="navbar-enhanced">
            <div className="navbar-content">
              <div className="navbar-left">
                <a href="/" className="navbar-brand">
                  <div className="brand-logo-wrapper">
                    <img src={logo} alt="Financi Logo" className="brand-logo-img" />
                  </div>
                  <div className="brand-info">
                    <h1 className="brand-title">Financi</h1>
                    <span className="brand-subtitle">Smart Finance</span>
                  </div>
                </a>
              </div>

              <div className="navbar-right">
                <button
                  className="theme-toggle-btn"
                  onClick={toggleTheme}
                  aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                  title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                >
                  {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>

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
                      appearance={{
                        elements: {
                          avatarBox: "w-10 h-10",
                          userButtonPopoverCard: "shadow-xl",
                          userButtonPopoverActionButton: "hover:bg-gray-100"
                        }
                      }}

                      userProfileMode="navigation"
                      userProfileUrl="/auth"
                    />
                  </div>
                </div>
              </div>
            </div>
          </nav>
        )}
      </SignedIn>

      <SignedOut>
        <nav className="navbar-enhanced">
          <div className="navbar-content">
            <div className="navbar-left">
              <a href="/" className="navbar-brand">
                <div className="brand-logo-wrapper">
                  <img src={logo} alt="Financi Logo" className="brand-logo-img" />
                </div>
                <div className="brand-info">
                  <h1 className="brand-title">Financi</h1>
                  <span className="brand-subtitle">Smart Finance</span>
                </div>
              </a>
            </div>

            <div className="navbar-right">
              <button
                className="theme-toggle-btn"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
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
    </>
  );
};

function AppContent() {
  const { theme } = useTheme();
  const screenSize = useScreenSize();
  const isMobile = screenSize === "xs";

  return (
    <div className={`app-container ${theme}`}>
      <Navbar />
      {!isMobile && <Navigation />}
      <Routes>
        <Route path="/" element={<ProtectedDashboardRoute />} />
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/transactions"
          element={
            <ErrorBoundary level="section">
              <FinancialRecordsProvider>
                <TransactionsPage />
              </FinancialRecordsProvider>
            </ErrorBoundary>
          }
        />
        <Route
          path="/budget"
          element={
            <ErrorBoundary level="section">
              <FinancialRecordsProvider>
                <BudgetPage />
              </FinancialRecordsProvider>
            </ErrorBoundary>
          }
        />
        <Route
          path="/analytics"
          element={
            <ErrorBoundary level="section">
              <FinancialRecordsProvider>
                <AnalyticsPage />
              </FinancialRecordsProvider>
            </ErrorBoundary>
          }
        />
        <Route
          path="/goals"
          element={
            <ErrorBoundary level="section">
              <FinancialRecordsProvider>
                <GoalsPage />
              </FinancialRecordsProvider>
            </ErrorBoundary>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
} function App() {
  return (
    <ErrorBoundary level="page">
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;