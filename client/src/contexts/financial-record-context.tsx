import { useUser } from "@clerk/clerk-react";
import { createContext, useContext, useEffect, useState } from "react";
import {
  FinancialRecord as FinancialRecordType,
  UserBudget,
  fetchFinancialRecords as apiFetchFinancialRecords,
  addFinancialRecord as apiAddFinancialRecord,
  updateFinancialRecord as apiUpdateFinancialRecord,
  deleteFinancialRecord as apiDeleteFinancialRecord,
  fetchBudget as apiFetchBudget,
  updateBudget as apiUpdateBudget,
} from "../../services/api"; // Updated imports

interface FinancialRecordsContextType {
  records: FinancialRecordType[];
  budget: UserBudget | null;
  addRecord: (record: FinancialRecordType) => void;
  updateRecord: (id: string, newRecord: FinancialRecordType) => void;
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
  const [records, setRecords] = useState<FinancialRecordType[]>([]);
  const [budget, setBudget] = useState<UserBudget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      Promise.all([
        apiFetchFinancialRecords(user.id).then(setRecords),
        apiFetchBudget(user.id).then(setBudget),
      ]).finally(() => {
        setIsLoading(false);
      });
    }
  }, [user]);

  const addRecord = async (record: FinancialRecordType) => {
    const newRecord = await apiAddFinancialRecord(record);
    setRecords((prev) => [...prev, newRecord]);
  };

  const updateRecord = async (id: string, newRecord: FinancialRecordType) => {
    const updatedRecord = await apiUpdateFinancialRecord(id, newRecord);
    setRecords((prev) =>
      prev.map((record) => (record._id === id ? updatedRecord : record))
    );
  };

  const deleteRecord = async (id: string) => {
    await apiDeleteFinancialRecord(id);
    setRecords((prev) => prev.filter((record) => record._id !== id));
  };

  const updateBudgetHandler = async (budgetData: UserBudget) => {
    if (!user) return;
    const updatedBudget = await apiUpdateBudget(user.id, budgetData);
    setBudget(updatedBudget);
  };

  return (
    <FinancialRecordsContext.Provider
      value={{
        records,
        budget,
        addRecord,
        updateRecord,
        deleteRecord,
        updateBudget: updateBudgetHandler,
        isLoading,
      }}
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