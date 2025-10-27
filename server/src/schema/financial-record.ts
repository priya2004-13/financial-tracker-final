// server/src/schema/financial-record.ts - ENHANCED WITH ATTACHMENTS
import mongoose from "mongoose";

interface Attachment {
  filename: string;
  mimeType: string;
  size: number; // in bytes
  base64Data: string; // Store small images as base64
  uploadedAt: Date;
}

interface FinancialRecord {
  userId: string;
  date: Date;
  description: string;
  amount: number;
  category: string;
  paymentMethod: string;
  isSplit?: boolean;
  parentRecordId?: string;
  attachments?: Attachment[]; // NEW: Support multiple attachments
  notes?: string; // NEW: Additional notes field
}

const attachmentSchema = new mongoose.Schema<Attachment>({
  filename: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  base64Data: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

const financialRecordSchema = new mongoose.Schema<FinancialRecord>({
  userId: { type: String, required: true, index: true },
  date: { type: Date, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  paymentMethod: { type: String, required: true },
  isSplit: { type: Boolean, default: false },
  parentRecordId: { type: String, required: false, index: true },
  attachments: { type: [attachmentSchema], default: [] },
  notes: { type: String, default: "" }
}, {
  timestamps: true
});

// Index for faster queries
financialRecordSchema.index({ userId: 1, date: -1 });
financialRecordSchema.index({ userId: 1, category: 1 });

// Validate attachment size (limit to 500KB per image, 2MB total)
financialRecordSchema.pre('save', function(next) {
  if (this.attachments && this.attachments.length > 0) {
    const totalSize = this.attachments.reduce((sum, att) => sum + att.size, 0);
    const maxSingleSize = 500 * 1024; // 500KB
    const maxTotalSize = 2 * 1024 * 1024; // 2MB
    
    for (const att of this.attachments) {
      if (att.size > maxSingleSize) {
        return next(new Error(`Attachment ${att.filename} exceeds 500KB limit`));
      }
    }
    
    if (totalSize > maxTotalSize) {
      return next(new Error('Total attachments size exceeds 2MB limit'));
    }
  }
  next();
});

const FinancialRecordModel = mongoose.model<FinancialRecord>(
  "FinancialRecord",
  financialRecordSchema
);

export default FinancialRecordModel;
export type { FinancialRecord, Attachment };