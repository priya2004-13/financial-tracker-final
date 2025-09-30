import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useFinancialRecords } from "../../contexts/financial-record-context";

export const FinancialRecordChart = () => {
  const { records } = useFinancialRecords();

  const data = useMemo(() => {
    // Group records by category and sum the amounts
    const aggregatedData = records.reduce((acc, record) => {
      const category = record.category;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += record.amount;
      return acc;
    }, {} as Record<string, number>);

    // Format for the chart
    return Object.keys(aggregatedData).map((category) => ({
      name: category,
      amount: aggregatedData[category],
    }));
  }, [records]);

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="amount" fill="#4361ee" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};