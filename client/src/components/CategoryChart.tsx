// client/src/pages/dashboard/CategoryChart.tsx - Now using Pie Chart
import React, { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useFinancialRecords } from "../contexts/financial-record-context";
import './CategoryChart.css'; // Add a CSS file for styling if needed

const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  Food: '#f97316', // Orange
  Rent: '#ef4444', // Red
  Utilities: '#3b82f6', // Blue
  Entertainment: '#ec4899', // Pink
  Salary: '#10b981', // Green (Income - usually excluded from expense charts)
  Other: '#a855f7', // Purple
  // Add more default colors if needed
};

// Function to generate shades for potentially many custom categories
const generateColorShades = (baseColor: string, count: number): string[] => {
    const colors: string[] = [];
    // Basic shade generation (example) - replace with a better library if needed
    let r = parseInt(baseColor.slice(1, 3), 16);
    let g = parseInt(baseColor.slice(3, 5), 16);
    let b = parseInt(baseColor.slice(5, 7), 16);

    for (let i = 0; i < count; i++) {
        // Simple darkening effect
        const factor = 1 - (i * 0.1);
        const nr = Math.max(0, Math.min(255, Math.round(r * factor)));
        const ng = Math.max(0, Math.min(255, Math.round(g * factor)));
        const nb = Math.max(0, Math.min(255, Math.round(b * factor)));
        colors.push(`#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`);
    }
    return colors;
};


export const CategoryChart = () => {
  const { records, categories: customCategories } = useFinancialRecords();

  const chartData = useMemo(() => {
    const expenseData = records.reduce((acc, record) => {
      // Exclude income ('Salary') from the expense chart
      if (record.category !== 'Salary') {
        const category = record.category;
        acc[category] = (acc[category] || 0) + record.amount;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(expenseData).map(([name, value]) => ({
      name,
      value,
    })).sort((a, b) => b.value - a.value); // Sort descending by amount

  }, [records]);

    // Assign colors dynamically, prioritizing defaults
    const categoryColors = useMemo(() => {
        const colors: Record<string, string> = { ...DEFAULT_CATEGORY_COLORS };
        const customColorBase = '#6b7280'; // Grey base for custom ones without default
        const uncoloredCategories = chartData
            .map(d => d.name)
            .filter(name => !colors[name]);

        const shades = generateColorShades(customColorBase, uncoloredCategories.length);

        uncoloredCategories.forEach((name, index) => {
            colors[name] = shades[index % shades.length]; // Assign generated shades
        });
        return colors;
    }, [chartData]);


  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);

       // Only show label if percentage is significant enough
       if ((percent * 100) < 5) {
           return null;
       }

      return (
          <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="10px" fontWeight="bold">
               {`${(percent * 100).toFixed(0)}%`}
          </text>
      );
  };


  return (
    <div className="chart-container pie-chart-container">
      <h2 className="chart-title">Expense Breakdown</h2>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80} // Adjust radius as needed
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={categoryColors[entry.name] || '#8884d8'} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
             <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle"/>
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <p className="chart-empty-state">No expense data for this period.</p>
      )}
    </div>
  );
};
