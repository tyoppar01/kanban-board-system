import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { expressMiddleware } from "@as-integrations/express5";
import cors from "cors";
import dotenv from "dotenv";
import { startDynamoDB } from "/external-infra/src/index";
import { resolvers } from "./graphql/resolvers";
import typeDefs from "./graphql/typeDefs";
import path = require("path");
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import express = require("express");
import http = require("http");

// ==================== Middleware ======================== //
const app = express();
app.use(express.json());
app.use(cors());

// =================== Health Check ======================= //
app.get("/", (_, res) => {
  console.log("✅ GET / triggered OK");
  res.status(200).json({ success: true, message: "Server is running" });
});

// =================== Server Setup ======================= //

async function startServer() {

  // Initialize DynamoDB connection and tables
  await startDynamoDB();

  const httpServer = http.createServer(app);

  const server = new ApolloServer({ 
    typeDefs, 
    resolvers,
    csrfPrevention: false,
    plugins: [ApolloServerPluginLandingPageLocalDefault ()],
  });

  await server.start();

  app.use(
    "/graphql",
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => ({ token: req.headers.token }),
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