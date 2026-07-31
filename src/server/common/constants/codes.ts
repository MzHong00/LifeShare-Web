import "server-only";

/** PostgREST/Postgres 에러 코드 (여러 API 라우트에서 공통으로 분기하는 값만 모아둔다) */
export const POSTGREST_ERROR_CODES = {
  NOT_FOUND: "PGRST116", // .single()에서 매칭되는 행이 0개거나 2개 이상일 때
  UNIQUE_VIOLATION: "23505", // Postgres unique constraint 위반
};
