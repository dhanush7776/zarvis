import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zarvis — Your AI Assistant",
  description:
    "Zarvis is a premium AI assistant with conversational chat, voice activation, document intelligence, and vision — built for people who expect their tools to feel like the future.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
