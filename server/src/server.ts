import express = require("express");
import http = require("http");

const app = express();
app.use(express.json());

const server = http.createServer(app);

// timeout configuration
server.requestTimeout = 120000;     
server.headersTimeout = 60000;      
server.keepAliveTimeout = 10000;    
server.timeout = 0;                

app.get("/", (req, res) => {
  res.send("🚀 Server running successfully!");
});

app.listen(3000, () => console.log("✅ Server running on http://localhost:3000"));
