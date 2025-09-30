import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useFinancialRecords } from "../../contexts/financial-record-context";

export const FinancialRecordChart = () => {
  const { records } = useFinancialRecords();

  const data = useMemo(() => {
    return records.map((record) => ({
      name: record.description,
      amount: record.amount,
    }));
  }, [records]);

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="amount" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};