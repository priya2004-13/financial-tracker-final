// client/src/pages/dashboard/financial-record-list.tsx - Updated for Split Transactions Display
import { useMemo, useState } from "react";
import {
  useFinancialRecords,
} from "../../contexts/financial-record-context";
import {
  Trash2,
  Edit2,
  Check,
  X,
  Calendar,
  CreditCard,
  Tag,
  FileText,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  GitCommit // Icon for split transactions
} from "lucide-react";
import "./recordList.css";
import { FinancialRecord } from "../../../services/api"

// Existing CATEGORY_COLORS definition...
const CATEGORY_COLORS: Record<string, string> = {
  Salary: '#10b981',
  Food: '#f97316',
  Rent: '#ef4444',
  Utilities: '#3b82f6',
  Entertainment: '#ec4899',
  Other: '#a855f7',
  // Add colors for custom categories if needed, or fallback
};

export const FinancialRecordList = () => {
  const { records, updateRecord, deleteRecord, categories } = useFinancialRecords(); // Get categories
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<FinancialRecord>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Combine default and custom categories for filtering
  const allCategories = useMemo(() => {
    const defaultCategories = ["All", "Food", "Rent", "Salary", "Utilities", "Entertainment", "Other"];
    const customCategoryNames = categories.map(c => c.name);
    return [...new Set([...defaultCategories, ...customCategoryNames])].sort();
  }, [categories]);

  // Filter and sort records
  const filteredAndSortedRecords = useMemo(() => {
    let filtered = records.filter((record) => {
      const matchesSearch = record.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === "All" || record.category === filterCategory;
      return matchesSearch && matchesCategory;
    });

    // Simple sorting - complex split grouping might require more logic if needed later
    filtered.sort((a, b) => {
      if (sortBy === "date") {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      } else {
        return sortOrder === "asc" ? a.amount - b.amount : b.amount - a.amount;
      }
    });
    return filtered;
  }, [records, searchTerm, filterCategory, sortBy, sortOrder]);


    // Function to get category color, falling back to 'Other'
    const getCategoryColor = (categoryName: string) => {
        return CATEGORY_COLORS[categoryName] || CATEGORY_COLORS['Other'];
      };

  const startEdit = (record: FinancialRecord) => {
    setEditingId(record._id || null);
    setEditForm({
      description: record.description,
      amount: record.amount,
      category: record.category,
      paymentMethod: record.paymentMethod,
    });
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };
  const saveEdit = (id: string) => {
    if (!editForm.description || !editForm.amount || !editForm.category || !editForm.paymentMethod) {
      return;
    }
    const originalRecord = records.find(r => r._id === id);
    if (originalRecord) {
      updateRecord(id, {
        ...originalRecord,
        description: editForm.description,
        amount: editForm.amount,
        category: editForm.category,
        paymentMethod: editForm.paymentMethod,
      });
    }
    cancelEdit();
  };
  const formatDate = (date: Date | string) => { // Accept string for offline potentially
    try {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    } catch {
        return "Invalid Date"; // Fallback for invalid date strings
    }
  };


  return (
    <div className=" records-container">
      {/* Header */}
      <div className="records-header-section">
        <div className="records-header-top">
          <h2 className="records-main-title">
            <FileText size={24} />
            Transaction History
          </h2>
          <div className="records-count-badge">
            {filteredAndSortedRecords.length} {filteredAndSortedRecords.length === 1 ? 'record' : 'records'}
          </div>
        </div>
        {/* Search and Filter Bar */}
        <div className="records-filter-bar">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-controls">
            <div className="filter-group">
              <Filter size={16} />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="filter-select"
              >
                 {allCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="sort-group">
              <button
                className={`sort-btn ${sortBy === 'date' ? 'active' : ''} btn-primary  ripple-button`}
                onClick={() => setSortBy('date')}
              >
                <Calendar size={16} />
                Date
              </button>
              <button
                className={`sort-btn ${sortBy === 'amount' ? 'active' : ''}  btn-primary ripple-button`}
                onClick={() => setSortBy('amount')}
              >
                <IndianRupee size={16} />
                Amount
              </button>
              <button
                className="sort-order-btn  btn-primary ripple-button"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <TrendingUp size={21} /> : <TrendingDown size={21} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Records List */}
      <div className="records-list">
        {filteredAndSortedRecords.length === 0 ? (
          <div className="empty-records">
            <FileText size={64} />
            <h3>No transactions found</h3>
            <p>Try adjusting your search or filters, or add a new record!</p>
          </div>
        ) : (
          filteredAndSortedRecords.map((record) => {
            const isEditing = editingId === record._id;
            const isIncome = record.category === 'Salary';
             const categoryColor = getCategoryColor(record.category); // Get color safely

            return (
              <div key={record._id} className={`record-card ${isIncome ? 'income-card' : 'expense-card'} ${record.isSplit ? 'split-indicator' : ''}`}>
               {/* Optional: Add a visual indicator for split transactions */}
               {record.isSplit && <GitCommit size={14} className="split-icon" title="Part of a split transaction"/>}

                <div className="record-card-left">
                  <div
                    className="record-category-badge"
                    style={{
                      backgroundColor: `${categoryColor}20`, // Use safe color
                      color: categoryColor // Use safe color
                    }}
                  >
                    <Tag size={14} />
                    {isEditing ? (
                      <select
                        value={editForm.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        className="edit-select-inline"
                      >
                         {allCategories.filter(c => c !== 'All').map(cat => ( // Exclude 'All' from edit options
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    ) : (
                      <span>{record.category}</span>
                    )}
                  </div>

                  <div className="record-details">
                    <div className="record-description">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="edit-input"
                          placeholder="Description"
                        />
                      ) : (
                        <span className="description-text">{record.description}</span>
                      )}
                    </div>

                    <div className="record-meta">
                      <span className="meta-item">
                        <Calendar size={14} />
                        {formatDate(record.date)}
                      </span>
                      <span className="meta-item">
                        <CreditCard size={14} />
                        {isEditing ? (
                          <select
                            value={editForm.paymentMethod}
                            onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}
                            className="edit-select-inline small"
                          >
                            <option value="Credit Card">Credit Card</option>
                            <option value="Cash">Cash</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Debit Card">Debit Card</option>
                            <option value="UPI">UPI</option>
                            <option value="Other">Other</option>
                          </select>
                        ) : (
                          record.paymentMethod
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="record-card-right">
                  <div className={`record-amount ${isIncome ? 'amount-income' : 'amount-expense'}`}>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm.amount}
                        onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) })}
                        className="edit-input amount"
                        step="0.01"
                        min="0.01"
                      />
                    ) : (
                      <>
                        <span className="amount-sign">{isIncome ? '+' : '-'}</span>
                         {/* Handle potential NaN amount for offline/corrupt data */}
                         {typeof record.amount === 'number' ? `₹${record.amount.toFixed(2)}` : 'Invalid Amt'}
                      </>
                    )}
                  </div>

                  <div className="record-actions">
                    {isEditing ? (
                      <>
                        <button
                          className="action-btn save-btn ripple-button"
                          onClick={() => saveEdit(record._id!)}
                          title="Save"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          className="action-btn cancel-btn ripple-button"
                          onClick={cancelEdit}
                          title="Cancel"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="action-btn edit-btn ripple-button"
                          onClick={() => startEdit(record)}
                          title="Edit"
                           disabled={record._id?.startsWith('offline_')} // Disable edit for offline records for simplicity
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="action-btn delete-btn ripple-button"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this record?')) {
                              deleteRecord(record._id!);
                            }
                          }}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
