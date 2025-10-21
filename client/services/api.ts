// The base URL for the API, configured for both development and production
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

// Interfaces to define the shape of our data
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
// --- Savings Goals API Functions ---

export interface SavingsGoal {
  _id?: string;
  userId: string;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
}

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



// --- Financial Records API Functions ---

/**
 * Corresponds to: GET /financial-records/getAllByUserID/:userId
 */
export const fetchFinancialRecords = async (userId: string): Promise<FinancialRecord[]> => {
  const response = await fetch(`${API_BASE_URL}/financial-records/getAllByUserID/${userId}`);
  if (!response.ok) throw new Error("Failed to fetch records");
  return response.json();
};

/**
 * Corresponds to: POST /financial-records
 */
export const addFinancialRecord = async (record: FinancialRecord): Promise<FinancialRecord> => {
  const response = await fetch(`${API_BASE_URL}/financial-records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });
  if (!response.ok) throw new Error("Failed to add record");
  return response.json();
};

/**
 * Corresponds to: PUT /financial-records/:id
 */
export const updateFinancialRecord = async (id: string, newRecord: FinancialRecord): Promise<FinancialRecord> => {
  const response = await fetch(`${API_BASE_URL}/financial-records/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newRecord),
  });
  if (!response.ok) throw new Error("Failed to update record");
  return response.json();
};

/**
 * Corresponds to: DELETE /financial-records/:id
 */
export const deleteFinancialRecord = async (id: string): Promise<FinancialRecord> => {
  const response = await fetch(`${API_BASE_URL}/financial-records/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete record");
  return response.json();
};

// --- AI-Powered Category Suggestion ---

/**
 * Corresponds to: POST /financial-records/suggest-category
 */
export const suggestCategory = async (description: string): Promise<{ category: string }> => {
  const response = await fetch(`${API_BASE_URL}/financial-records/suggest-category`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });
  if (!response.ok) throw new Error("Failed to suggest category");
  return response.json();
};

// --- Budget API Functions ---

/**
 * Corresponds to: GET /budget/:userId
 */
export const fetchBudget = async (userId: string): Promise<UserBudget> => {
  const response = await fetch(`${API_BASE_URL}/budget/${userId}`);
  if (!response.ok) throw new Error("Failed to fetch budget");
  return response.json();
};

/**
 * Corresponds to: PUT /budget/:userId
 */
export const updateBudget = async (userId: string, budgetData: UserBudget): Promise<UserBudget> => {
  const response = await fetch(`${API_BASE_URL}/budget/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(budgetData),
  });
  if (!response.ok) throw new Error("Failed to update budget");
  return response.json();
};

/**
 * Corresponds to: DELETE /budget/:userId
 */
export const deleteBudget = async (userId: string): Promise<UserBudget> => {
  const response = await fetch(`${API_BASE_URL}/budget/${userId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete budget");
  return response.json();
};