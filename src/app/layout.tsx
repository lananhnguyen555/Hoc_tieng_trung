import type { Metadata } from "next";
import { Geist, Geist_Mono, Ma_Shan_Zheng } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const maShanZheng = Ma_Shan_Zheng({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-chinese",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Học Tiếng Trung - Chinese Learning Platform",
  description: "Học từ vựng, ngữ pháp và luyện viết Hán tự trực tuyến",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${geistSans.variable} ${geistMono.variable} ${maShanZheng.variable}`}>
        <Navbar />
        <main className="container">{children}</main>
      </body>
    </html>
  );
}

