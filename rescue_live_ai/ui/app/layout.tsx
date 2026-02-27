import "../styles/globals.css";
import React from "react";

export const metadata = {
  title: "RescueLiveAI",
  description: "Real-Time Radar-Based Living Person Detection & AI Decision System"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
