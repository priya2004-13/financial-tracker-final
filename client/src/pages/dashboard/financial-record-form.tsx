import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useFinancialRecords } from "../../contexts/financial-record-context";
import { suggestCategory as apiSuggestCategory } from "../../../services/api"; 
import "./RecordForm.css";

export const FinancialRecordForm = () => {
  const [description, setDescription] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const { addRecord } = useFinancialRecords();
  const { user } = useUser();
  const [isSuggesting, setIsSuggesting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (description) {
        suggestCategory(description);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [description]);

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
  };

  return (
    <div className="record-form-container">
      <form onSubmit={handleSubmit}>
        <div className="form-label">
          <label>Description:</label>
          <input
            type="text"
            required
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="form-label">
          <label>Amount:</label>
          <input
            type="number"
            required
            className="input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="form-label">
          <label>Category: {isSuggesting && "(Suggesting...)"}</label>
          <select
            required
            className="input"
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
        <div className="form-label">
          <label>Payment Method:</label>
          <select
            required
            className="input"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option className="form-select" value="">Select a Payment Method</option>
            <option className="form-select" value="Credit Card">Credit Card</option>
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>
        </div>
        <button type="submit" className="button">
          Add Record
        </button>
      </form>
    </div>
  );
};