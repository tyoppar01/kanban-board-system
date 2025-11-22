import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ApolloWrapper from "../components/ApolloWrapper";
import { AuthProvider } from "../contexts/AuthContext";

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
          <AuthProvider>
            <ApolloWrapper>
              {children}
            </ApolloWrapper>
          </AuthProvider>
        </body>
      </html>
  );
}
