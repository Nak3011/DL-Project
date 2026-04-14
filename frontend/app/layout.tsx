import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wildfire Prediction — AI Risk Assessment",
  description:
    "Upload satellite imagery to predict wildfire risk using deep learning. Visualize predictions on an interactive map with AQI estimation.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${inter.variable} h-full`}
    >
      <body
        className="min-h-full flex flex-col antialiased"
        style={{ background: "#050a0f" }}
      >
        {children}
      </body>
    </html>
  );
}
