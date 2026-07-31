"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, Heart, MessageCircle, User } from "lucide-react";

import { ROUTES } from "@/constants/routes";
import { cx } from "@/utils/cn";

import styles from "./BottomNav.module.scss";

const NAV_ITEMS = [
  { href: ROUTES.HOME.path, label: "홈", Icon: Home },
  { href: ROUTES.CHAT.path, label: "채팅", Icon: MessageCircle },
  { href: ROUTES.STORIES.path, label: "스토리", Icon: Heart },
  { href: ROUTES.MAP.path, label: "위치", Icon: MapPin },
  { href: ROUTES.PROFILE.path, label: "프로필", Icon: User },
];

const GNB_PATHS = NAV_ITEMS.map((item) => item.href);
const GNB_HEIGHT_CSS_VAR = "--gnb-height"; // GNB 실제 렌더 높이를 다른 화면(바텀시트 등)에서 참조하기 위한 CSS 변수명

export const BottomNav = () => {
  const navRef = useRef<HTMLElement>(null);

  const pathname = usePathname();
  const isGnbPage = GNB_PATHS.some((path) => pathname === path);

  // GNB 실제 높이를 CSS 변수로 노출해, 바텀시트가 GNB에 정확히 밀착되도록 함
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;

    const updateHeight = () => {
      document.documentElement.style.setProperty(GNB_HEIGHT_CSS_VAR, `${el.offsetHeight}px`);
    };

    updateHeight();
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(el);
    return () => resizeObserver.disconnect();
  }, [isGnbPage]);

  if (!isGnbPage) return null;

  return (
    <nav ref={navRef} className={styles.nav}>
      <div className={styles.navList}>
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href} className={styles.navLink}>
              <span className={cx(styles.pill, isActive && styles.pillActive)}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className={cx(styles.navLabel, isActive && styles.navLabelActive)}>
                  {label}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
