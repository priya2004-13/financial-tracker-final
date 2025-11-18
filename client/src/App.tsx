// client/src/App.tsx
import "./App.css";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import { Dashboard } from "./pages/dashboard";
import { Auth } from "./pages/auth"; 
import { Register } from "./pages/auth/Register"; 
import { TransactionsPage } from "./pages/transactions";
import { BudgetPage } from "./pages/budget";
import { AnalyticsPage } from "./pages/analytics";
import { GoalsPage } from "./pages/goals";
import { ProfilePage } from "./pages/ProfilePage";
import { FinancialRecordsProvider } from "./contexts/financial-record-context";
import { ThemeProvider, useTheme } from "./contexts/themeContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { GlobalFeatures } from "./components/GlobalFeatures";
import { AuthProvider, useAuth } from "./contexts/AuthContext"; 
import { Sun, Moon, LogOut } from "lucide-react"; 
import logo from "./assets/brand_logo.png";
import MobileLayout from "./pages/MobileLayout";
import { useScreenSize } from "./hooks/useScreenSize";
import { PageLoader } from "./components/PageLoader";
import { Navigation } from "./components/Navigation";
import { FinancialCalculators } from "./pages/calculators";

// ✅ Updated Protected Route to use custom AuthContext
const ProtectedDashboardRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader message="Authenticating user..." variant="fullscreen" />;
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

// ✅ Navbar Component with Custom Auth Logic
const Navbar = () => {
  const { user, logout } = useAuth(); // ✅ Use custom auth
  const { theme, toggleTheme } = useTheme();
  const screenSize = useScreenSize();
  const isMobile = screenSize === "xs";

  return (
    <nav className="navbar-enhanced">
      <div className="navbar-content">
        {/* Left Side: Brand */}
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

        {/* Right Side: Controls & Auth */}
        <div className="navbar-right">
          {/* Theme Toggle */}
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* ✅ Custom Auth State Handling */}
          {user ? (
            /* LOGGED IN STATE */
            !isMobile && (
              <div className="user-profile-section">
                <div className="user-info-display">
                  <Link to={`/profile`} className="user-profile-link">
                    <div className="user-details">
                      <span className="user-name-display">
                        {user.firstName} {user.lastName}
                      </span>
                      <span className="user-email-display">
                        {user.email}
                      </span>
                    </div>
                  </Link>

                  {/* Custom Logout Button (replaces UserButton) */}
                  <button
                    className="theme-toggle-btn"
                    onClick={logout}
                    title="Sign Out"
                    aria-label="Sign Out"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              </div>
            )
          ) : (
            /* LOGGED OUT STATE */
            <div className="auth-buttons-compact">
              {/* Replaced SignUpButton Modal with Link */}
              <Link to="/register">
                <button className="btn-signup-compact">Sign Up</button>
              </Link>

              {/* Replaced SignInButton Modal with Link */}
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
  const { user } = useAuth(); // ✅ Switched to custom auth

  return (
    <div className={`app-container ${theme}`}>
      <Navbar />
      {!isMobile && <Navigation />}

      {/* Global Features - Show when signed in */}
      {user && !isMobile && (
        <FinancialRecordsProvider>
          <GlobalFeatures />
        </FinancialRecordsProvider>
      )}

      <Routes>
        {/* Mobile Routes */}
        {isMobile ? (
          <Route element={<MobileLayout />}>
            <Route
              path="/"
              element={
                <ErrorBoundary level="section">
                  <FinancialRecordsProvider>
                    <Dashboard />
                  </FinancialRecordsProvider>
                </ErrorBoundary>
              }
            />
            {/* Add other mobile routes here if needed */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/register" element={<Register />} />
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        ) : (
          /* Desktop Routes */
          <>
            <Route path="/" element={<ProtectedDashboardRoute />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/register" element={<Register />} />

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
            <Route
              path="/profile"
              element={
                <ErrorBoundary level="section">
                  <FinancialRecordsProvider>
                    <ProfilePage />
                  </FinancialRecordsProvider>
                </ErrorBoundary>
              }
            />
            <Route
              path="/calculators"
              element={
                <ErrorBoundary level="section">
                  <FinancialCalculators />
                </ErrorBoundary>
              }
            />
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