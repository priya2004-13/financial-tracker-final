import React from 'react';
import { LucideIcon } from 'lucide-react';
import './StatCard.css';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  trend?: string;
  prefix?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  trend,
  prefix = '₹'
}) => {
  return (
    <div className="stat-card" style={{ borderLeftColor: color }}>
      <div className="stat-card-content">
        <div className="stat-card-text">
          <p className="stat-card-title">{title}</p>
          <h3 className="stat-card-value">
            {prefix}{value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
        </div>
        <div className="stat-card-icon" style={{ backgroundColor: `₹{color}20` }}>
          <Icon size={24} style={{ color }} />
        </div>
      </div>
      {trend && (
        <div className="stat-card-trend">
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
};