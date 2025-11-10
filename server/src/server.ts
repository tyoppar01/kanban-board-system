import express = require("express");
import http = require("http");
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import cors from "cors";
import resolvers from "./graphql/resolvers/index";
import typeDefs from "./graphql/typeDefs";

// ==================== Middleware ======================== //
const app = express();
app.use(express.json());
app.use(cors());

// =================== Server Setup ======================= //

async function startServer() {

  const server = new ApolloServer({ typeDefs, resolvers });

  await server.start();

  app.use(
    "/graphql",
    cors<cors.CorsRequest>(),
    express.json(),
    expressMiddleware(server)
  );

  const httpServer = http.createServer(app);
  httpServer.listen(PORT, () => {
    console.log(`🚀 GraphQL Server ready at http://localhost:${PORT}/graphql`);
  });

  // timeout configuration
  httpServer.requestTimeout = 120000;
  httpServer.headersTimeout = 60000;
  httpServer.keepAliveTimeout = 10000;
  httpServer.timeout = 0;
}

const PORT = 8080;
startServer();