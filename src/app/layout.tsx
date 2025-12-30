import type { Metadata } from "next";
import "./globals.css";
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

        <style jsx global>{`
          .layout-container {
            display: flex;
            min-height: 100vh;
          }

          .main-content {
            flex: 1;
            margin-left: var(--sidebar-width);
            padding: 2rem;
            min-height: 100vh;
            background: var(--background);
          }

          @media (max-width: 768px) {
            .main-content {
              margin-left: 70px;
              padding: 1rem;
            }
          }
        `}</style>
      </body>
    </html>
  );
}
