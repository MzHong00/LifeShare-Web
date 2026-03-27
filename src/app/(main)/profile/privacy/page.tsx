import { AppHeader } from "@/components/common/AppHeader";
import styles from "./privacy.module.scss";

const PrivacyPolicyPage = () => {
  return (
    <div className={styles.page}>
      <AppHeader />
      <div className={styles.content}>
        <h2 className={styles.h2}>개인정보 처리방침</h2>
        <p className={styles.p}>
          라이프쉐어(이하 "회사")는 이용자의 개인정보를 중요시하며, 「개인정보 보호법」을 준수하고 있습니다.
        </p>
        <h3 className={styles.h3}>1. 수집하는 개인정보 항목</h3>
        <p className={styles.p}>
          회사는 서비스 제공을 위해 아래와 같은 개인정보를 수집합니다:<br />
          - 이름, 이메일 주소<br />
          - 위치 정보 (서비스 이용 시)<br />
          - 프로필 이미지
        </p>
        <h3 className={styles.h3}>2. 개인정보의 수집 및 이용 목적</h3>
        <p className={styles.p}>
          수집한 개인정보는 다음의 목적에 이용됩니다:<br />
          - 서비스 제공 및 운영<br />
          - 회원 관리<br />
          - 맞춤형 서비스 제공
        </p>
        <h3 className={styles.h3}>3. 개인정보의 보유 및 이용 기간</h3>
        <p className={styles.p}>
          이용자의 개인정보는 서비스 이용 기간 동안 보유하며, 탈퇴 시 즉시 파기합니다.
        </p>
        <h3 className={styles.h3}>4. 개인정보의 파기</h3>
        <p className={styles.p}>
          회사는 개인정보 보유 기간이 경과하거나 처리 목적이 달성된 경우 해당 정보를 즉시 파기합니다.
        </p>
        <p className={styles.footer}>
          시행일: 2024년 1월 1일<br />
          버전: 1.0
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
