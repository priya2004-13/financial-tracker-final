// client/src/App.tsx
import "./App.css";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import { Dashboard } from "./pages/dashboard";

import { TransactionsPage } from "./pages/transactions";
import { BudgetPage } from "./pages/budget";
import { AnalyticsPage } from "./pages/analytics";
import { GoalsPage } from "./pages/goals";
import { ProfilePage } from "./pages/ProfilePage";
import { FinancialRecordsProvider } from "./contexts/financial-record-context";
import { ThemeProvider, useTheme } from "./contexts/themeContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { GlobalFeatures } from "./components/GlobalFeatures";
import { AuthProvider, useAuth } from "./contexts/AuthContext"; // ✅ Custom Auth Hook
import { Sun, Moon, LogOut } from "lucide-react";
import logo from "./assets/brand_logo.png";
import MobileLayout from "./pages/MobileLayout";
import { useScreenSize } from "./hooks/useScreenSize";
import { PageLoader } from "./components/PageLoader";
import { Navigation } from "./components/Navigation";
import { FinancialCalculators } from "./pages/calculators";
import { Auth, Register } from "./pages/auth";

// ✅ Custom Protected Route
const ProtectedDashboardRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader message="Authenticating..." variant="fullscreen" />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <ErrorBoundary level="section">
      <FinancialRecordsProvider>
        <Dashboard />
      </FinancialRecordsProvider>
    </ErrorBoundary>
  );
};

// ✅ Custom Navbar (No Clerk)
const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const screenSize = useScreenSize();
  const isMobile = screenSize === "xs";

  return (
    <nav className="navbar-enhanced">
      <div className="navbar-content">
        {/* Brand */}
        <div className="navbar-left">
          <Link to="/" className="navbar-brand">
            <div className="brand-logo-wrapper">
              <img src={logo} alt="MoneyFlow Logo" className="brand-logo-img" />
            </div>
            <div className="brand-info">
              <h1 className="brand-title">MoneyFlow</h1>
              <span className="brand-subtitle">Smart Finance</span>
            </div>
          </Link>
        </div>

        {/* Controls */}
        <div className="navbar-right">
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* Auth Controls */}
          {user ? (
            !isMobile && (
              <div className="user-profile-section">
                <div className="user-info-display">
                  <Link to="/profile" className="user-profile-link">
                    <div className="user-details">
                      <span className="user-name-display">
                        {user.firstName} {user.lastName}
                      </span>
                      <span className="user-email-display">
                        {user.email}
                      </span>
                    </div>
                  </Link>
                  <button
                    onClick={logout}
                    className="theme-toggle-btn"
                    title="Sign Out"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="auth-buttons-compact">
              <Link to="/register">
                <button className="btn-signup-compact">Sign Up</button>
              </Link>
              <Link to="/auth">
                <button className="btn-signin-compact">Sign In</button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

function AppContent() {
  const { theme } = useTheme();
  const screenSize = useScreenSize();
  const isMobile = screenSize === "xs";
  const { user } = useAuth();

  return (
    <div className={`app-container ${theme}`}>
      <Navbar />
      {!isMobile && <Navigation />}

      {/* Global Features */}
      {user && !isMobile && (
        <FinancialRecordsProvider>
          <GlobalFeatures />
        </FinancialRecordsProvider>
      )}

      <Routes>
        {/* Mobile Layout */}
        {isMobile ? (
          <Route element={<MobileLayout />}>
            <Route path="/" element={
              <ErrorBoundary level="section">
                <FinancialRecordsProvider>
                  <Dashboard />
                </FinancialRecordsProvider>
              </ErrorBoundary>
            } />
            <Route path="/auth" element={<Auth />} />
            <Route path="/register" element={<Register />} />
            <Route path="/transactions" element={
              <FinancialRecordsProvider><TransactionsPage /></FinancialRecordsProvider>
            } />
            <Route path="/budget" element={
              <FinancialRecordsProvider><BudgetPage /></FinancialRecordsProvider>
            } />
            <Route path="/analytics" element={
              <FinancialRecordsProvider><AnalyticsPage /></FinancialRecordsProvider>
            } />
            <Route path="/profile" element={
              <FinancialRecordsProvider><ProfilePage /></FinancialRecordsProvider>
            } />
            <Route path="/calculators" element={
              <FinancialCalculators />
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        ) : (
          /* Desktop Layout */
          <>
            <Route path="/" element={<ProtectedDashboardRoute />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/register" element={<Register />} />

            <Route path="/transactions" element={
              <FinancialRecordsProvider><TransactionsPage /></FinancialRecordsProvider>
            } />
            <Route path="/budget" element={
              <FinancialRecordsProvider><BudgetPage /></FinancialRecordsProvider>
            } />
            <Route path="/analytics" element={
              <FinancialRecordsProvider><AnalyticsPage /></FinancialRecordsProvider>
            } />
            <Route path="/goals" element={
              <FinancialRecordsProvider><GoalsPage /></FinancialRecordsProvider>
            } />
            <Route path="/profile" element={
              <FinancialRecordsProvider><ProfilePage /></FinancialRecordsProvider>
            } />
            <Route path="/calculators" element={
              <FinancialCalculators />
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary level="page">
      <ThemeProvider>
        <AuthProvider>

        <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;