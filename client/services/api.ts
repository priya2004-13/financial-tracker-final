// client/services/api.ts - Updated with new features
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

// Existing interfaces
export interface FinancialRecord {
  _id?: string;
  userId: string;
  date: Date;
  description: string;
  amount: number;
  category: string;
  paymentMethod: string;
  isSplit?: boolean;        // Added for split transactions
  parentRecordId?: string; // Added for split transactions
}

export interface UserBudget {
  _id?: string;
  userId: string;
  monthlySalary: number;
  categoryBudgets: {
    [key: string]: number; // Allow dynamic category keys
  };
}

export interface SavingsGoal {
  _id?: string;
  userId: string;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
}

export interface RecurringPayment {
  _id?: string;
  userId: string;
  name: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
  nextPaymentDate: Date;
  category: string;
  isActive: boolean;
}

export interface Notification {
  _id?: string;
  userId: string;
  type: 'anomaly' | 'budget_warning' | 'recurring_payment' | 'goal_achieved';
  title: string;
  message: string;
  isRead: boolean;
  severity: 'info' | 'warning' | 'error' | 'success';
  metadata?: any;
  createdAt?: Date;
}

// New Interfaces
export interface Category {
  _id?: string;
  userId: string;
  name: string;
  icon: string; // Emoji
}

export interface TransactionTemplate {
    _id?: string;
    userId: string;
    templateName: string;
    description: string;
    amount: number;
    category: string;
    paymentMethod: string;
}

// --- Custom Categories API ---
export const fetchCategories = async (userId: string): Promise<Category[]> => {
    const response = await fetch(`${API_BASE_URL}/categories/${userId}`);
    if (!response.ok) throw new Error("Failed to fetch categories");
    return response.json();
};

export const addCategory = async (category: Category): Promise<Category> => {
    const response = await fetch(`${API_BASE_URL}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(category),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add category");
    }
    return response.json();
};

export const deleteCategory = async (categoryId: string): Promise<Category> => {
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
        method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete category");
    return response.json();
};


// --- Transaction Templates API ---
export const fetchTransactionTemplates = async (userId: string): Promise<TransactionTemplate[]> => {
    const response = await fetch(`${API_BASE_URL}/transaction-templates/${userId}`);
    if (!response.ok) throw new Error("Failed to fetch transaction templates");
    return response.json();
};

export const addTransactionTemplate = async (template: TransactionTemplate): Promise<TransactionTemplate> => {
    const response = await fetch(`${API_BASE_URL}/transaction-templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template),
    });
     if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add template");
    }
    return response.json();
};

export const deleteTransactionTemplate = async (templateId: string): Promise<TransactionTemplate> => {
    const response = await fetch(`${API_BASE_URL}/transaction-templates/${templateId}`, {
        method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete transaction template");
    return response.json();
};


// --- Recurring Payments API ---
export const fetchRecurringPayments = async (userId: string): Promise<RecurringPayment[]> => {
  const response = await fetch(`${API_BASE_URL}/recurring-payments/${userId}`);
  if (!response.ok) throw new Error("Failed to fetch recurring payments");
  return response.json();
};

export const addRecurringPayment = async (payment: RecurringPayment): Promise<RecurringPayment> => {
  const response = await fetch(`${API_BASE_URL}/recurring-payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payment),
  });
  if (!response.ok) throw new Error("Failed to add recurring payment");
  return response.json();
};

export const updateRecurringPayment = async (paymentId: string, payment: Partial<RecurringPayment>): Promise<RecurringPayment> => {
  const response = await fetch(`${API_BASE_URL}/recurring-payments/${paymentId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payment),
  });
  if (!response.ok) throw new Error("Failed to update recurring payment");
  return response.json();
};

export const deleteRecurringPayment = async (paymentId: string): Promise<RecurringPayment> => {
  const response = await fetch(`${API_BASE_URL}/recurring-payments/${paymentId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete recurring payment");
  return response.json();
};

// --- Notifications API ---
export const fetchNotifications = async (userId: string): Promise<Notification[]> => {
  const response = await fetch(`${API_BASE_URL}/notifications/${userId}`);
  if (!response.ok) throw new Error("Failed to fetch notifications");
  return response.json();
};

export const getUnreadCount = async (userId: string): Promise<{ count: number }> => {
  const response = await fetch(`${API_BASE_URL}/notifications/${userId}/unread-count`);
  if (!response.ok) throw new Error("Failed to fetch unread count");
  return response.json();
};

export const markNotificationAsRead = async (notificationId: string): Promise<Notification> => {
  const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
    method: "PUT",
  });
  if (!response.ok) throw new Error("Failed to mark notification as read");
  return response.json();
};

export const markAllNotificationsAsRead = async (userId: string): Promise<{ success: boolean }> => {
  const response = await fetch(`${API_BASE_URL}/notifications/${userId}/read-all`, {
    method: "PUT",
  });
  if (!response.ok) throw new Error("Failed to mark all as read");
  return response.json();
};

export const deleteNotification = async (notificationId: string): Promise<Notification> => {
  const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete notification");
  return response.json();
};

// --- AI Insights API ---
export const getFinancialSummary = async (userId: string): Promise<{ summary: string; data: any }> => {
  const response = await fetch(`${API_BASE_URL}/ai/financial-summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  if (!response.ok) throw new Error("Failed to generate financial summary");
  return response.json();
};

export const detectSpendingAnomaly = async (userId: string, amount: number, category: string): Promise<{ isAnomaly: boolean; message: string }> => {
  const response = await fetch(`${API_BASE_URL}/ai/anomaly-detection`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, amount, category }),
  });
  if (!response.ok) throw new Error("Failed to detect anomaly");
  return response.json();
};

