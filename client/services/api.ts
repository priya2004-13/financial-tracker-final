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

// --- Financial Records API Functions ---

/**
 * Fetches all financial records for a given user.
 * @param userId - The ID of the user.
 * @returns A promise that resolves to an array of financial records.
 */
export const fetchFinancialRecords = async (userId: string): Promise<FinancialRecord[]> => {
  const response = await fetch(`${API_BASE_URL}/financial-records/getAllByUserID/${userId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch records");
  }
  return response.json();
};

/**
 * Adds a new financial record. The category is determined by the AI on the backend.
 * @param record - The financial record to add.
 * @returns A promise that resolves to the newly created record.
 */
export const addFinancialRecord = async (record: FinancialRecord): Promise<FinancialRecord> => {
  const response = await fetch(`${API_BASE_URL}/financial-records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });
  if (!response.ok) {
    throw new Error("Failed to add record");
  }
  return response.json();
};

/**
 * Updates an existing financial record.
 * @param id - The ID of the record to update.
 * @param newRecord - The updated financial record data.
 * @returns A promise that resolves to the updated record.
 */
export const updateFinancialRecord = async (id: string, newRecord: FinancialRecord): Promise<FinancialRecord> => {
  const response = await fetch(`${API_BASE_URL}/financial-records/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newRecord),
  });
  if (!response.ok) {
    throw new Error("Failed to update record");
  }
  return response.json();
};

/**
 * Deletes a financial record.
 * @param id - The ID of the record to delete.
 * @returns A promise that resolves to the deleted record.
 */
export const deleteFinancialRecord = async (id: string): Promise<FinancialRecord> => {
  const response = await fetch(`${API_BASE_URL}/financial-records/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete record");
  }
  return response.json();
};

// --- AI-Powered Category Suggestion ---

/**
 * Suggests a category for a given expense description using the Gemini API.
 * @param description - The expense description.
 * @returns A promise that resolves to an object containing the suggested category.
 */
export const suggestCategory = async (description: string): Promise<{ category: string }> => {
  const response = await fetch(`${API_BASE_URL}/financial-records/suggest-category`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });
  if (!response.ok) {
    throw new Error("Failed to suggest category");
  }
  return response.json();
};

// --- Budget API Functions ---

/**
 * Fetches the budget for a given user.
 * @param userId - The ID of the user.
 * @returns A promise that resolves to the user's budget.
 */
export const fetchBudget = async (userId: string): Promise<UserBudget> => {
  const response = await fetch(`${API_BASE_URL}/budget/${userId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch budget");
  }
  return response.json();
};

/**
 * Creates or updates the budget for a given user.
 * @param userId - The ID of the user.
 * @param budgetData - The budget data to update.
 * @returns A promise that resolves to the updated budget.
 */
export const updateBudget = async (userId: string, budgetData: UserBudget): Promise<UserBudget> => {
  const response = await fetch(`${API_BASE_URL}/budget/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(budgetData),
  });
  if (!response.ok) {
    throw new Error("Failed to update budget");
  }
  return response.json();
};

/**
 * Deletes the budget for a given user.
 * @param userId - The ID of the user.
 * @returns A promise that resolves to the deleted budget.
 */
export const deleteBudget = async (userId: string): Promise<UserBudget> => {
    const response = await fetch(`${API_BASE_URL}/budget/${userId}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        throw new Error("Failed to delete budget");
    }
    return response.json();
};