import mongoose, { Schema, model, models } from 'mongoose';

const GoogleSheetSchema = new Schema({
  userId: { type: String, required: true }, // Clerk ID
  workerId: { type: String, required: false, default: null }, // Associated agent ID (null if not attached to any worker)
  name: { type: String, required: true, default: 'Google Sheet Connection' },
  
  // Google Sheets details
  spreadsheetId: { type: String, required: true },
  spreadsheetName: { type: String },
  range: { type: String, default: 'Sheet1' },
  
  // Credentials (stored as JSON string for privacy)
  credentials: {
    type: { type: String, required: true },
    project_id: { type: String, required: true },
    private_key_id: { type: String, required: true },
    private_key: { type: String, required: true },
    client_email: { type: String, required: true },
    client_id: { type: String, required: true },
  },
  
  // Sync settings
  updateInterval: { 
    type: String, 
    enum: ['manual', 'hourly', 'daily'], 
    default: 'daily' 
  },
  
  // Data cache (for comparison and quick access)
  data: {
    headers: [{ type: String }],
    rows: [{ type: mongoose.Schema.Types.Mixed }],
    totalRows: { type: Number, default: 0 },
    lastUpdated: { type: Date },
  },
  
  // Sync history
  lastSyncedAt: { type: Date },
  lastSyncStatus: { type: String, enum: ['success', 'failed', 'never'], default: 'never' },
  lastSyncError: { type: String },
  syncCount: { type: Number, default: 0 },
  
  // Is this sheet active/connected
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Index for efficient queries
GoogleSheetSchema.index({ userId: 1, workerId: 1 });
GoogleSheetSchema.index({ userId: 1, spreadsheetId: 1 }, { unique: true });

if (process.env.NODE_ENV === 'development' && models.GoogleSheet) {
  delete (models as any).GoogleSheet;
}

const GoogleSheet = models.GoogleSheet || model('GoogleSheet', GoogleSheetSchema);

export default GoogleSheet;
