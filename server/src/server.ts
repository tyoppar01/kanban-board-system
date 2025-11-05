import express = require("express");
import http = require("http");
import morgan from "morgan";
import cors from "cors";
import boardRouter from "./routes/boardRoutes";
import taskRouter from "./routes/taskRoutes";

// ==================== Middleware ======================== //
const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan(`[:method :url][:status][:response-time ms]\nResponse: [:body\n]`));


morgan.token("body", (req: any, res: any) => {
  return res.locals.body ? JSON.stringify(res.locals.body) : "";
});

// middleware to intercept `res.send`
app.use((_, res, next) => {
  const oldSend = res.send;
  res.send = function (body) {
    res.locals.body = body; // store response for logging
    return oldSend.call(this, JSON.stringify(body));
  };
  next();
});





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
  console.log(`✅ Server running on http://localhost:${PORT}`)
);

// timeout configuration
server.requestTimeout = 120000;     
server.headersTimeout = 60000;      
server.keepAliveTimeout = 10000;    
server.timeout = 0;    