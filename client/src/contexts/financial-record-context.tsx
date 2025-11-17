// client/src/contexts/financial-record-context.tsx - Updated for Offline Mode & Categories
import { useUser } from "@clerk/clerk-react";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  FinancialRecord as FinancialRecordType,
  UserBudget,
  // Import Category type
  fetchFinancialRecords,
  addFinancialRecord,
  updateFinancialRecord,
  deleteFinancialRecord,
  fetchBudget,
  updateBudget as apiUpdateBudget,
  fetchCategories, // Import category API functions
  addCategory as apiAddCategory,
  deleteCategory as apiDeleteCategory,
  saveOfflineRecord, // Import offline functions
  getOfflineRecords,
  clearOfflineRecords,
  Category,
  Attachment,
} from "../../services/api";

export interface FinancialRecord extends FinancialRecordType { }

interface FinancialRecordsContextType {
  attachments?: Attachment[];
  notes?: string;
  records: FinancialRecord[];
  budget: UserBudget | null;
  categories: Category[]; // Add categories state
  addRecord: (record: FinancialRecord | FinancialRecord[]) => void; // Allow array for split
  updateRecord: (id: string, newRecord: FinancialRecord) => void;
  deleteRecord: (id: string) => void;
  updateBudget: (budget: UserBudget) => void;
  setUserSalary: (salary: number, persist?: boolean) => void;
  addCategory: (category: Category) => void; // Add category functions
  deleteCategory: (id: string) => void;
  isLoading: boolean;
  syncOfflineRecords: () => Promise<void>; // Function to manually trigger sync if needed
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
  const [categories, setCategories] = useState<Category[]>([]); // State for categories
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { user } = useUser();

  // Sync offline records
  const syncOfflineRecords = useCallback(async () => {
    if (!navigator.onLine || !user) return; // Only sync if online and user exists
    const offlineRecords = getOfflineRecords();
    if (offlineRecords.length === 0) return;

    console.log(`Syncing ${offlineRecords.length} offline records...`);
    try {
      // Send offline records to the backend
      // Adjust if your backend expects a specific format or endpoint for bulk/offline sync
      for (const record of offlineRecords) {
        // Assuming addFinancialRecord can handle single record submission
        // If you have a bulk endpoint, use that instead.
        // Assign the correct userId before sending
        record.userId = user.id;
        await addFinancialRecord(record);
      }
      clearOfflineRecords(); // Clear local storage after successful sync
      console.log("Offline records synced successfully.");
      // Refetch records from server to ensure UI consistency
      await fetchAllData();
    } catch (err) {
      console.error("Error syncing offline records:", err);
      // Optionally notify the user about the sync failure
    }
  }, [user]); // Add user dependency

