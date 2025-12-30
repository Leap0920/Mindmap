import type { Metadata } from "next";
import "./globals.css";
import "./layout.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Mindmap | Your Personal Space",
  description: "A monochrome minimalist productivity dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="layout-container">
          <Sidebar />
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
