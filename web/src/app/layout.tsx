import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const inter = Inter({
  variable: "--font-cosmica",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Portal de Clase Arduino",
  description: "Fichas imprimibles y seguimiento presencial para clase de Arduino.",
  icons: {
    icon: [
      {
        url: "/icons8-tablero-arduino-uno-dotted-96.png",
        sizes: "96x96",
        type: "image/png",
      },
      {
        url: "/icons8-tablero-arduino-uno-dotted-32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/icons8-tablero-arduino-uno-dotted-16.png",
        sizes: "16x16",
        type: "image/png",
      },
    ],
    shortcut: "/icons8-tablero-arduino-uno-dotted-32.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <ConvexClientProvider initialToken={null}>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            {children}
          </div>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
