import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QIndex — The Quilibrium Web Index",
  description: "A public index of discoverable websites, applications, tools and projects connected to the Quilibrium ecosystem.",
  themeColor: "#030304",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><head><noscript><style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style></noscript></head><body>{children}</body></html>;
}