// client/services/api.ts - FIXED ATTACHMENT HANDLING
import { apiGet, apiPost, apiPut, apiDelete, apiBatchPost, ApiError } from './api-utils';

// ============================================
// TYPE DEFINITIONS
// ============================================
export interface Attachment {
  filename: string;
  mimeType: string;
  size: number;
  base64Data: string;
  uploadedAt: Date;
}

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
  attachments?: Attachment[];
  notes?: string;
}

// ============================================
// IMAGE UPLOAD HELPERS
// ============================================

export const compressImage = (file: File, maxWidth: number = 800): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 with compression (0.7 quality for JPEG)
        const base64 = canvas.toDataURL('image/jpeg', 0.7);
        resolve(base64);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB original file limit
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, GIF, and WebP images are allowed' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 5MB' };
  }

  return { valid: true };
};

export const getImageSize = (base64: string): number => {
  // Calculate approximate size from base64 string
  const padding = (base64.match(/=/g) || []).length;
  return Math.floor((base64.length * 0.75) - padding);
};

// ============================================
// FINANCIAL RECORDS API
// ============================================

export interface PaginatedRecordsResponse {
  records: FinancialRecord[];
  pagination: {
    currentPage: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
    hasMore: boolean;
    hasPrevious: boolean;
  };
}

export const fetchFinancialRecords = async (
  userId: string,
  page: number = 1,
  limit: number = 50
): Promise<PaginatedRecordsResponse> => {
  try {
    const response = await apiGet<PaginatedRecordsResponse>(
      `/financial-records/getAllByUserID/${userId}?page=${page}&limit=${limit}`
    );
    return response;
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      return {
        records: [],
        pagination: {
          currentPage: 1,
          limit,
          totalRecords: 0,
          totalPages: 0,
          hasMore: false,
          hasPrevious: false
        }
      };
    }
    throw error;
  }
};

// ✅ ENHANCED: Validate attachments before sending
export const addFinancialRecord = async (
  record: FinancialRecord | FinancialRecord[]
): Promise<FinancialRecord | FinancialRecord[]> => {
  // Validate attachments
  const records = Array.isArray(record) ? record : [record];

  for (const rec of records) {
    if (rec.attachments && rec.attachments.length > 0) {
      // Validate total size
      const totalSize = rec.attachments.reduce((sum, att) => sum + att.size, 0);
      const maxTotalSize = 2 * 1024 * 1024; // 2MB

      if (totalSize > maxTotalSize) {
        throw new Error(`Total attachments size (${(totalSize / 1024 / 1024).toFixed(2)}MB) exceeds 2MB limit`);
      }

      // Validate individual file sizes
      for (const att of rec.attachments) {
        const maxSingleSize = 500 * 1024; // 500KB
        if (att.size > maxSingleSize) {
          throw new Error(`Attachment ${att.filename} (${(att.size / 1024).toFixed(0)}KB) exceeds 500KB limit`);
        }

        // Validate MIME type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(att.mimeType)) {
          throw new Error(`Attachment ${att.filename} has invalid type: ${att.mimeType}`);
        }
      }
    }
  }

  // Send to API
  if (Array.isArray(record)) {
    return await apiBatchPost<FinancialRecord>('/financial-records', record);
  }
  return await apiPost<FinancialRecord>('/financial-records', record);
};

export const updateFinancialRecord = async (
  id: string,
  newRecord: Partial<FinancialRecord>
): Promise<FinancialRecord> => {
  // Validate attachments if being updated
  if (newRecord.attachments && newRecord.attachments.length > 0) {
    const totalSize = newRecord.attachments.reduce((sum, att) => sum + att.size, 0);
    if (totalSize > 2 * 1024 * 1024) {
      throw new Error('Total attachments size exceeds 2MB limit');
    }
  }

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

export interface IncomeSource {
  _id?: string;
  name: string;
  amount: number;
  type: 'fixed' | 'variable';
  isActive: boolean;
}

export interface UserBudget {
  _id?: string;
  userId: string;
  monthlySalary: number;
  incomeSources?: IncomeSource[];
  categoryBudgets: {
    [key: string]: number;
  };
}

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

export interface Category {
  _id?: string;
  userId: string;
  name: string;
  icon: string;
}

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

export interface TransactionTemplate {
  _id?: string;
  userId: string;
  templateName: string;
  description: string;
  amount: number;
  category: string;
  paymentMethod: string;
}

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

export interface SavingsGoal {
  _id?: string;
  userId: string;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
}

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
// DEBTS API
// ============================================

export interface Debt {
  _id?: string;
  userId: string;
  name: string;
  principal: number;
  remaining: number;
  interestRate: number; // yearly
  minimumPayment: number;
  monthlyPayment: number;
  type?: string;
  startDate?: Date;
}

export const fetchDebts = async (userId: string): Promise<Debt[]> => {
  return await apiGet<Debt[]>(`/debts/${userId}`);
};

export const addDebt = async (debt: Debt): Promise<Debt> => {
  return await apiPost<Debt>('/debts', debt);
};

export const updateDebt = async (debtId: string, debt: Partial<Debt>): Promise<Debt> => {
  return await apiPut<Debt>(`/debts/${debtId}`, debt);
};

export const payDebt = async (debtId: string, amount: number): Promise<Debt> => {
  return await apiPut<Debt>(`/debts/${debtId}/pay`, { amount });
};

export const deleteDebt = async (debtId: string): Promise<Debt> => {
  return await apiDelete<Debt>(`/debts/${debtId}`);
};

// ============================================
// RECURRING PAYMENTS API
// ============================================

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
// SHARED EXPENSES API
// ============================================

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
// OFFLINE SYNC
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

export { ApiError };