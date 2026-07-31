/** BFF(API Route) 응답의 공통 에러 형태 */
interface BffErrorResponse {
  message?: string;
}

/** BFF(API Route)로 요청을 보내고, 실패 시 서버가 내려준 메시지로 에러를 throw한다 */
export const bffFetch = async <T>(
  path: string,
  fallbackMessage: string,
  init?: RequestInit
): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch (error) {
    throw new Error(fallbackMessage, { cause: error });
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as BffErrorResponse;
    throw new Error(body.message ?? fallbackMessage, { cause: body });
  }

  // 204 No Content 등 본문 없는 응답 처리
  if (response.status === 204) {
    return undefined as T;
  }
  try {
    return (await response.json()) as T;
  } catch (error) {
    // 리다이렉트된 HTML·빈 본문 등 JSON이 아닌 성공 응답도 도메인 에러로 변환한다
    throw new Error(fallbackMessage, { cause: error });
  }
};
