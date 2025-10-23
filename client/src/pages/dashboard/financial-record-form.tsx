// client/src/pages/dashboard/financial-record-form.tsx - Enhanced with Split, Templates
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useUser } from "@clerk/clerk-react";
import { useFinancialRecords } from "../../contexts/financial-record-context";
import {
  suggestCategory as apiSuggestCategory,
  detectSpendingAnomaly,
  addTransactionTemplate,
  fetchTransactionTemplates,
  TransactionTemplate // Import TransactionTemplate type
} from "../../../services/api";
import {
  AlertTriangle,
  Calendar,
  DollarSign,
  Tag,
  CreditCard,
  FileText,
  Save,
  Loader,
  Copy,
  PlusCircle,
  X,
  Split, // Import Split icon
  Trash2
} from "lucide-react";
import "./RecordForm.css"; // Assuming shared styles

// Interface for each split item in the modal
interface SplitItem {
  id: number;
  description: string;
  amount: string;
  category: string;
}

export const FinancialRecordForm = () => {
  // Main form state
  const [description, setDescription] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [templateName, setTemplateName] = useState<string>(""); // For saving template
  const [showTemplateNameInput, setShowTemplateNameInput] = useState<boolean>(false);

  // Context and user info
  const { addRecord, categories, addCategory } = useFinancialRecords(); // Get categories from context
  const { user } = useUser();

  // Helper states
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [anomalyWarning, setAnomalyWarning] = useState<string | null>(null);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState<boolean>(false);
  const [splitItems, setSplitItems] = useState<SplitItem[]>([
    { id: 1, description: "", amount: "", category: "" },
  ]);
  const [templates, setTemplates] = useState<TransactionTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState<boolean>(false);


  // --- Effects ---

  // Fetch templates on mount
   const loadTemplates = useCallback(async () => {
    if (user) {
      try {
        const fetchedTemplates = await fetchTransactionTemplates(user.id);
        setTemplates(fetchedTemplates);
      } catch (err) {
        console.error("Error fetching templates:", err);
      }
    }
  }, [user]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);


  // Suggest category based on description
  useEffect(() => {
    if (description.length < 3) return; // Only suggest for longer descriptions
    const timer = setTimeout(() => {
      suggestCategory(description);
    }, 1000); // Debounce suggestion

    return () => clearTimeout(timer);
  }, [description]);

  // Check for spending anomalies
  useEffect(() => {
    if (
      amount &&
      category &&
      category !== "Salary" &&
      parseFloat(amount) > 0 &&
      !isSplitModalOpen // Don't check anomaly while splitting
    ) {
      const timer = setTimeout(() => {
        checkAnomaly(parseFloat(amount), category);
      }, 1500); // Debounce anomaly check

      return () => clearTimeout(timer);
    } else {
      setAnomalyWarning(null); // Clear warning if conditions not met
    }
  }, [amount, category, isSplitModalOpen]); // Add isSplitModalOpen dependency

  // --- API Calls ---

  const suggestCategory = async (desc: string) => {
    if (!desc || isSuggesting || category) return; // Don't suggest if already set or empty
    setIsSuggesting(true);
    try {
      const { category: suggestedCategory } = await apiSuggestCategory(desc);
      setCategory(suggestedCategory); // Auto-select suggested category
    } catch (err) {
      console.error("Error suggesting category:", err);
    } finally {
      setIsSuggesting(false);
    }
  };

  const checkAnomaly = async (numAmount: number, cat: string) => {
    if (!user) return;
    try {
      const result = await detectSpendingAnomaly(user.id, numAmount, cat);
      if (result.isAnomaly) {
        setAnomalyWarning(result.message);
      } else {
        setAnomalyWarning(null);
      }
    } catch (err) {
      console.error("Error checking anomaly:", err);
      setAnomalyWarning(null); // Clear warning on error
    }
  };

   // --- Form Handlers ---

   const resetForm = () => {
    setDescription("");
    setAmount("");
    setCategory("");
    setPaymentMethod("");
    setAnomalyWarning(null);
    setShowTemplateNameInput(false);
    setTemplateName("");
    setIsSplitModalOpen(false); // Close split modal on reset
    setSplitItems([{ id: 1, description: "", amount: "", category: "" }]); // Reset splits
  };


  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    const newRecord = {
      userId: user.id,
      date: new Date(),
      description: description,
      amount: parseFloat(amount),
      category: category,
      paymentMethod: paymentMethod,
    };

    addRecord(newRecord); // Use context addRecord (handles offline)
    resetForm();
  };

  // --- Split Transaction Logic ---
  const openSplitModal = () => {
    setSplitItems([{ id: 1, description: description, amount: amount, category: category }]); // Pre-fill first item
    setIsSplitModalOpen(true);
  };

  const closeSplitModal = () => {
    setIsSplitModalOpen(false);
    setSplitItems([{ id: 1, description: "", amount: "", category: "" }]); // Reset on close
  };

  const addSplitItem = () => {
    setSplitItems([
      ...splitItems,
      { id: Date.now(), description: "", amount: "", category: "" },
    ]);
  };

   const removeSplitItem = (id: number) => {
    if (splitItems.length <= 1) return; // Keep at least one item
    setSplitItems(splitItems.filter((item) => item.id !== id));
  };

  const handleSplitItemChange = (
    id: number,
    field: keyof SplitItem,
    value: string
  ) => {
    setSplitItems(
      splitItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSplitSubmit = () => {
    if (!user) return;

    const totalSplitAmount = splitItems.reduce(
      (sum, item) => sum + (parseFloat(item.amount) || 0),
      0
    );

    // Basic validation: ensure amounts are numbers and total matches original amount (if pre-filled)
    if (splitItems.some(item => isNaN(parseFloat(item.amount))) || totalSplitAmount <= 0) {
      alert("Please ensure all split amounts are valid numbers and the total is greater than zero.");
      return;
    }
     // Optional: Check if total split amount matches the original amount if it was entered first
     const originalAmount = parseFloat(amount);
     if (!isNaN(originalAmount) && originalAmount > 0 && Math.abs(totalSplitAmount - originalAmount) > 0.01) {
       if (!window.confirm(`The split total (₹${totalSplitAmount.toFixed(2)}) doesn't match the original amount (₹${originalAmount.toFixed(2)}). Do you want to continue?`)) {
         return;
       }
     }


    const recordsToSave = splitItems.map((item) => ({
      userId: user.id,
      date: new Date(),
      description: item.description || description || "Split Transaction", // Use item desc, main desc, or default
      amount: parseFloat(item.amount),
      category: item.category || "Other", // Default to 'Other' if not selected
      paymentMethod: paymentMethod || "Cash", // Use main payment method or default
      isSplit: true, // Mark as split
      // parentRecordId will be handled by the context/API call
    }));

    addRecord(recordsToSave); // Send array to context function
    resetForm(); // Reset main form and close modal
  };

  // --- Template Logic ---
  const handleSaveTemplate = async () => {
    if (!templateName || !user) return;
    const templateData: TransactionTemplate = {
      userId: user.id,
      templateName,
      description,
      amount: parseFloat(amount),
      category,
      paymentMethod,
    };
    try {
      await addTransactionTemplate(templateData);
      alert(`Template "${templateName}" saved!`);
      setShowTemplateNameInput(false);
      setTemplateName("");
      await loadTemplates(); // Reload templates
    } catch (err: any) {
      console.error("Error saving template:", err);
      alert(`Error saving template: ${err.message || 'Please try again.'}`);
    }
  };

  const applyTemplate = (template: TransactionTemplate) => {
    setDescription(template.description);
    setAmount(template.amount.toString());
    setCategory(template.category);
    setPaymentMethod(template.paymentMethod);
    setShowTemplates(false); // Close template list after applying
  };

   // Combine default and custom categories
   const allCategories = useMemo(() => {
    const defaultCategories = ["Food", "Rent", "Salary", "Utilities", "Entertainment", "Other"];
    const customCategoryNames = categories.map(c => c.name);
    // Combine and remove duplicates, then sort
    return [...new Set([...defaultCategories, ...customCategoryNames])].sort();
  }, [categories]);

  // --- Render ---

  return (
    <div className="form-container">
      {/* Header */}
      <div className="form-header">
        <div className="form-icon">
          <FileText size={20} />
        </div>
        <h2 className="form-title">Add Transaction</h2>
         {/* Template Button */}
         <button
            type="button"
            className="btn-secondary btn-small" // Add appropriate styling
            onClick={() => setShowTemplates(!showTemplates)}
            title="Use Template"
            style={{ marginLeft: 'auto' }} // Position button to the right
          >
            <Copy size={16} /> Templates
          </button>
      </div>

       {/* Template List (Conditional Rendering) */}
       {showTemplates && (
        <div className="template-list-container">
          {templates.length === 0 ? (
            <p>No templates saved yet.</p>
          ) : (
            <ul className="template-list">
              {templates.map(template => (
                <li key={template._id} onClick={() => applyTemplate(template)}>
                  <span>{template.templateName} ({template.description} - ₹{template.amount})</span>
                </li>
              ))}
            </ul>
          )}
           <button type="button" onClick={() => setShowTemplates(false)} className="btn-close-templates">Close</button>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="form-fields">
        {/* Description */}
        <div className="form-field">
          <label className="form-label">
            <FileText size={16} /> Description
          </label>
          <input
            className="form-input form-input-animated"
            type="text"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Grocery shopping"
          />
        </div>

        {/* Amount */}
        <div className="form-field">
          <label className="form-label">
            <DollarSign size={16} /> Amount
          </label>
          <input
            className="form-input form-input-animated"
            type="number"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0.01" // Ensure positive amount
          />
        </div>

        {/* Category */}
         <div className="form-field">
          <label className="form-label">
            <Tag size={16} /> Category {isSuggesting && <Loader size={14} className="spinner"/>}
          </label>
          <select
            required
            className="form-input form-input-animated"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select a Category</option>
            {allCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Payment Method */}
        <div className="form-field">
          <label className="form-label">
            <CreditCard size={16} /> Payment Method
          </label>
          <select
            required
            className="form-input form-input-animated"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="">Select a Payment Method</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            {/* Add more common payment methods */}
            <option value="Debit Card">Debit Card</option>
            <option value="UPI">UPI</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Anomaly Warning */}
        {anomalyWarning && !isSplitModalOpen && (
          <div className="anomaly-warning">
            <AlertTriangle size={16} />
            <span>{anomalyWarning}</span>
          </div>
        )}

        {/* Action Buttons: Add, Split, Save Template */}
         <div className="form-action-buttons">
            <button type="submit" className="form-submit btn-primary ripple-button">
            <PlusCircle size={18} /> Add Record
            </button>
            <button
            type="button"
            className="btn-secondary ripple-button"
            onClick={openSplitModal}
            title="Split Transaction"
            >
            <Split size={18} /> Split
            </button>
            <button
            type="button"
            className="btn-secondary ripple-button"
            onClick={() => setShowTemplateNameInput(true)}
            disabled={!description || !amount || !category || !paymentMethod}
            title="Save as Template"
            >
            <Save size={18} /> Template
            </button>
        </div>

         {/* Template Name Input (Conditional) */}
         {showTemplateNameInput && (
          <div className="template-save-section">
            <input
              type="text"
              className="form-input form-input-animated"
              placeholder="Enter Template Name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              required
            />
             <button type="button" onClick={handleSaveTemplate} className="btn-primary btn-small ripple-button" disabled={!templateName}>Save</button>
            <button type="button" onClick={() => setShowTemplateNameInput(false)} className="btn-secondary btn-small ripple-button">Cancel</button>
          </div>
        )}

      </form>

      {/* Split Transaction Modal */}
      {isSplitModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content split-modal">
            <div className="modal-header">
              <h3>Split Transaction</h3>
              <button onClick={closeSplitModal} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {splitItems.map((item, index) => (
                <div key={item.id} className="split-item-form">
                  <input
                    type="text"
                    placeholder={`Description ${index + 1}`}
                    value={item.description}
                    onChange={(e) =>
                      handleSplitItemChange(item.id, "description", e.target.value)
                    }
                  />
                  <input
                    type="number"
                    placeholder={`Amount ${index + 1}`}
                    value={item.amount}
                    onChange={(e) =>
                      handleSplitItemChange(item.id, "amount", e.target.value)
                    }
                    step="0.01"
                    min="0.01"
                    required
                  />
                  <select
                     value={item.category}
                     onChange={(e) =>
                       handleSplitItemChange(item.id, "category", e.target.value)
                     }
                     required
                  >
                    <option value="">Select Category</option>
                     {allCategories.map(cat => (
                         <option key={cat} value={cat}>{cat}</option>
                     ))}
                  </select>
                   <button
                    type="button"
                    onClick={() => removeSplitItem(item.id)}
                    className="btn-remove-split"
                    disabled={splitItems.length <= 1}
                    title="Remove Split"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addSplitItem}
                className="btn-add-split"
              >
                <PlusCircle size={16} /> Add Another Split
              </button>
            </div>
             <div className="modal-footer">
              <span className="split-total">
                Total: ₹
                {splitItems
                  .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
                  .toFixed(2)}
              </span>
              <button onClick={handleSplitSubmit} className="btn-primary ripple-button">
                Save Split Transaction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
