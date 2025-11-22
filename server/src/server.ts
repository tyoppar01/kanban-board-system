import dotenv from "dotenv";
import path = require("path");
try {
  dotenv.config({ path: path.resolve(__dirname, "../../.env") });
} catch (e) {
  console.log('FILE .env not found, using container environment variables');
}

import express = require("express");
import http = require("http");
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import cors from "cors";
import { resolvers } from "./graphql/resolvers";
import typeDefs from "./graphql/typeDefs";
import { connectDatabase } from "external-apis";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { register, apiDuration, apiErrors } from "./metrics";

// ==================== Middleware ======================== //
const app = express();
app.use(express.json());
app.use(cors());

// =================== API Duration Tracking ============== //
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const operation = req.route?.path || req.path || 'unknown';
    
    apiDuration.observe(
      {
        operation: operation,
        status: res.statusCode.toString()
      },
      duration
    );
    
    // Track errors
    if (res.statusCode >= 400) {
      apiErrors.inc({
        operation: operation,
        error_type: res.statusCode >= 500 ? 'server_error' : 'client_error'
      });
    }
  });
  
  next();
});

// =================== Health Check ======================= //
app.get("/", (_: any, res: any) => {
  console.log("✅ GET / triggered OK");
  res.status(200).json({ success: true, message: "Server is running" });
});

// =================== Metrics Endpoint =================== //
app.get("/metrics", async (_: any, res: any) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// =================== Server Setup ======================= //

async function startServer() {

  try {
    await connectDatabase();
  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL:', error);
    process.exit(1);
  }

  const httpServer = http.createServer(app);

  const server = new ApolloServer({ 
    typeDefs, 
    resolvers,
    csrfPrevention: false,
    introspection: true,
    plugins: [ApolloServerPluginLandingPageLocalDefault ()],
  });

  await server.start();

  app.use(
    "/graphql",
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }: any) => ({ token: req.headers.token }),
    })
  );

  const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;

  httpServer.listen(PORT, () => {
    console.log(`🚀 GraphQL Server ready at http://localhost:${PORT}/graphql`);
  });

  // timeout configuration
  httpServer.requestTimeout = 120000;
  httpServer.headersTimeout = 60000;
  httpServer.keepAliveTimeout = 10000;
  httpServer.timeout = 0;
}

startServer().catch(console.error);