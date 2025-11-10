import { readFileSync } from "fs";
import path from "path";
import gql from "graphql-tag";

const typeDefs = gql(
  readFileSync(path.join(__dirname, "./schema.graphql"), "utf-8")
);

export default typeDefs;