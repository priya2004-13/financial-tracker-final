// client/src/components/CategoryManager.tsx
import React, { useState } from 'react';
import { useFinancialRecords } from '../contexts/financial-record-context';
import { Tag, PlusCircle, Trash2, X } from 'lucide-react';
import './CategoryManager.css';

// Simple Emoji Picker (Replace with a library later if needed)
const EMOJIS = ['🛒', '🏠', '💡', '🎬', '🎁', '🍽️', '🚗', '✈️', '👕', '⚕️', '🎓', '❓'];

export const CategoryManager: React.FC = () => {
    const { categories, addCategory, deleteCategory, isLoading } = useFinancialRecords();
    const [newCategoryName, setNewCategoryName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState(EMOJIS[0]);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null); // Clear previous error
        if (!newCategoryName.trim()) {
            setError("Category name cannot be empty.");
            return;
        }

        try {
            await addCategory({
                userId: '', // userId will be set in the context
                name: newCategoryName.trim(),
                icon: selectedIcon,
            });
            setNewCategoryName('');
            setSelectedIcon(EMOJIS[0]);
            setShowForm(false); // Hide form after adding
        } catch (err: any) {
            console.error("Failed to add category:", err);
            setError(err.message || 'Failed to add category. Name might already exist.');
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!id) return;
         // Check if category is used in records (optional but good UX)
         // const isUsed = records.some(record => record.category === categoryToDelete.name);
         // if (isUsed) {
         //   alert("Cannot delete category as it's used in existing records.");
         //   return;
         // }
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                await deleteCategory(id);
            } catch (err) {
                console.error("Failed to delete category:", err);
                setError('Failed to delete category.');
            }
        }
    };

    return (
        <div className="category-manager-container">
            <div className="category-manager-header">
                <div className="header-left">
                    <div className="category-manager-icon">
                        <Tag size={20} />
                    </div>
                    <h2 className="category-manager-title">Custom Categories</h2>
                </div>
                 <button
                    className={`btn-toggle-form ${showForm ? 'active' : ''}`}
                    onClick={() => { setShowForm(!showForm); setError(null); }}
                    title={showForm ? 'Cancel' : 'Add New Category'}
                 >
                    {showForm ? <X size={16} /> : <PlusCircle size={16} />}
                     {showForm ? 'Cancel' : 'Add'}
                 </button>
            </div>

             {showForm && (
                 <form onSubmit={handleAddCategory} className="category-add-form">
                     <div className="form-field">
                         <input
                             type="text"
                             className="form-input form-input-animated"
                             placeholder="New category name"
                             value={newCategoryName}
                             onChange={(e) => setNewCategoryName(e.target.value)}
                             required
                         />
                     </div>
                     <div className="form-field">
                         <label className="form-label">Select Icon:</label>
                         <div className="emoji-picker">
                             {EMOJIS.map(emoji => (
                                 <button
                                     type="button"
                                     key={emoji}
                                     className={`emoji-btn ${selectedIcon === emoji ? 'selected' : ''}`}
                                     onClick={() => setSelectedIcon(emoji)}
                                 >
                                     {emoji}
                                 </button>
                             ))}
                         </div>
                     </div>
                      {error && <p className="error-message">{error}</p>}
                     <button type="submit" className="btn-primary ripple-button">
                         <PlusCircle size={16} /> Add Category
                     </button>
                 </form>
             )}


            <div className="categories-list">
                {isLoading ? (
                    <p>Loading categories...</p>
                ) : categories.length === 0 && !showForm ? (
                    <p className="empty-categories">No custom categories yet.</p>
                ) : (
                    categories.map((category) => (
                        <div key={category._id} className="category-item">
                            <span className="category-icon">{category.icon}</span>
                            <span className="category-name">{category.name}</span>
                            <button
                                onClick={() => handleDeleteCategory(category._id!)}
                                className="btn-delete-category"
                                title="Delete Category"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
