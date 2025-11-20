import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

const client = new ApolloClient({
  link: new HttpLink({ 
    uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:8080/graphql' 
  }), 
  cache: new InMemoryCache(),
});

export default client;