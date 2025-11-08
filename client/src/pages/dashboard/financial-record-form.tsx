// client/src/pages/dashboard/financial-record-form.tsx - FIXED WITH ATTACHMENTS
import React, { useState, useEffect, useMemo } from "react";
import { useUser } from "@clerk/clerk-react";
import { useFinancialRecords } from "../../contexts/financial-record-context";
import {
  suggestCategory as apiSuggestCategory,
  detectSpendingAnomaly,
  addTransactionTemplate,
  Attachment,
} from "../../../services/api";
import {
  AlertTriangle,
  IndianRupee,
  Tag,
  CreditCard,
  FileText,
  Save,
  Loader,
  PlusCircle,
  Split,
} from "lucide-react";
import { SplitTransactionModal } from "../../components/SplitTransactionModal";
import "./RecordForm.css";
import { AttachmentUpload } from "../../components/AttachmentUpload";

export const FinancialRecordForm = () => {
  const [description, setDescription] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [templateName, setTemplateName] = useState<string>("");
  const [showTemplateNameInput, setShowTemplateNameInput] = useState<boolean>(false);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState<boolean>(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [notes, setNotes] = useState<string>("");

  const { addRecord, categories } = useFinancialRecords();
  const { user } = useUser();

  const [isSuggesting, setIsSuggesting] = useState(false);
  const [anomalyWarning, setAnomalyWarning] = useState<string | null>(null);

  const allCategories = useMemo(() => {
    const defaultCategories = ["Food", "Rent", "Salary", "Utilities", "Entertainment", "Other"];
    const customCategoryNames = categories.map(c => c.name);
    return [...new Set([...defaultCategories, ...customCategoryNames])].sort();
  }, [categories]);

  useEffect(() => {
    if (description.length < 3) return;
    const timer = setTimeout(() => {
      suggestCategory(description);
    }, 1000);
    return () => clearTimeout(timer);
  }, [description]);

  useEffect(() => {
    if (amount && category && category !== "Salary" && parseFloat(amount) > 0 && !isSplitModalOpen) {
      const timer = setTimeout(() => {
        checkAnomaly(parseFloat(amount), category);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setAnomalyWarning(null);
    }
  }, [amount, category, isSplitModalOpen]);

  const suggestCategory = async (desc: string) => {
    if (!desc || isSuggesting || category) return;
    setIsSuggesting(true);
    try {
      const { category: suggestedCategory } = await apiSuggestCategory(desc);
      setCategory(suggestedCategory);
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
      setAnomalyWarning(null);
    }
  };

  const resetForm = () => {
    setDescription("");
    setAmount("");
    setCategory("");
    setPaymentMethod("");
    setAnomalyWarning(null);
    setShowTemplateNameInput(false);
    setTemplateName("");
    setAttachments([]); // ✅ Reset attachments
    setNotes(""); // ✅ Reset notes
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
      attachments: attachments, // ✅ Include attachments
      notes: notes, // ✅ Include notes
    };

    addRecord(newRecord);
    resetForm();
  };

  const handleSplitSubmit = (splits: Array<{ id: number; description: string; amount: string; category: string }>) => {
    if (!user) return;

    const recordsToSave = splits.map((item) => ({
      userId: user.id,
      date: new Date(),
      description: item.description || description || "Split Transaction",
      amount: parseFloat(item.amount),
      category: item.category || "Other",
      paymentMethod: paymentMethod || "Cash",
      isSplit: true,
      attachments: [], // Split transactions don't carry over attachments
      notes: notes || "",
    }));

    addRecord(recordsToSave);
    resetForm();
    setIsSplitModalOpen(false);
  };

  const handleSaveTemplate = async () => {
    if (!templateName || !user) return;
    try {
      await addTransactionTemplate({
        userId: user.id,
        templateName,
        description,
        amount: parseFloat(amount),
        category,
        paymentMethod,
      });
      alert(`Template "${templateName}" saved!`);
      setShowTemplateNameInput(false);
      setTemplateName("");
    } catch (err: unknown) {
      console.error("Error saving template:", err);
      const errorMessage = err instanceof Error ? err.message : 'Please try again.';
      alert(`Error saving template: ${errorMessage}`);
    }
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <div className="form-icon">
          <FileText size={20} />
        </div>
        <h2 className="form-title">Add Transaction</h2>
      </div>

      <form onSubmit={handleSubmit} className="form-fields">
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

        <div className="form-field">
          <label className="form-label">
            <IndianRupee size={16} /> Amount
          </label>
          <input
            className="form-input form-input-animated"
            type="number"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0.01"
          />
        </div>

        <div className="form-field">
          <label className="form-label">
            <Tag size={16} /> Category {isSuggesting && <Loader size={14} className="spinner" />}
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
            <option value="Debit Card">Debit Card</option>
            <option value="UPI">UPI</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* ✅ ATTACHMENT UPLOAD COMPONENT */}
        <AttachmentUpload
          attachments={attachments}
          onChange={setAttachments}
        />

        {/* ✅ NOTES FIELD */}
        <div className="form-field">
          <label className="form-label">
            <FileText size={16} /> Notes (Optional)
          </label>
          <textarea
            className="form-input form-input-animated"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes..."
            rows={3}
            style={{ resize: 'vertical', minHeight: '60px' }}
          />
        </div>

        {anomalyWarning && !isSplitModalOpen && (
          <div className="anomaly-warning">
            <AlertTriangle size={16} />
            <span>{anomalyWarning}</span>
          </div>
        )}

        <div className="form-action-buttons" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button type="submit" className="btn-primary ripple-button" style={{ flex: 1 }}>
            <PlusCircle size={18} /> Add Record
          </button>
          <button
            type="button"
            className="btn-secondary ripple-button"
            onClick={() => setIsSplitModalOpen(true)}
            title="Split Transaction"
            style={{ flex: 1 }}
          >
            <Split size={18} /> Split
          </button>
          <button
            type="button"
            className="btn-secondary ripple-button"
            onClick={() => setShowTemplateNameInput(true)}
            disabled={!description || !amount || !category || !paymentMethod}
            title="Save as Template"
            style={{ flex: 1 }}
          >
            <Save size={18} /> Template
          </button>
        </div>

        {showTemplateNameInput && (
          <div className="template-save-section" style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <input
              type="text"
              className="form-input form-input-animated"
              placeholder="Enter Template Name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              required
              style={{ flex: 1 }}
            />
            <button type="button" onClick={handleSaveTemplate} className="btn-primary btn-small ripple-button" disabled={!templateName}>Save</button>
            <button type="button" onClick={() => setShowTemplateNameInput(false)} className="btn-secondary btn-small ripple-button">Cancel</button>
          </div>
        )}
      </form>

      {/* Split Modal */}
      {isSplitModalOpen && (
        <SplitTransactionModal
          isOpen={isSplitModalOpen}
          onClose={() => setIsSplitModalOpen(false)}
          originalDescription={description}
          originalAmount={amount}
          onSubmit={handleSplitSubmit}
          allCategories={allCategories}
        />
      )}
    </div>
  );
};