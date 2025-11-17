import { ApolloClient, InMemoryCache } from '@apollo/client';
import client from '../apolloClient';

describe('Apollo Client Configuration', () => {
  it('should be an instance of ApolloClient', () => {
    expect(client).toBeInstanceOf(ApolloClient);
  });

  it('should have InMemoryCache configured', () => {
    expect(client.cache).toBeInstanceOf(InMemoryCache);
  });

  it('should have correct GraphQL endpoint', () => {
    const link = client.link;
    expect(link).toBeDefined();
  });

  it('should be able to reset cache', async () => {
    await expect(client.clearStore()).resolves.not.toThrow();
  });
});
