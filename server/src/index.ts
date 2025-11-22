// server/src/index.ts 
import express, { Express } from "express";
import mongoose from "mongoose";
import financialRecordRouter from "./routes/financial-records";
import budgetRouter from "./routes/budget";
import savingsGoalRouter from "./routes/savings-goals";
import debtsRouter from "./routes/debts";
import recurringPaymentRouter from "./routes/recurring-payments";
import aiInsightsRouter from "./routes/ai-insights";
import categoryRouter from "./routes/category";
import transactionTemplateRouter from "./routes/transaction-template";
import sharedExpenseRouter from "./routes/shared-expense";
import reportsRouter from "./routes/reports";
import authRouter from "./routes/auth";
import cors from "cors";
import 'dotenv/config'

const app: Express = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  next();
});
const mongoURI: string = process.env.MONGO_URI || 'mongodb://localhost:27017/financial-tracker';

mongoose
  .connect(mongoURI)
  .then(async () => {
    console.log("✅ CONNECTED TO MONGODB!");
    try {
      const collection = mongoose.connection.db?.collection("users");
      if (collection) {
        // Attempt to drop the specific index causing the crash
        await collection.dropIndex("clerkId_1");
        console.log("🗑️ Successfully removed legacy 'clerkId' index.");
      }
    } catch (error: any) {
      // Ignore error if the index is already gone (Error Code 27)
      if (error.code !== 27) {
        console.log("ℹ️ Note: clerkId index check:", error.message);
      }
    }
  })
  .catch((err) => console.error("❌ Failed to Connect to MongoDB:", err));

// Health check endpoint

app.get("/health", (req, res) => {
  res.status(200).send({ status: "OK", timestamp: new Date().toISOString() });
});

// Routes
app.use("/financial-records", financialRecordRouter);
app.use("/budget", budgetRouter);
app.use("/api/savings-goals", savingsGoalRouter);  // ✅ Add /api
app.use("/api/debts", debtsRouter);
app.use("/recurring-payments", recurringPaymentRouter);
app.use("/ai", aiInsightsRouter);
app.use("/categories", categoryRouter);
app.use("/transaction-templates", transactionTemplateRouter);
app.use("/shared-expenses", sharedExpenseRouter);
app.use("/reports", reportsRouter);
app.use("/auth", authRouter);

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
  console.log(`   - Shared Expenses: /shared-expenses ✅`);
  console.log(`   - Reports & PDF: /reports ✅ NEW`);
});