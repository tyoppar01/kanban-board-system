import express = require("express");
import http = require("http");
import cors from "cors";
import boardRouter from "./routes/boardRoutes";
import taskRouter from "./routes/taskRoutes";

// ==================== Middleware ======================== //
const app = express();
app.use(express.json());
app.use(cors());

// ====================== Router  ========================= //
app.use("/api/board", boardRouter);  // all board endpoints
app.use("/api/task", taskRouter);    // all task endpoints

// =================== Health Check ======================= //
app.get("/", (req, res) => {
  console.log("✅ GET / triggered OK");
  res.status(200).json({ success: true, message: "Server is running" });
});

// ===================== Error Check ========================= //



// =================== Server Setup ======================= //

const PORT = 8080;
const server = app.listen(PORT, () => 
  console.log(`✅ Express Server running on http://localhost:${PORT}`)
);

// timeout configuration
server.requestTimeout = 120000;     
server.headersTimeout = 60000;      
server.keepAliveTimeout = 10000;    
server.timeout = 0;    