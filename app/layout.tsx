import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "QIndex — The Quilibrium web index",
  description: "Discover publicly discoverable websites, applications, tools and projects connected to Quilibrium."
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}