import { Suspense } from "react";

import { Spinner } from "@/components/feedback/Spinner";
import { AuthCallbackView } from "@/features/auth/components/AuthCallbackView";

import styles from "./page.module.scss";

const AuthCallbackPage = () => {
  return (
    <Suspense
      fallback={
        <div className={styles.container}>
          <Spinner />
        </div>
      }
    >
      <AuthCallbackView />
    </Suspense>
  );
};

export default AuthCallbackPage;
