// client/src/contexts/financial-record-context.tsx
import { useUser } from "@clerk/clerk-react";
import { createContext, useContext, useEffect, useState } from "react";
import {
  FinancialRecord as FinancialRecordType,
  UserBudget,
  fetchFinancialRecords,
  addFinancialRecord,
  updateFinancialRecord,
  deleteFinancialRecord,
  fetchBudget,
  updateBudget as apiUpdateBudget,
} from "../../services/api"; // Corrected import

export interface FinancialRecord extends FinancialRecordType {} // Re-exporting for clarity


interface FinancialRecordsContextType {
  records: FinancialRecord[];
  budget: UserBudget | null;
  addRecord: (record: FinancialRecord) => void;
  updateRecord: (id: string, newRecord: FinancialRecord) => void;
  deleteRecord: (id: string) => void;
  updateBudget: (budget: UserBudget) => void;
  isLoading: boolean;
}

export const FinancialRecordsContext = createContext<
  FinancialRecordsContextType | undefined
>(undefined);

export const FinancialRecordsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [budget, setBudget] = useState<UserBudget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      Promise.all([
        fetchFinancialRecords(user.id).then(setRecords).catch(console.error),
        fetchBudget(user.id).then(setBudget).catch(console.error),
      ]).finally(() => {
        setIsLoading(false);
      });
    }
  }, [user]);

  const addRecord = async (record: FinancialRecord) => {
    try {
      const newRecord = await addFinancialRecord(record);
      setRecords((prev) => [...prev, newRecord]);
    } catch (err) {
      console.error("Error adding record:", err);
    }
  };

  const updateRecord = async (id: string, newRecord: FinancialRecord) => {
    try {
      const updatedRecord = await updateFinancialRecord(id, newRecord);
      setRecords((prev) =>
        prev.map((r) => (r._id === id ? updatedRecord : r))
      );
    } catch (err) {
      console.error("Error updating record:", err);
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      await deleteFinancialRecord(id);
      setRecords((prev) => prev.filter((record) => record._id !== id));
    } catch (err) {
      console.error("Error deleting record:", err);
    }
  };

  const updateBudget = async (budgetData: UserBudget) => {
    if (!user) return;
    try {
      const updatedBudget = await apiUpdateBudget(user.id, budgetData);
      setBudget(updatedBudget);
    } catch (err) {
      console.error("Error updating budget:", err);
    }
  };

  return (
    <FinancialRecordsContext.Provider
      value={{ records, budget, addRecord, updateRecord, deleteRecord, updateBudget, isLoading }}
    >
      {children}
    </FinancialRecordsContext.Provider>
  );
};

export const useFinancialRecords = () => {
  const context = useContext<FinancialRecordsContextType | undefined>(
    FinancialRecordsContext
  );

  if (!context) {
    throw new Error(
      "useFinancialRecords must be used within a FinancialRecordsProvider"
    );
  }

  return context;
};