// --- Savings Goals API ---
export const fetchSavingsGoals = async (userId: string): Promise<SavingsGoal[]> => {
  const response = await fetch(`${API_BASE_URL}/savings-goals/${userId}`);
  if (!response.ok) throw new Error("Failed to fetch savings goals");
  return response.json();
};

export const addSavingsGoal = async (goal: SavingsGoal): Promise<SavingsGoal> => {
  const response = await fetch(`${API_BASE_URL}/savings-goals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(goal),
  });
  if (!response.ok) throw new Error("Failed to add savings goal");
  return response.json();
};

export const contributeToGoal = async (goalId: string, amount: number): Promise<SavingsGoal> => {
  const response = await fetch(`${API_BASE_URL}/savings-goals/${goalId}/contribute`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });
  if (!response.ok) throw new Error("Failed to contribute to goal");
  return response.json();
};

export const deleteSavingsGoal = async (goalId: string): Promise<SavingsGoal> => {
  const response = await fetch(`${API_BASE_URL}/savings-goals/${goalId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete savings goal");
  return response.json();
};

// --- Financial Records API ---
export const fetchFinancialRecords = async (userId: string): Promise<FinancialRecord[]> => {
  const response = await fetch(`${API_BASE_URL}/financial-records/getAllByUserID/${userId}`);
  if (!response.ok) throw new Error("Failed to fetch records");
  return response.json();
};

// Modified addFinancialRecord to potentially accept an array for splits
export const addFinancialRecord = async (record: FinancialRecord | FinancialRecord[]): Promise<FinancialRecord | FinancialRecord[]> => {
  const response = await fetch(`${API_BASE_URL}/financial-records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record), // Send single object or array
  });
  if (!response.ok) throw new Error("Failed to add record(s)");
  return response.json();
};


export const updateFinancialRecord = async (id: string, newRecord: FinancialRecord): Promise<FinancialRecord> => {
  const response = await fetch(`${API_BASE_URL}/financial-records/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newRecord),
  });
  if (!response.ok) throw new Error("Failed to update record");
  return response.json();
};

export const deleteFinancialRecord = async (id: string): Promise<FinancialRecord> => {
  const response = await fetch(`${API_BASE_URL}/financial-records/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete record");
  return response.json();
};

export const suggestCategory = async (description: string): Promise<{ category: string }> => {
  const response = await fetch(`${API_BASE_URL}/financial-records/suggest-category`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });
  if (!response.ok) throw new Error("Failed to suggest category");
  return response.json();
};

// --- Budget API ---
export const fetchBudget = async (userId: string): Promise<UserBudget> => {
    try {
      const response = await fetch(`${API_BASE_URL}/budget/${userId}`);
      if (!response.ok) {
        if (response.status === 404) {
          // If no budget found, return a default structure or handle as needed
          console.log("No budget found for user, returning default.");
          // You might return null or a default budget object
           return {
             userId: userId,
             monthlySalary: 0,
             categoryBudgets: { Food: 0, Rent: 0, Utilities: 0, Entertainment: 0, Other: 0 }
           };
        }
        throw new Error("Failed to fetch budget");
      }
      return response.json();
    } catch (error) {
      console.error("Error fetching budget:", error);
      // Return a default structure or null in case of any error
      return {
        userId: userId,
        monthlySalary: 0,
        categoryBudgets: { Food: 0, Rent: 0, Utilities: 0, Entertainment: 0, Other: 0 }
      };
    }
  };

export const updateBudget = async (userId: string, budgetData: UserBudget): Promise<UserBudget> => {
  const response = await fetch(`${API_BASE_URL}/budget/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(budgetData),
  });
  if (!response.ok) throw new Error("Failed to update budget");
  return response.json();
};

export const deleteBudget = async (userId: string): Promise<UserBudget> => {
  const response = await fetch(`${API_BASE_URL}/budget/${userId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete budget");
  return response.json();
};

// --- Offline Sync ---
const OFFLINE_RECORDS_KEY = 'offline_financial_records';

export const saveOfflineRecord = (record: FinancialRecord) => {
    const offlineRecords = JSON.parse(localStorage.getItem(OFFLINE_RECORDS_KEY) || '[]');
    offlineRecords.push(record);
    localStorage.setItem(OFFLINE_RECORDS_KEY, JSON.stringify(offlineRecords));
};

export const getOfflineRecords = (): FinancialRecord[] => {
    return JSON.parse(localStorage.getItem(OFFLINE_RECORDS_KEY) || '[]');
};

export const clearOfflineRecords = () => {
    localStorage.removeItem(OFFLINE_RECORDS_KEY);
};
