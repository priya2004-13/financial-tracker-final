// client/src/components/AttachmentUpload.tsx
import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader, Eye } from 'lucide-react';
import { compressImage, validateImageFile, getImageSize } from '../../services/api';
import './AttachmentUpload.css';

interface Attachment {
  filename: string;
  mimeType: string;
  size: number;
  base64Data: string;
  uploadedAt: Date;
}

interface AttachmentUploadProps {
  attachments: Attachment[];
  onChange: (attachments: Attachment[]) => void;
  maxFiles?: number;
  maxTotalSize?: number; // in bytes
}

export const AttachmentUpload: React.FC<AttachmentUploadProps> = ({
  attachments,
  onChange,
  maxFiles = 3,
  maxTotalSize = 2 * 1024 * 1024 // 2MB
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setError(null);
    setIsUploading(true);

    try {
      // Check max files limit
      if (attachments.length + files.length > maxFiles) {
        throw new Error(`Maximum ${maxFiles} attachments allowed`);
      }

      const newAttachments: Attachment[] = [];

      for (const file of files) {
        // Validate file
        const validation = validateImageFile(file);
        if (!validation.valid) {
          throw new Error(validation.error);
        }

        // Compress image
        const base64Data = await compressImage(file, 800);
        const size = getImageSize(base64Data);

        // Check total size
        const currentTotalSize = attachments.reduce((sum, att) => sum + att.size, 0);
        if (currentTotalSize + size > maxTotalSize) {
          throw new Error('Total attachments size would exceed 2MB limit');
        }

        newAttachments.push({
          filename: file.name,
          mimeType: file.type,
          size: size,
          base64Data: base64Data,
          uploadedAt: new Date()
        });
      }

      onChange([...attachments, ...newAttachments]);
    } catch (err: any) {
      console.error('Error uploading attachment:', err);
      setError(err.message || 'Failed to upload attachment');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (index: number) => {
    const updated = attachments.filter((_, i) => i !== index);
    onChange(updated);
  };

  const totalSize = attachments.reduce((sum, att) => sum + att.size, 0);
  const remainingSize = maxTotalSize - totalSize;
  const canAddMore = attachments.length < maxFiles && remainingSize > 0;

  return (
    <div className="attachment-upload-container">
      <div className="attachment-header">
        <label className="attachment-label">
          <ImageIcon size={16} />
          Receipt Images (Optional)
        </label>
        <span className="attachment-info">
          {attachments.length}/{maxFiles} files • {(totalSize / 1024).toFixed(0)}KB / {(maxTotalSize / 1024).toFixed(0)}KB
        </span>
      </div>

      {error && (
        <div className="attachment-error">
          {error}
        </div>
      )}

      {/* Upload Button */}
      {canAddMore && (
        <div className="attachment-upload-area">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="attachment-input-hidden"
            disabled={isUploading}
          />
          <button
            type="button"
            className="btn-upload-attachment"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader size={16} className="spinner" />
                Compressing...
              </>
            ) : (
              <>
                <Upload size={16} />
                Upload Receipt
              </>
            )}
          </button>
          <p className="upload-hint">
            JPEG, PNG, GIF, WebP • Max 5MB per file • Compressed to 2MB total
          </p>
        </div>
      )}

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="attachments-list">
          {attachments.map((attachment, index) => (
            <div key={index} className="attachment-item">
              <div className="attachment-thumbnail">
                <img
                  src={attachment.base64Data}
                  alt={attachment.filename}
                  onClick={() => setPreviewImage(attachment.base64Data)}
                />
              </div>
              <div className="attachment-details">
                <span className="attachment-filename">{attachment.filename}</span>
                <span className="attachment-size">
                  {(attachment.size / 1024).toFixed(1)}KB
                </span>
              </div>
              <div className="attachment-actions">
                <button
                  type="button"
                  className="btn-preview"
                  onClick={() => setPreviewImage(attachment.base64Data)}
                  title="Preview"
                >
                  <Eye size={16} />
                </button>
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => removeAttachment(index)}
                  title="Remove"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="preview-modal" onClick={() => setPreviewImage(null)}>
          <div className="preview-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="btn-close-preview"
              onClick={() => setPreviewImage(null)}
            >
              <X size={24} />
            </button>
            <img src={previewImage} alt="Preview" />
          </div>
        </div>
      )}
    </div>
  );
};