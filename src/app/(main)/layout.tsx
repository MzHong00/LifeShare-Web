import BottomNav from "@/components/common/BottomNav";
import styles from "./layout.module.scss";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.layout}>
      <main className={styles.main}>{children}</main>
      <BottomNav />
    </div>
  );
}
