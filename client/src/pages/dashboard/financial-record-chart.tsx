import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useFinancialRecords } from "../../contexts/financial-record-context";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export const FinancialRecordChart = () => {
  const { records } = useFinancialRecords();

  const data = useMemo(() => {
    return records.map((record) => ({
      name: record.category,
      value: record.amount,
    }));
  }, [records]);

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) =>
              `${name}: ${(percent * 100).toFixed(0)}%`
            }
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};