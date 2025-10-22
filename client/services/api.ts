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
}

export interface SavingsGoal {
  _id?: string;
  userId: string;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
}

// New interfaces
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

export const detectSpendingAnomaly = async (userId: string, amount: number, category: string) => {
  const response = await fetch(`${API_BASE_URL}/ai/anomaly-detection`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, amount, category }),
  });
  if (!response.ok) throw new Error("Failed to detect anomaly");
  return response.json();
};

// Keep all existing API functions below...
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

export const fetchFinancialRecords = async (userId: string): Promise<FinancialRecord[]> => {
  const response = await fetch(`${API_BASE_URL}/financial-records/getAllByUserID/${userId}`);
  if (!response.ok) throw new Error("Failed to fetch records");
  return response.json();
};

export const addFinancialRecord = async (record: FinancialRecord): Promise<FinancialRecord> => {
  const response = await fetch(`${API_BASE_URL}/financial-records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });
  if (!response.ok) throw new Error("Failed to add record");
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

export const fetchBudget = async (userId: string): Promise<UserBudget> => {
  const response = await fetch(`${API_BASE_URL}/budget/${userId}`);
  if (!response.ok) throw new Error("Failed to fetch budget");
  return response.json();
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