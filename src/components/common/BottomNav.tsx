"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Heart, MessageCircle, MapPin, User } from "lucide-react";
import styles from "./BottomNav.module.scss";

const navItems = [
  { href: "/home", label: "홈", Icon: Home },
  { href: "/stories", label: "스토리", Icon: Heart },
  { href: "/map", label: "위치", Icon: MapPin },
  { href: "/chat", label: "채팅", Icon: MessageCircle },
  { href: "/profile", label: "프로필", Icon: User },
];

const GNB_PATHS = navItems.map((item) => item.href);

export default function BottomNav() {
  const pathname = usePathname();
  const isGnbPage = GNB_PATHS.some((path) => pathname === path);

  if (!isGnbPage) return null;

  return (
    <nav className={styles.nav}>
      <div className={styles.navList}>
        {navItems.map(({ href, label, Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href} className={styles.navLink}>
              <span className={`${styles.pill} ${isActive ? styles.pillActive : ""}`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className={`${styles.navLabel} ${isActive ? styles.navLabelActive : ""}`}>
                  {label}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
