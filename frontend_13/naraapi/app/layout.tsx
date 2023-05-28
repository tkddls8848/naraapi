import { useRouter } from "next/navigation";
import Header from "./component/staticComponent/header";
import Footer from "./component/staticComponent/footer";
import { checkCookies } from "cookies-next";
import { Metadata } from "next";

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
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
