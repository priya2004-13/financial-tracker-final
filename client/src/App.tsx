import "./App.css";
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  Navigate // Navigate component को import करें
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
  useUser // useUser hook को import करें
} from "@clerk/clerk-react";
import logo from "./assets/brand_logo.png";

// नया कंपोनेंट जो डैशबोर्ड रूट को सुरक्षित करेगा
const ProtectedDashboardRoute = () => {
  const { isLoaded, isSignedIn } = useUser(); // Clerk से लोडिंग और साइन-इन स्थिति प्राप्त करें

  // 1. Clerk की स्थिति लोड हो रही है: एक अस्थायी लोडिंग स्क्रीन दिखाएं
  // इससे यह सुनिश्चित होगा कि FinancialRecordsProvider तब तक डेटा लाना शुरू न करे जब तक 
  // हमें user ID पता न चल जाए।
  if (!isLoaded) {
    // loading-dashboard और loading-spinner की स्टाइल dashboard.css से आती है
    return (
      <div className="dashboard-container">
        <div className="loading-dashboard">
          <div className="loading-spinner"></div>
          <p>Authenticating user...</p>
        </div>
      </div>
    );
  }

  // 2. उपयोगकर्ता साइन इन नहीं है: /auth पेज पर रीडायरेक्ट करें
  if (!isSignedIn) {
    return <Navigate to="/auth" replace />;
  }
  
  // 3. उपयोगकर्ता साइन इन है: Dashboard और उसके context को रेंडर करें
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
          <Link to="/" className="navbar-link" >
            <img src={logo} alt="brand logo" />
            <h1>Financi</h1>
          </Link>
          <div className="auth-buttons">
            <SignedOut>
              <SignUpButton mode="modal" />
              <SignInButton mode="modal" />
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </div>
        <Routes>
          {/* अब मुख्य रूट के लिए ProtectedDashboardRoute का उपयोग करें */}
          <Route path="/" element={<ProtectedDashboardRoute />} />
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;