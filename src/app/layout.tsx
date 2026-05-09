import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crypto Sentiment Oracle",
  description: "AI-powered crypto sentiment analysis on GenLayer blockchain",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#030712", color: "white", fontFamily: "sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
