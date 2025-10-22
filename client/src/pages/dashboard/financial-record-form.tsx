// client/src/pages/dashboard/financial-record-form.tsx - Enhanced with Anomaly Detection
import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useFinancialRecords } from "../../contexts/financial-record-context";
import { suggestCategory as apiSuggestCategory, detectSpendingAnomaly } from "../../../services/api";
import { AlertTriangle, Calendar, DollarSign, Tag, CreditCard, FileText } from "lucide-react";
import "./RecordForm.css";

export const FinancialRecordForm = () => {
  const [description, setDescription] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const { addRecord } = useFinancialRecords();
  const { user } = useUser();
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [anomalyWarning, setAnomalyWarning] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (description) {
        suggestCategory(description);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [description]);

  // Check for anomalies when amount or category changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (amount && category && category !== 'Salary' && parseFloat(amount) > 0) {
        checkAnomaly(parseFloat(amount), category);
      } else {
        setAnomalyWarning(null);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [amount, category]);

  const suggestCategory = async (description: string) => {
    setIsSuggesting(true);
    try {
      const { category } = await apiSuggestCategory(description);
      setCategory(category);
    } catch (err) {
      console.error("Error suggesting category:", err);
    } finally {
      setIsSuggesting(false);
    }
  };

  const checkAnomaly = async (amount: number, category: string) => {
    if (!user) return;
    try {
      const result = await detectSpendingAnomaly(user.id, amount, category);
      if (result.isAnomaly) {
        setAnomalyWarning(result.message);
      } else {
        setAnomalyWarning(null);
      }
    } catch (err) {
      console.error("Error checking anomaly:", err);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const newRecord = {
      userId: user?.id ?? "",
      date: new Date(),
      description: description,
      amount: parseFloat(amount),
      category: category,
      paymentMethod: paymentMethod,
    };

    addRecord(newRecord);
    setDescription("");
    setAmount("");
    setCategory("");
    setPaymentMethod("");
    setAnomalyWarning(null);
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
            <FileText size={16} />
            Description
          </label>
          <input
            type="text"
            required
            className="form-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Grocery shopping"
          />
        </div>

        <div className="form-field">
          <label className="form-label">
            <DollarSign size={16} />
            Amount
          </label>
          <input
            type="number"
            required
            className="form-input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
          />
        </div>

        <div className="form-field">
          <label className="form-label">
            <Tag size={16} />
            Category {isSuggesting && "(Suggesting...)"}
          </label>
          <select
            required
            className="form-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select a Category</option>
            <option value="Food">Food</option>
            <option value="Rent">Rent</option>
            <option value="Salary">Salary</option>
            <option value="Utilities">Utilities</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="form-field">
          <label className="form-label">
            <CreditCard size={16} />
            Payment Method
          </label>
          <select
            required
            className="form-input"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="">Select a Payment Method</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>
        </div>

        {/* Anomaly Warning */}
        {anomalyWarning && (
          <div className="anomaly-warning">
            <AlertTriangle size={16} />
            <span>{anomalyWarning}</span>
          </div>
        )}

        <button type="submit" className="form-submit">
          <Calendar size={16} />
          Add Record
        </button>
      </form>
    </div>
  );
};