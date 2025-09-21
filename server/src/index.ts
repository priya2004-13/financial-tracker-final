import express, { Express } from "express";
import mongoose from "mongoose";
import financialRecordRouter from "./routes/financial-records";
import cors from "cors";
import 'dotenv/config'
const app: Express = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());
console.log(process.env.MONGO_URI)
// const mongoURI: string =process.env.MONGO_URI ;
const mongoURI: string ='mongodb://localhost:27017/financial-tracker'; 

mongoose
  .connect(mongoURI)
  .then(() => console.log("CONNECTED TO MONGODB!"))
  .catch((err) => console.error("Failed to Connect to MongoDB:", err));

app.use("/financial-records", financialRecordRouter);

app.listen(port, () => {
  console.log(`Server Running on Port ${port}`);
});
