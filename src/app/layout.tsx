import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JagaSwap - Real-time AI Video Transformation",
  description: "Transform your video stream in real-time with AI-powered face swapping technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}