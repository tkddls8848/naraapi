"use client";

import "./globals.css";
import { useRouter } from "next/navigation";
import Header from "./component/staticComponent/header";
import Footer from "./component/staticComponent/footer";
import { checkCookies } from "cookies-next";
import { Inter } from "next/font/google";
import { Metadata } from "next";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "나라장터 검색 웹 페이지",
  icons: {
    icon: "icon.jpg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const rootRouter = useRouter();
  const check = checkCookies("userCookie");
  return (
    <html lang="en">
      <Header router={rootRouter} checkcookies={check} />
      <div>{children}</div>
      <Footer />
    </html>
  );
}
