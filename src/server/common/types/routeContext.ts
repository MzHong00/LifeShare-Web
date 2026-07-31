/** App Router Route Handler의 컨텍스트 (params가 Promise로 전달됨) */
export interface RouteContext<P> {
  params: Promise<P>;
}
