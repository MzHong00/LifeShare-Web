import { NotFoundFallback } from "@/components/fallback/NotFoundFallback";

/** 존재하지 않는 경로 접근 시 노출되는 전역 404 페이지 (route group 밖 src/app 최상위) */
const NotFound = () => <NotFoundFallback />;

export default NotFound;