  // Fetch all data (records, budget, categories)
  const fetchAllData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      await Promise.all([
        fetchFinancialRecords(user.id, 1, 50).then(response => setRecords(response.records)).catch(console.error),
        fetchBudget(user.id).then(setBudget).catch(console.error),
        fetchCategories(user.id).then(setCategories).catch(console.error), // Fetch categories
      ]);
      await syncOfflineRecords(); // Attempt sync after fetching initial data
    } catch (error) {
      console.error("Error fetching initial data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, syncOfflineRecords]); // Added syncOfflineRecords dependency


  useEffect(() => {
    // Initial fetch
    fetchAllData();

    // Online/Offline event listeners
    const handleOnline = () => {
      console.log("App is online.");
      setIsOnline(true);
      syncOfflineRecords(); // Sync when coming online
    };
    const handleOffline = () => {
      console.log("App is offline.");
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, fetchAllData, syncOfflineRecords]); // Added fetchAllData and syncOfflineRecords

  const addRecord = async (recordData: FinancialRecord | FinancialRecord[]) => {
    // Ensure userId is set for all records being added
    const recordsToAdd = (Array.isArray(recordData) ? recordData : [recordData]).map(r => ({
      ...r,
      userId: user?.id ?? "", // Ensure userId is present
    }));

    if (!isOnline) {
      console.log("Offline: Saving record locally.");
      recordsToAdd.forEach(record => saveOfflineRecord(record));
      // Optimistically update UI - create temporary IDs for offline records
      const tempRecords = recordsToAdd.map(r => ({ ...r, _id: `offline_${Date.now()}_${Math.random()}` }));
      setRecords((prev) => [...prev, ...tempRecords]);
      return; // Stop here if offline
    }

    // If online, proceed to send to API
    try {
      const addedData = await addFinancialRecord(recordsToAdd.length === 1 ? recordsToAdd[0] : recordsToAdd);
      const newRecords = Array.isArray(addedData) ? addedData : [addedData];
      setRecords((prev) => [...prev, ...newRecords]);
    } catch (err) {
      console.error("Error adding record:", err);
      // Optionally handle API error (e.g., notify user, maybe save offline as fallback)
    }
  };


  const updateRecord = async (id: string, newRecord: FinancialRecord) => {
    if (!isOnline) {
      // Basic offline update - update local storage and state
      console.warn("Offline: Update functionality limited.");
      // Find and update in local storage if necessary (more complex)
      setRecords((prev) =>
        prev.map((r) => (r._id === id ? { ...newRecord, _id: id } : r))
      );
      return;
    }
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
    if (id.startsWith('offline_')) {
      // Handle deletion of offline-only record
      const offlineRecords = getOfflineRecords().filter(r => r._id !== id);
      localStorage.setItem('offline_financial_records', JSON.stringify(offlineRecords));
      setRecords((prev) => prev.filter((record) => record._id !== id));
      console.log("Deleted offline record locally.");
      return;
    }

    if (!isOnline) {
      console.warn("Offline: Deletion will sync when back online.");
      // Mark for deletion in local storage (more complex) or simply remove from UI
      setRecords((prev) => prev.filter((record) => record._id !== id));
      // Add logic here to store deletion request locally if needed
      return;
    }

    try {
      await deleteFinancialRecord(id);
      setRecords((prev) => prev.filter((record) => record._id !== id));
    } catch (err) {
      console.error("Error deleting record:", err);
    }
  };

  const updateBudget = async (budgetData: UserBudget) => {
    if (!user || !isOnline) {
      console.warn('⚠️ Cannot update budget: user not logged in or offline');
      return;
    }
    try {
      // If incomeSources provided, compute total and set monthlySalary to that sum
      if (budgetData.incomeSources && Array.isArray(budgetData.incomeSources)) {
        const total = budgetData.incomeSources
          .filter((s: any) => s.isActive)
          .reduce((sum: number, s: any) => sum + (s.amount || 0), 0);
        if (total > 0) {
          budgetData.monthlySalary = total;
        }
      }
      console.log('📤 Sending budget update to server:', budgetData);
      const updatedBudget = await apiUpdateBudget(user.id, budgetData);
      console.log('📥 Received updated budget from server:', updatedBudget);
      setBudget(updatedBudget);
    } catch (err) {
      console.error("❌ Error updating budget:", err);
      throw err; // Re-throw to let the caller handle it
    }
  };

  // Set user salary globally and sync to backend
  const setUserSalary = async (salary: number, persist: boolean = true) => {
    if (!user) return;

    // Create a default budget object if not present
    const updatedBudget: UserBudget = {
      _id: budget?._id,
      userId: budget?.userId || user.id,
      monthlySalary: salary,
      categoryBudgets: budget?.categoryBudgets || {}
    };

    // Update local state immediately
    setBudget(updatedBudget);

    if (!isOnline) {
      console.warn('⚠️ Offline: Salary updated locally but will be persisted when online');
      return;
    }

    // Persist to server if required
    if (persist) {
      await updateBudget(updatedBudget);
    }
  };

  // Category Management Functions
  const addCategory = async (category: Category) => {
    if (!user || !isOnline) return; // Add online check
    try {
      // Ensure userId is set
      const categoryToAdd = { ...category, userId: user.id };
      const newCategory = await apiAddCategory(categoryToAdd);
      setCategories((prev) => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name))); // Keep sorted
    } catch (err) {
      console.error("Error adding category:", err);
      // Rethrow or handle error (e.g., show notification)
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    if (!isOnline) return; // Add online check
    try {
      await apiDeleteCategory(id);
      setCategories((prev) => prev.filter((category) => category._id !== id));
    } catch (err) {
      console.error("Error deleting category:", err);
    }
  };


  return (
    <FinancialRecordsContext.Provider
      value={{ records, budget, categories, addRecord, updateRecord, deleteRecord, updateBudget, setUserSalary, addCategory, deleteCategory, isLoading, syncOfflineRecords }}
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
