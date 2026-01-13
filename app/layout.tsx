import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import DifyChatbot from "../components/DifyChatbot";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Jaws Custom",
  description: "Custom motorcycle parts and accessories",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className={poppins.className}>
        <AuthProvider>
          {children}
          <DifyChatbot />
        </AuthProvider>
      </body>
    </html>
  );
}
