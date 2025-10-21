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
  IndianRupee
} from "lucide-react";
import "./recordList.css";
import { FinancialRecord } from "../../../services/api"
const CATEGORY_COLORS: Record<string, string> = {
  Salary: '#10b981',
  Food: '#f97316',
  Rent: '#ef4444',
  Utilities: '#3b82f6',
  Entertainment: '#ec4899',
  Other: '#a855f7',
};

export const FinancialRecordList = () => {
  const { records, updateRecord, deleteRecord } = useFinancialRecords();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<FinancialRecord>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Filter and sort records
  const filteredAndSortedRecords = useMemo(() => {
    let filtered = records.filter((record) => {
      const matchesSearch = record.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === "All" || record.category === filterCategory;
      return matchesSearch && matchesCategory;
    });

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
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  const categories = ["All", "Food", "Rent", "Salary", "Utilities", "Entertainment", "Other"];
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
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="sort-group">
              <button
                className={`sort-btn ₹{sortBy === 'date' ? 'active' : ''}`}
                onClick={() => setSortBy('date')}
              >
                <Calendar size={16} />
                Date
              </button>
              <button
                className={`sort-btn ₹{sortBy === 'amount' ? 'active' : ''}`}
                onClick={() => setSortBy('amount')}
              >
                <IndianRupee size={16} />
                Amount
              </button>
              <button
                className="sort-order-btn"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
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
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredAndSortedRecords.map((record) => {
            const isEditing = editingId === record._id;
            const isIncome = record.category === 'Salary';

            return (
              <div key={record._id} className={`record-card ₹{isIncome ? 'income-card' : 'expense-card'}`}>
                <div className="record-card-left">
                  <div 
                    className="record-category-badge"
                    style={{ 
                      backgroundColor: `₹{CATEGORY_COLORS[record.category]}20`,
                      color: CATEGORY_COLORS[record.category]
                    }}
                  >
                    <Tag size={14} />
                    {isEditing ? (
                      <select
                        value={editForm.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        className="edit-select-inline"
                      >
                        <option value="Food">Food</option>
                        <option value="Rent">Rent</option>
                        <option value="Salary">Salary</option>
                        <option value="Utilities">Utilities</option>
                        <option value="Entertainment">Entertainment</option>
                        <option value="Other">Other</option>
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
                          </select>
                        ) : (
                          record.paymentMethod
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="record-card-right">
                  <div className={`record-amount ₹{isIncome ? 'amount-income' : 'amount-expense'}`}>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm.amount}
                        onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) })}
                        className="edit-input amount"
                        step="0.01"
                      />
                    ) : (
                      <>
                        <span className="amount-sign">{isIncome ? '+' : '-'}</span>
                        ₹{record.amount.toFixed(2)}
                      </>
                    )}
                  </div>

                  <div className="record-actions">
                    {isEditing ? (
                      <>
                        <button
                          className="action-btn save-btn"
                          onClick={() => saveEdit(record._id!)}
                          title="Save"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          className="action-btn cancel-btn"
                          onClick={cancelEdit}
                          title="Cancel"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="action-btn edit-btn"
                          onClick={() => startEdit(record)}
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="action-btn delete-btn"
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