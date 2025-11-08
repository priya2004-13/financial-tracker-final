// client/src/pages/MobileLayout.tsx - Improved with page navigation
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
    LayoutGrid,
    List,
    PieChart,
    Target,
    User,
} from 'lucide-react';
import './MobileLayout.css';

// --- MAIN MOBILE LAYOUT COMPONENT ---
const TABS = [
    { id: 'home', path: '/', icon: LayoutGrid, label: 'Home' },
    { id: 'transactions', path: '/transactions', icon: List, label: 'Transactions' },
    { id: 'analytics', path: '/analytics', icon: PieChart, label: 'Analytics' },
    { id: 'budget', path: '/budget', icon: Target, label: 'Budget' },
    { id: 'profile', path: '/profile', icon: User, label: 'Profile' },
];

const MobileLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Determine active tab based on current route
    const getActiveTab = () => {
        const path = location.pathname;
        if (path === '/') return 'home';
        if (path.includes('/transactions')) return 'transactions';
        if (path.includes('/analytics')) return 'analytics';
        if (path.includes('/budget')) return 'budget';
        if (path.includes('/profile')) return 'profile';
        return 'home';
    };

    const activeTab = getActiveTab();

    return (
        <div className="mobile-layout-container">
            <main className="mobile-content-area">
                {/* Content will be rendered by the router through Outlet */}
                <Outlet />
            </main>

            <nav className="mobile-bottom-nav">
                {TABS.map((tab) => {
                    const IconComponent = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            className={`mobile-nav-button ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => navigate(tab.path)}
                            aria-label={tab.label}
                        >
                            <IconComponent size={22} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                            <span className="nav-button-label">{tab.label}</span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};

export default MobileLayout;