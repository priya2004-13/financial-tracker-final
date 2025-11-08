// client/src/pages/dashboard/financial-record-list.tsx - WITH PAGINATION
import { useMemo, useState, useEffect } from "react";
import { useFinancialRecords } from "../../contexts/financial-record-context";
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
  GitCommit,
  Image as ImageIcon,
  Eye,
  StickyNote,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader
} from "lucide-react";
import "./recordList.css";
import { FinancialRecord, fetchFinancialRecords, PaginatedRecordsResponse } from "../../../services/api";
import { useUser } from "@clerk/clerk-react";

const CATEGORY_COLORS: Record<string, string> = {
  Salary: '#10b981',
  Food: '#f97316',
  Rent: '#ef4444',
  Utilities: '#3b82f6',
  Entertainment: '#ec4899',
  Other: '#a855f7',
};

interface FinancialRecordListProps {
  filteredRecords?: FinancialRecord[];
  showFilters?: boolean;
}

export const FinancialRecordList = ({ filteredRecords, showFilters = true }: FinancialRecordListProps) => {
  const { user } = useUser();
  const { records, updateRecord, deleteRecord, categories } = useFinancialRecords();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<FinancialRecord>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [allRecords, setAllRecords] = useState<FinancialRecord[]>(records);
  const [paginationInfo, setPaginationInfo] = useState<PaginatedRecordsResponse['pagination'] | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(false);

  // Image preview state
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  // Load paginated records (only if no filtered records are provided)
  useEffect(() => {
    if (filteredRecords) {
      setAllRecords(filteredRecords);
      return;
    }

    const loadRecords = async () => {
      if (!user?.id) return;

      setIsLoadingPage(true);
      try {
        const response = await fetchFinancialRecords(user.id, currentPage, pageSize);
        setAllRecords(response.records);
        setPaginationInfo(response.pagination);
      } catch (error) {
        console.error("Error loading records:", error);
      } finally {
        setIsLoadingPage(false);
      }
    };

    loadRecords();
  }, [user?.id, currentPage, pageSize, filteredRecords]);

  const allCategories = useMemo(() => {
    const defaultCategories = ["All", "Food", "Rent", "Salary", "Utilities", "Entertainment", "Other"];
    const customCategoryNames = categories.map(c => c.name);
    return [...new Set([...defaultCategories, ...customCategoryNames])].sort();
  }, [categories]);

  const filteredAndSortedRecords = useMemo(() => {
    let filtered = allRecords.filter((record) => {
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
  }, [allRecords, searchTerm, filterCategory, sortBy, sortOrder]);

  const getCategoryColor = (categoryName: string) => {
    return CATEGORY_COLORS[categoryName] || CATEGORY_COLORS['Other'];
  };

  const openPreview = (base64Data: string) => {
    setPreviewImage(base64Data);
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

  const toggleExpanded = (recordId: string) => {
    setExpandedRecordId(expandedRecordId === recordId ? null : recordId);
  };

  const startEdit = (record: FinancialRecord) => {
    setEditingId(record._id || null);
    setEditForm({
      description: record.description,
      amount: record.amount,
      category: record.category,
      paymentMethod: record.paymentMethod,
      notes: record.notes
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
        notes: editForm.notes || ""
      });
    }
    cancelEdit();
  };

  const formatDate = (date: Date | string) => {
    try {
      return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return "Invalid Date";
    }
  };

  return (
    <div className="records-container">
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
        {showFilters && (
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
                  className={`sort-btn ${sortBy === 'date' ? 'active' : ''} btn-primary ripple-button`}
                  onClick={() => setSortBy('date')}
                >
                  <Calendar size={16} />
                  Date
                </button>
                <button
                  className={`sort-btn ${sortBy === 'amount' ? 'active' : ''} btn-primary ripple-button`}
                  onClick={() => setSortBy('amount')}
                >
                  <IndianRupee size={16} />
                  Amount
                </button>
                <button
                  className="sort-order-btn btn-primary ripple-button"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? <TrendingUp size={21} /> : <TrendingDown size={21} />}
                </button>
              </div>
            </div>
          </div>
        )}
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
            const categoryColor = getCategoryColor(record.category);
            const isExpanded = expandedRecordId === record._id;
            const hasAttachments = record.attachments && record.attachments.length > 0;
            const hasNotes = record.notes && record.notes.trim().length > 0;

            return (
              <div key={record._id} className={`record-card ${isIncome ? 'income-card' : 'expense-card'} ${record.isSplit ? 'split-indicator' : ''}`}>
                {record.isSplit && <GitCommit size={14} className="split-icon" />}

                <div className="record-card-left">
                  <div
                    className="record-category-badge"
                    style={{
                      backgroundColor: `${categoryColor}20`,
                      color: categoryColor
                    }}
                  >
                    <Tag size={14} />
                    {isEditing ? (
                      <select
                        value={editForm.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        className="edit-select-inline"
                      >
                        {allCategories.filter(c => c !== 'All').map(cat => (
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
                      {(hasAttachments || hasNotes) && !isEditing && (
                        <span className="meta-item">
                          <button
                            className="btn-expand-details"
                            onClick={() => toggleExpanded(record._id!)}
                            title={isExpanded ? "Hide details" : "Show details"}
                          >
                            {hasAttachments && <ImageIcon size={14} />}
                            {hasNotes && <StickyNote size={14} />}
                            {isExpanded ? 'Hide' : 'Show'}
                          </button>
                        </span>
                      )}
                    </div>

                    {/* Expanded Details: Notes and Attachments */}
                    {isExpanded && !isEditing && (
                      <div className="record-expanded-details">
                        {hasNotes && (
                          <div className="record-notes">
                            <div className="notes-label">
                              <StickyNote size={14} />
                              Notes:
                            </div>
                            <p className="notes-text">{record.notes}</p>
                          </div>
                        )}

                        {hasAttachments && (
                          <div className="record-attachments">
                            <div className="attachments-label">
                              <ImageIcon size={14} />
                              Receipts ({record.attachments!.length}):
                            </div>
                            <div className="attachments-grid">
                              {record.attachments!.map((att, index) => (
                                <div key={index} className="attachment-thumbnail-wrapper">
                                  <img
                                    src={att.base64Data}
                                    alt={att.filename}
                                    className="attachment-thumbnail-small"
                                    onClick={() => openPreview(att.base64Data)}
                                    title={`${att.filename} (${(att.size / 1024).toFixed(1)}KB)`}
                                  />
                                  <button
                                    className="btn-preview-small"
                                    onClick={() => openPreview(att.base64Data)}
                                    title="View full size"
                                  >
                                    <Eye size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Edit Notes */}
                    {isEditing && (
                      <div className="edit-notes-field">
                        <label>Notes:</label>
                        <textarea
                          value={editForm.notes || ''}
                          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                          className="edit-input"
                          placeholder="Add notes..."
                          rows={2}
                        />
                      </div>
                    )}
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
                          disabled={record._id?.startsWith('offline_')}
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

      {/* Pagination Controls */}
      {paginationInfo && paginationInfo.totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            <span className="records-count">
              Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, paginationInfo.totalRecords)} of {paginationInfo.totalRecords} transactions
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="page-size-select"
            >
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>

          <div className="pagination-controls">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={!paginationInfo.hasPrevious || isLoadingPage}
              className="pagination-btn"
              title="First page"
            >
              <ChevronsLeft size={18} />
            </button>
            <button
              onClick={() => setCurrentPage(prev => prev - 1)}
              disabled={!paginationInfo.hasPrevious || isLoadingPage}
              className="pagination-btn"
              title="Previous page"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="page-numbers">
              {Array.from({ length: Math.min(5, paginationInfo.totalPages) }, (_, i) => {
                const pageNum = currentPage <= 3
                  ? i + 1
                  : currentPage >= paginationInfo.totalPages - 2
                    ? paginationInfo.totalPages - 4 + i
                    : currentPage - 2 + i;

                if (pageNum < 1 || pageNum > paginationInfo.totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`page-number-btn ${currentPage === pageNum ? 'active' : ''}`}
                    disabled={isLoadingPage}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={!paginationInfo.hasMore || isLoadingPage}
              className="pagination-btn"
              title="Next page"
            >
              <ChevronRight size={18} />
            </button>
            <button
              onClick={() => setCurrentPage(paginationInfo.totalPages)}
              disabled={!paginationInfo.hasMore || isLoadingPage}
              className="pagination-btn"
              title="Last page"
            >
              <ChevronsRight size={18} />
            </button>
          </div>

          {isLoadingPage && (
            <div className="pagination-loading">
              <Loader size={16} className="spin" />
              <span>Loading...</span>
            </div>
          )}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="preview-modal" onClick={closePreview}>
          <div className="preview-content" onClick={(e) => e.stopPropagation()}>
            <button className="btn-close-preview" onClick={closePreview}>
              <X size={24} />
            </button>
            <img src={previewImage} alt="Receipt Preview" />
          </div>
        </div>
      )}
    </div>
  );
};