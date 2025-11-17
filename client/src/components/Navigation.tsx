// client/src/components/Navigation.tsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Receipt,
    PiggyBank,
    BarChart3,
    Target,
    ChevronRight,
    ChevronLeft
} from "lucide-react";
import "./Navigation.css";

interface NavigationProps {
    isMobile?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({ isMobile = false }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Update CSS variable when collapsed state changes
    React.useEffect(() => {
        document.documentElement.style.setProperty(
            '--nav-width',
            isCollapsed ? '80px' : '280px'
        );
    }, [isCollapsed]);

    const navItems = [
        {
            path: "/",
            label: "Dashboard",
            icon: LayoutDashboard,
            description: "Overview"
        },
        {
            path: "/transactions",
            label: "Transactions",
            icon: Receipt,
            description: "All Records"
        },
        {
            path: "/budget",
            label: "Budget",
            icon: PiggyBank,
            description: "Manage Budget"
        },
        {
            path: "/analytics",
            label: "Analytics",
            icon: BarChart3,
            description: "Insights"
        },
        {
            path: "/goals",
            label: "Goals & Subscriptions",
            icon: Target,
            description: "Track Progress"
        },
        {
            path: "/calculators",
            label: "Calculators",
            icon: BarChart3,
            description: "Financial Tools"
        }
    ];

    const isActive = (path: string) => {
        if (path === "/") {
            return location.pathname === "/";
        }
        return location.pathname.startsWith(path);
    };

    return (
        <nav className={`main-navigation ${isMobile ? 'mobile' : 'desktop'} ${isCollapsed ? 'collapsed' : ''}`}>
            <button
                className="nav-toggle-btn"
                onClick={() => setIsCollapsed(!isCollapsed)}
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>


            <ul className="nav-list">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                        <li key={item.path}>
                            <button
                                className={`nav-item ${active ? 'active' : ''}`}
                                onClick={() => navigate(item.path)}
                                title={isCollapsed ? item.label : undefined}
                            >
                                <div className="nav-item-content">
                                    <div className="nav-item-icon">
                                        <Icon size={20} />
                                    </div>
                                    {!isCollapsed && (
                                        <div className="nav-item-text">
                                            <span className="nav-item-label">{item.label}</span>
                                            <span className="nav-item-description">{item.description}</span>
                                        </div>
                                    )}
                                </div>
                                {!isCollapsed && <ChevronRight size={16} className="nav-item-arrow" />}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
};
