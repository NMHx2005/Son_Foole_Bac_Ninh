import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FOOLE Bắc Ninh - Tra cứu báo giá",
  description: "Tra cứu báo giá linh kiện màn hình, pin và bảo hành.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
