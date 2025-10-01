import { useUser } from "@clerk/clerk-react";
import { createContext, useContext, useEffect, useState } from "react";

export interface FinancialRecord {
  _id?: string;
  userId: string;
  date: Date;
  description: string;
  amount: number;
  category: string;
  paymentMethod: string;
}

export interface UserBudget {
  _id?: string;
  userId: string;
  monthlySalary: number;
  categoryBudgets: {
    Food: number;
    Rent: number;
    Utilities: number;
    Entertainment: number;
    Other: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

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

  const fetchRecords = async () => {
    if (!user) return;
    try {
      const response = await fetch(
        `http://localhost:3001/financial-records/getAllByUserID/${user.id}`
      );

      if (response.ok) {
        const records = await response.json();
        setRecords(records);
      }
    } catch (err) {
      console.error("Error fetching records:", err);
    }
  };

  const fetchBudget = async () => {
    if (!user) return;
    try {
      const response = await fetch(
        `http://localhost:3001/budget/${user.id}`
      );

      if (response.ok) {
        const budgetData = await response.json();
        setBudget(budgetData);
      }
    } catch (err) {
      console.error("Error fetching budget:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      Promise.all([fetchRecords(), fetchBudget()]).finally(() => {
        setIsLoading(false);
      });
    }
  }, [user]);

  const addRecord = async (record: FinancialRecord) => {
    try {
      const response = await fetch("http://localhost:3001/financial-records", {
        method: "POST",
        body: JSON.stringify(record),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const newRecord = await response.json();
        setRecords((prev) => [...prev, newRecord]);
      }
    } catch (err) {
      console.error("Error adding record:", err);
    }
  };

  const updateRecord = async (id: string, newRecord: FinancialRecord) => {
    try {
      const response = await fetch(
        `http://localhost:3001/financial-records/${id}`,
        {
          method: "PUT",
          body: JSON.stringify(newRecord),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const updatedRecord = await response.json();
        setRecords((prev) =>
          prev.map((record) => {
            if (record._id === id) {
              return updatedRecord;
            } else {
              return record;
            }
          })
        );
      }
    } catch (err) {
      console.error("Error updating record:", err);
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      const response = await fetch(
        `http://localhost:3001/financial-records/${id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        const deletedRecord = await response.json();
        setRecords((prev) =>
          prev.filter((record) => record._id !== deletedRecord._id)
        );
      }
    } catch (err) {
      console.error("Error deleting record:", err);
    }
  };

  const updateBudget = async (budgetData: UserBudget) => {
    if (!user) return;
    try {
      const response = await fetch(`http://localhost:3001/budget/${user.id}`, {
        method: "PUT",
        body: JSON.stringify(budgetData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const updatedBudget = await response.json();
        setBudget(updatedBudget);
      }
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