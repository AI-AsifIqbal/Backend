import dotenv from 'dotenv';
import connectDB from "../src/db/index.js";
import { app } from "../src/app.js";

dotenv.config({ path: './.env' });

connectDB()
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch((err) => {
        console.log("MongoDB connection failed", err);
    });

export default app;
