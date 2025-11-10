import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ApolloProvider } from "@apollo/client/react";
import client from "../graphql/apolloClient";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kanban Board",
  description: "A simple Kanban board to manage tasks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en">
        <body className={`${inter.variable} antialiased`}>
              <ApolloProvider client={client}>
                {children}
              </ApolloProvider>
        </body>
      </html>
  );
}
