// client/src/pages/dashboard/financial-record-chart.tsx - Keep as Bar Chart
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell // Import Cell for custom bar colors
} from "recharts";
import { useFinancialRecords } from "../../contexts/financial-record-context";

// Re-use the color mapping
const CATEGORY_COLORS: Record<string, string> = {
    Salary: '#10b981', // Keep Salary for potential future use, but filter out below
    Food: '#f97316',
    Rent: '#ef4444',
    Utilities: '#3b82f6',
    Entertainment: '#ec4899',
    Other: '#a855f7',
  };
 // Function to generate shades for potentially many custom categories
const generateColorShades = (baseColor: string, count: number): string[] => {
    const colors: string[] = [];
    let r = parseInt(baseColor.slice(1, 3), 16);
    let g = parseInt(baseColor.slice(3, 5), 16);
    let b = parseInt(baseColor.slice(5, 7), 16);
    for (let i = 0; i < count; i++) {
        const factor = 1 - (i * 0.1);
        const nr = Math.max(0, Math.min(255, Math.round(r * factor)));
        const ng = Math.max(0, Math.min(255, Math.round(g * factor)));
        const nb = Math.max(0, Math.min(255, Math.round(b * factor)));
        colors.push(`#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`);
    }
    return colors;
};


export const FinancialRecordChart = () => {
  const { records } = useFinancialRecords();

  const data = useMemo(() => {
    // Group expense records by category and sum the amounts
    const aggregatedData = records.reduce((acc, record) => {
       // Exclude Salary (income) from expense bar chart
       if (record.category !== 'Salary') {
            const category = record.category;
            acc[category] = (acc[category] || 0) + record.amount;
       }
      return acc;
    }, {} as Record<string, number>);

    // Format for the chart
    return Object.keys(aggregatedData)
           .map((category) => ({
                name: category,
                amount: aggregatedData[category],
            }))
           .sort((a,b) => b.amount - a.amount); // Sort bars descending

  }, [records]);

   // Assign colors dynamically, prioritizing defaults
   const categoryColors = useMemo(() => {
    const colors: Record<string, string> = { ...CATEGORY_COLORS };
    const customColorBase = '#6b7280'; // Grey base for custom ones without default
    const uncoloredCategories = data
        .map(d => d.name)
        .filter(name => !colors[name]);

    const shades = generateColorShades(customColorBase, uncoloredCategories.length);

    uncoloredCategories.forEach((name, index) => {
        colors[name] = shades[index % shades.length]; // Assign generated shades
    });
    return colors;
}, [data]);


  return (
    <div className="chart-container bar-chart-container">
       <h2 className="chart-title">Spending Summary (Bar)</h2>
        {data.length > 0 ? (
             <ResponsiveContainer width="100%" height={300}>
                <BarChart
                data={data}
                margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                }}
                layout="vertical" // Make it a horizontal bar chart for better label readability
                >
                <CartesianGrid strokeDasharray="3 3" horizontal={false}/> {/* Only vertical grid lines */}
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }}/> {/* Category names on Y axis */}
                <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
                {/* <Legend /> */}
                <Bar dataKey="amount" name="Amount Spent" barSize={20} >
                     {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={categoryColors[entry.name] || '#8884d8'} />
                    ))}
                </Bar>
                </BarChart>
            </ResponsiveContainer>
        ) : (
             <p className="chart-empty-state">No expense data to display.</p>
        )}

    </div>
  );
};
