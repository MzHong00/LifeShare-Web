import "../styles/globals.scss";
import { QueryProvider } from "@/lib/QueryProvider";
import { SessionProvider } from "@/lib/SessionProvider";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/feedback/Toast";
import { GlobalLoadingOverlay } from "@/components/feedback/GlobalLoadingOverlay";
import { NOINDEX_ROBOTS } from "@/constants/seo";
import { APP_BRAND_NAME, SITE_URL } from "@/constants/config";

import type { Metadata } from "next";

const SITE_DESCRIPTION = "우리의 소중한 일상을 함께 나누는 공간"; // 기본 메타 설명
const APP_ICON_PATH = "/app_icon.png"; // 파비콘·OG 이미지 공용 경로

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: APP_BRAND_NAME.EN, template: `%s | ${APP_BRAND_NAME.EN}` },
  description: SITE_DESCRIPTION,
  icons: {
    icon: APP_ICON_PATH,
    apple: APP_ICON_PATH,
  },
  // 대부분의 페이지가 로그인 후에만 접근 가능해 기본은 비노출, 공개 페이지에서만 개별적으로 index: true override
  robots: NOINDEX_ROBOTS,
  openGraph: {
    title: APP_BRAND_NAME.EN,
    description: SITE_DESCRIPTION,
    images: [APP_ICON_PATH],
  },
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang="ko">
      <body>
        <QueryProvider>
          <SessionProvider>{children}</SessionProvider>
          <Modal />
          <Toast />
          <GlobalLoadingOverlay />
        </QueryProvider>
      </body>
    </html>
  );
};

export default RootLayout;
