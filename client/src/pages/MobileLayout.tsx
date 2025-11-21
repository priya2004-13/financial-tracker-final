// client/src/pages/MobileLayout.tsx - Improved with page navigation and gestures
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import {
    LayoutGrid,
    List,
    PieChart,
    Target,
    User,
    Calculator,
} from 'lucide-react';
import './MobileLayout.css';

// --- MAIN MOBILE LAYOUT COMPONENT ---
const TABS = [
    { id: 'home', path: '/', icon: LayoutGrid, label: 'Home' },
    { id: 'transactions', path: '/transactions', icon: List, label: 'Transactions' },
    { id: 'analytics', path: '/analytics', icon: PieChart, label: 'Analytics' },
    { id: 'calculators', path: '/calculators', icon: Calculator, label: 'Calculators' },
    { id: 'budget', path: '/budget', icon: Target, label: 'Budget' },
    { id: 'profile', path: '/profile', icon: User, label: 'Profile' },
];

const MobileLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const contentRef = useRef<HTMLElement>(null);
    const [isPulling, setIsPulling] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const touchStartY = useRef(0);
    const isScrolledToTop = useRef(true);

    // Determine active tab based on current route
    const getActiveTab = () => {
        const path = location.pathname;
        if (path === '/') return 'home';
        if (path.includes('/transactions')) return 'transactions';
        if (path.includes('/analytics')) return 'analytics';
        if (path.includes('/calculators')) return 'calculators';
        if (path.includes('/budget')) return 'budget';
        if (path.includes('/profile')) return 'profile';
        return 'home';
    };

    const activeTab = getActiveTab();

    // Pull-to-refresh functionality
    // useEffect(() => {
    //     const content = contentRef.current;
    //     if (!content) return;

    //     const handleScroll = () => {
    //         isScrolledToTop.current = content.scrollTop === 0;
    //     };

    //     const handleTouchStart = (e: TouchEvent) => {
    //         if (isScrolledToTop.current) {
    //             touchStartY.current = e.touches[0].clientY;
    //         }
    //     };

    //     const handleTouchMove = (e: TouchEvent) => {
    //         if (!isScrolledToTop.current) return;

    //         const touchY = e.touches[0].clientY;
    //         const distance = touchY - touchStartY.current;

    //         if (distance > 0 && distance < 150) {
    //             setIsPulling(true);
    //             setPullDistance(distance);
    //         }
    //     };

    //     const handleTouchEnd = () => {
    //         if (isPulling && pullDistance > 90) {
    //             // Trigger refresh
    //             window.location.reload();
    //         }
    //         setIsPulling(false);
    //         setPullDistance(0);
    //     };

    //     content.addEventListener('scroll', handleScroll);
    //     content.addEventListener('touchstart', handleTouchStart, { passive: true });
    //     content.addEventListener('touchmove', handleTouchMove, { passive: true });
    //     content.addEventListener('touchend', handleTouchEnd);

    //     return () => {
    //         content.removeEventListener('scroll', handleScroll);
    //         content.removeEventListener('touchstart', handleTouchStart);
    //         content.removeEventListener('touchmove', handleTouchMove);
    //         content.removeEventListener('touchend', handleTouchEnd);
    //     };
    // }, [isPulling, pullDistance]);

    // // Page transition animation
    // useEffect(() => {
    //     if (contentRef.current) {
    //         contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    //     }
    // }, [location.pathname]);

    return (
        <div className="mobile-layout-container">
            {/* Pull-to-refresh indicator */}
            {/* {isPulling && (
                <div
                    className="pull-to-refresh-indicator"
                    style={{
                        transform: `translateY(${Math.min(pullDistance, 60)}px)`,
                        opacity: pullDistance / 60
                    }}
                >
                    <div className="refresh-spinner"></div>
                </div>
            )}  */}

            <main
                ref={contentRef}
                className="mobile-content-area"
                style={{ transform: isPulling ? `translateY(${pullDistance}px)` : 'none' }}
            >
                <Outlet />
            </main>

            <nav className="mobile-bottom-nav">
                {TABS.map((tab) => {
                    const IconComponent = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            className={`mobile-nav-button ${isActive ? 'active' : ''}`}
                            onClick={() => navigate(tab.path)}
                            aria-label={tab.label}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <div className="nav-icon-wrapper">
                                <IconComponent
                                    size={22}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                {isActive && <div className="nav-indicator" />}
                            </div>
                            <span className="nav-button-label">{tab.label}</span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};

export default MobileLayout;