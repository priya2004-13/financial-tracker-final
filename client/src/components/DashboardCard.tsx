// client/src/components/DashboardCard.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import "./DashboardCard.css";

interface DashboardCardProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    viewMorePath?: string;
    viewMoreText?: string;
    icon?: React.ReactNode;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
    title,
    subtitle,
    children,
    viewMorePath,
    viewMoreText = "View Details",
    icon
}) => {
    const navigate = useNavigate();

    return (
        <div className="dashboard-card">
            <div className="dashboard-card-header">
                <div className="dashboard-card-title-section">
                    {icon && <div className="dashboard-card-icon">{icon}</div>}
                    <div>
                        <h3 className="dashboard-card-title">{title}</h3>
                        {subtitle && <p className="dashboard-card-subtitle">{subtitle}</p>}
                    </div>
                </div>
                {viewMorePath && (
                    <button
                        className="view-more-btn"
                        onClick={() => navigate(viewMorePath)}
                    >
                        {viewMoreText}
                        <ArrowRight size={16} />
                    </button>
                )}
            </div>
            <div className="dashboard-card-content">
                {children}
            </div>
        </div>
    );
};
