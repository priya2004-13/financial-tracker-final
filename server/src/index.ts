// server/src/index.ts 
import express, { Express } from "express";
import mongoose from "mongoose";
import financialRecordRouter from "./routes/financial-records";
import budgetRouter from "./routes/budget";
import savingsGoalRouter from "./routes/savings-goals";
import recurringPaymentRouter from "./routes/recurring-payments";
import notificationRouter from "./routes/notifications";
import aiInsightsRouter from "./routes/ai-insights";
import categoryRouter from "./routes/category";
import transactionTemplateRouter from "./routes/transaction-template";
import sharedExpenseRouter from "./routes/shared-expense"; // ✅ ADDED
import cors from "cors";
import webhookRouter from "./routes/webhooks";
import { webhookMiddleware } from "./middleware/webhooks";
import usersRouter from "./routes/users";
import 'dotenv/config'
const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
  console.error("❌ CLERK_WEBHOOK_SECRET is not set in environment variables");
  process.exit(1);
}
const app: Express = express();
webhookMiddleware(app);
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());

const mongoURI: string = process.env.MONGO_URI || 'mongodb://localhost:27017/financial-tracker';

mongoose
  .connect(mongoURI)
  .then(() => console.log("✅ CONNECTED TO MONGODB!"))
  .catch((err) => console.error("❌ Failed to Connect to MongoDB:", err));

// Health check endpoint

app.get("/health", (req, res) => {
  res.status(200).send({ status: "OK", timestamp: new Date().toISOString() });
});

// Routes
app.use("/webhooks", webhookRouter);
app.use("/users", usersRouter);
app.use("/financial-records", financialRecordRouter);
app.use("/budget", budgetRouter);
app.use("/savings-goals", savingsGoalRouter);
app.use("/recurring-payments", recurringPaymentRouter);
app.use("/notifications", notificationRouter);
app.use("/ai", aiInsightsRouter);
app.use("/categories", categoryRouter);
app.use("/transaction-templates", transactionTemplateRouter);
app.use("/shared-expenses", sharedExpenseRouter); 

// 404 handler
app.use((req, res) => {
  res.status(404).send({ error: "Route not found" });
});

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Server Error:", err);
  res.status(500).send({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`🚀 Server Running on Port ${port}`);
  console.log(`📊 API Endpoints:`);
  console.log(`   - Financial Records: /financial-records`);
  console.log(`   - Budget: /budget`);
  console.log(`   - Savings Goals: /savings-goals`);
  console.log(`   - Recurring Payments: /recurring-payments`);
  console.log(`   - Notifications: /notifications`);
  console.log(`   - AI Insights: /ai`);
  console.log(`   - Categories: /categories`);
  console.log(`   - Templates: /transaction-templates`);
  console.log(`   - Shared Expenses: /shared-expenses ✅ NEW`);
});