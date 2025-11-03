import express = require("express");
import http = require("http");
import cors = require("cors");

const boardRouter = require("./routes/boardRoute.ts");
const taskRouter = require ("./routes/taskRoute.ts");

const app = express();
app.use(express.json());

// ==================== Middleware ======================== //
app.use(cors());
app.use(express.json());

// =================== Health Check ======================= //
app.get("/", (req, res) => {
  console.log("✅ GET / triggered");
  res.status(200).json({ success: true, message: "Server is running" });
});

// ===================== Error Check ========================= //



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