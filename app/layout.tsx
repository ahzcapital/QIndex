import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QIndex — Public ecosystem index",
  description: "A quiet, technical index of publicly discoverable projects connected to the Quilibrium ecosystem.",
  themeColor: "#050505",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
