import type { Metadata, Viewport } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeScript } from "@/components/theme-script";
import "./globals.css";

/**
 * System fonts only — skip Google Fonts network + extra font files on Pi.
 */
export const metadata: Metadata = {
  title: "Dashboard OS",
  description:
    "Modular local-first dashboard for wall displays and Raspberry Pi kiosks",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Dashboard OS",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#070a10" },
    { media: "(prefers-color-scheme: light)", color: "#eef2f7" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full font-sans text-foreground antialiased">
        <ThemeProvider initialTheme="dark">
          <TooltipProvider delay={400}>
            <div className="dashboard-canvas min-h-dvh">{children}</div>
            <Toaster position="bottom-right" richColors={false} />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
