import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UniPath - 4-Year Academic Planner",
  description: "Plan your academic journey with a personalized 4-year plan",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
