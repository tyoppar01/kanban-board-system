import express from "express";
import http = require("http");
import cors = require("cors");


const app = express();
const router = express.Router()

// ==================== Middleware ======================== //
app.use(cors());
app.use(express.json());

// ====================== Router  ========================= //
// app.use("/api/board", boardRouter);
// app.use("/api/task", taskRouter);

// =================== Health Check ======================= //
app.get("/", (req, res) => {
  console.log("✅ GET / triggered OK");
  res.status(200).json({ success: true, message: "Server is running" });
});

// ===================== Error Check ========================= //
app.get("/", (req, res) => {
  console.log("✅ GET / triggered OK");
  res.status(200).json({ success: true, message: "Server is running" });
});


// =================== Server Setup ======================= //

const PORT = 8080;
const server = app.listen(PORT, () => 
  console.log(`✅ Server running on http://localhost:${PORT}`)
);


// timeout configuration
server.requestTimeout = 120000;     
server.headersTimeout = 60000;      
server.keepAliveTimeout = 10000;    
server.timeout = 0;    