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
const OG_IMAGE_PATH = "/app_icon.png"; // OG 공유 카드 이미지 경로 (파비콘은 app/icon.png·app/apple-icon.png 파일 규칙 사용)

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: APP_BRAND_NAME.EN, template: `%s | ${APP_BRAND_NAME.EN}` },
  description: SITE_DESCRIPTION,
  // 대부분의 페이지가 로그인 후에만 접근 가능해 기본은 비노출, 공개 페이지에서만 개별적으로 index: true override
  robots: NOINDEX_ROBOTS,
  openGraph: {
    title: APP_BRAND_NAME.EN,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE_PATH],
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
