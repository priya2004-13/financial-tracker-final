import express, { Express } from "express";
import mongoose from "mongoose";
import financialRecordRouter from "./routes/financial-records";
import budgetRouter from "./routes/budget";
import savingsGoalRouter from "./routes/savings-goals";  
import cors from "cors";
import 'dotenv/config'

const app: Express = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());

const mongoURI: string = process.env.MONGO_URI || 'mongodb://localhost:27017/financial-tracker'; 

mongoose
  .connect(mongoURI)
  .then(() => console.log("CONNECTED TO MONGODB!"))
  .catch((err) => console.error("Failed to Connect to MongoDB:", err));

// Routes
app.use("/financial-records", financialRecordRouter);
app.use("/budget", budgetRouter);
app.use("/savings-goals", savingsGoalRouter); // Add the new savings goals route

app.listen(port, () => {
  console.log(`Server Running on Port ${port}`);
});