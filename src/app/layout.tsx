import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Gitglow",
  description: "Profile README generation for GitHub developers.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
