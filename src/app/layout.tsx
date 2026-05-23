import type { Metadata } from "next";
import "./globals.css";
import { ProductsProvider } from "@/lib/products-context";
import { SettingsProvider } from "@/lib/settings-context";

export const metadata: Metadata = {
  title: "GreenLedTech - Professional LED Grow Lights & Energy-Saving Solutions",
  description:
    "High-quality LED grow lights for commercial greenhouses and energy-saving LED lighting solutions for industrial applications.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <SettingsProvider>
          <ProductsProvider>{children}</ProductsProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
