// client/services/api.ts - REFACTORED WITH UTILITIES
import { apiGet, apiPost, apiPut, apiDelete, apiBatchPost, ApiError } from './api-utils';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface FinancialRecord {
  _id?: string;
  userId: string;
  date: Date;
  description: string;
  amount: number;
  category: string;
  paymentMethod: string;
  isSplit?: boolean;
  parentRecordId?: string;
}

export interface UserBudget {
  _id?: string;
  userId: string;
  monthlySalary: number;
  categoryBudgets: {
    [key: string]: number;
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

export interface Category {
  _id?: string;
  userId: string;
  name: string;
  icon: string;
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

export interface SharedExpense {
  _id?: string;
  groupId: string;
  groupName: string;
  createdBy: string;
  createdByName: string;
  date: Date;
  description: string;
  totalAmount: number;
  category: string;
  paymentMethod: string;
  paidBy: string;
  paidByName: string;
  splitType: 'equal' | 'custom' | 'percentage';
  participants: Array<{
    userId: string;
    userName: string;
    amountOwed: number;
    hasPaid: boolean;
  }>;
}

// ============================================
// FINANCIAL RECORDS API
// ============================================

export const fetchFinancialRecords = async (userId: string): Promise<FinancialRecord[]> => {
  try {
    return await apiGet<FinancialRecord[]>(`/financial-records/getAllByUserID/${userId}`);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      return [];
    }
    throw error;
  }
};

export const addFinancialRecord = async (
  record: FinancialRecord | FinancialRecord[]
): Promise<FinancialRecord | FinancialRecord[]> => {
  if (Array.isArray(record)) {
    return await apiBatchPost<FinancialRecord>('/financial-records', record);
  }
  return await apiPost<FinancialRecord>('/financial-records', record);
};

export const updateFinancialRecord = async (
  id: string,
  newRecord: Partial<FinancialRecord>
): Promise<FinancialRecord> => {
  return await apiPut<FinancialRecord>(`/financial-records/${id}`, newRecord);
};

export const deleteFinancialRecord = async (id: string): Promise<FinancialRecord> => {
  return await apiDelete<FinancialRecord>(`/financial-records/${id}`);
};

export const suggestCategory = async (description: string): Promise<{ category: string }> => {
  return await apiPost<{ category: string }>('/financial-records/suggest-category', { description });
};

// ============================================
// BUDGET API
// ============================================

export const fetchBudget = async (userId: string): Promise<UserBudget> => {
  try {
    return await apiGet<UserBudget>(`/budget/${userId}`);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      return {
        userId: userId,
        monthlySalary: 0,
        categoryBudgets: { Food: 0, Rent: 0, Utilities: 0, Entertainment: 0, Other: 0 }
      };
    }
    throw error;
  }
};

export const updateBudget = async (userId: string, budgetData: UserBudget): Promise<UserBudget> => {
  return await apiPut<UserBudget>(`/budget/${userId}`, budgetData);
};

export const deleteBudget = async (userId: string): Promise<UserBudget> => {
  return await apiDelete<UserBudget>(`/budget/${userId}`);
};

// ============================================
// CATEGORIES API
// ============================================

export const fetchCategories = async (userId: string): Promise<Category[]> => {
  return await apiGet<Category[]>(`/categories/${userId}`);
};

export const addCategory = async (category: Category): Promise<Category> => {
  return await apiPost<Category>('/categories', category);
};

export const deleteCategory = async (categoryId: string): Promise<Category> => {
  return await apiDelete<Category>(`/categories/${categoryId}`);
};

// ============================================
// TRANSACTION TEMPLATES API
// ============================================

export const fetchTransactionTemplates = async (userId: string): Promise<TransactionTemplate[]> => {
  return await apiGet<TransactionTemplate[]>(`/transaction-templates/${userId}`);
};

export const addTransactionTemplate = async (template: TransactionTemplate): Promise<TransactionTemplate> => {
  return await apiPost<TransactionTemplate>('/transaction-templates', template);
};

export const deleteTransactionTemplate = async (templateId: string): Promise<TransactionTemplate> => {
  return await apiDelete<TransactionTemplate>(`/transaction-templates/${templateId}`);
};

// ============================================
// SAVINGS GOALS API
// ============================================

export const fetchSavingsGoals = async (userId: string): Promise<SavingsGoal[]> => {
  return await apiGet<SavingsGoal[]>(`/savings-goals/${userId}`);
};

export const addSavingsGoal = async (goal: SavingsGoal): Promise<SavingsGoal> => {
  return await apiPost<SavingsGoal>('/savings-goals', goal);
};

export const contributeToGoal = async (goalId: string, amount: number): Promise<SavingsGoal> => {
  return await apiPut<SavingsGoal>(`/savings-goals/${goalId}/contribute`, { amount });
};

export const deleteSavingsGoal = async (goalId: string): Promise<SavingsGoal> => {
  return await apiDelete<SavingsGoal>(`/savings-goals/${goalId}`);
};

// ============================================
// RECURRING PAYMENTS API
// ============================================

export const fetchRecurringPayments = async (userId: string): Promise<RecurringPayment[]> => {
  return await apiGet<RecurringPayment[]>(`/recurring-payments/${userId}`);
};

export const addRecurringPayment = async (payment: RecurringPayment): Promise<RecurringPayment> => {
  return await apiPost<RecurringPayment>('/recurring-payments', payment);
};

export const updateRecurringPayment = async (
  paymentId: string,
  payment: Partial<RecurringPayment>
): Promise<RecurringPayment> => {
  return await apiPut<RecurringPayment>(`/recurring-payments/${paymentId}`, payment);
};

export const deleteRecurringPayment = async (paymentId: string): Promise<RecurringPayment> => {
  return await apiDelete<RecurringPayment>(`/recurring-payments/${paymentId}`);
};

// ============================================
// NOTIFICATIONS API
// ============================================

export const fetchNotifications = async (userId: string): Promise<Notification[]> => {
  return await apiGet<Notification[]>(`/notifications/${userId}`);
};

export const getUnreadCount = async (userId: string): Promise<{ count: number }> => {
  return await apiGet<{ count: number }>(`/notifications/${userId}/unread-count`);
};

export const markNotificationAsRead = async (notificationId: string): Promise<Notification> => {
  return await apiPut<Notification>(`/notifications/${notificationId}/read`);
};

export const markAllNotificationsAsRead = async (userId: string): Promise<{ success: boolean }> => {
  return await apiPut<{ success: boolean }>(`/notifications/${userId}/read-all`);
};

export const deleteNotification = async (notificationId: string): Promise<Notification> => {
  return await apiDelete<Notification>(`/notifications/${notificationId}`);
};

// ============================================
// AI INSIGHTS API
// ============================================

export const getFinancialSummary = async (userId: string): Promise<{ summary: string; data: any }> => {
  return await apiPost<{ summary: string; data: any }>('/ai/financial-summary', { userId });
};

export const detectSpendingAnomaly = async (
  userId: string,
  amount: number,
  category: string
): Promise<{ isAnomaly: boolean; message: string }> => {
  return await apiPost<{ isAnomaly: boolean; message: string }>('/ai/anomaly-detection', {
    userId,
    amount,
    category
  });
};

// ============================================
// SHARED EXPENSES API (NEW)
// ============================================

export const fetchSharedExpensesByGroup = async (groupId: string): Promise<SharedExpense[]> => {
  return await apiGet<SharedExpense[]>(`/shared-expenses/group/${groupId}`);
};

export const fetchSharedExpensesByUser = async (userId: string): Promise<SharedExpense[]> => {
  return await apiGet<SharedExpense[]>(`/shared-expenses/user/${userId}`);
};

export const getSharedExpenseBalance = async (
  groupId: string,
  userId: string
): Promise<{ totalOwed: number; totalOwedToUser: number; netBalance: number }> => {
  return await apiGet(`/shared-expenses/balance/${groupId}/${userId}`);
};

export const createSharedExpense = async (expense: Partial<SharedExpense>): Promise<SharedExpense> => {
  return await apiPost<SharedExpense>('/shared-expenses', expense);
};

export const markSharedExpensePaid = async (expenseId: string, userId: string): Promise<SharedExpense> => {
  return await apiPut<SharedExpense>(`/shared-expenses/${expenseId}/mark-paid/${userId}`);
};

export const deleteSharedExpense = async (expenseId: string): Promise<SharedExpense> => {
  return await apiDelete<SharedExpense>(`/shared-expenses/${expenseId}`);
};

// ============================================
// OFFLINE SYNC (Keep existing implementation)
// ============================================

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

// Export ApiError for use in components
export { ApiError };