import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
const path = require("path");

import corsConfig from "./configs/corsConfig";
import dbConfig from "./configs/dbConfig";
import authRoute from "./routes/auth";
import categoryRoute from "./routes/category";
import linkRoute from "./routes/link";
import shareRoute from "./routes/share";
import userRoute from "./routes/user";

dotenv.config();

const app = express();
app.use(cors(corsConfig.corsOptions));
app.use(cookieParser());
app.use(express.json());

app.use("/", express.static(path.join(__dirname, "public")));
app.use(
  "/favicon.ico",
  express.static(path.join(__dirname, "public", "favicon.ico"))
);
app.use("/auth", authRoute);
app.use("/api", categoryRoute);
app.use("/api", linkRoute);
app.use("/api", shareRoute);
app.use("/api", userRoute);

if (dbConfig.initiate()) {
  app.listen(process.env.PORT, () => {
    console.log(`Server launched at port ${process.env.PORT} 🚀`);
  });
}
