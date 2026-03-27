"use client";
import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type QueryParamActions = {
  /** 단일 값 설정. 기존 값이 있으면 덮어씀 */
  set: (name: string, value: string) => void;
  /** 값이 없으면 추가, 있으면 제거 (다중 선택 필터에 유용) */
  toggle: (name: string, value: string) => void;
  /** 파라미터 제거. value를 넘기면 해당 값만 제거, 생략하면 name 전체 제거 */
  delete: (name: string, value?: string) => void;
};

/**
 * URL 쿼리스트링을 읽고 쓰는 훅.
 * 모든 변경은 router.replace로 반영되므로 히스토리를 오염시키지 않는다.
 *
 * @example
 * const [params, setParams] = useQueryParams();
 * const filter = params.get("filter") ?? "all";
 *
 * setParams.set("filter", "active");   // ?filter=active
 * setParams.toggle("tag", "여행");     // 없으면 추가, 있으면 제거
 * setParams.delete("filter");          // filter 파라미터 전체 제거
 */
export function useQueryParams() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // searchParams가 바뀔 때마다 새 인스턴스를 생성해 최신 상태를 반영한다.
  // useRef를 쓰면 searchParams 변화를 감지하지 못하므로 useMemo를 사용한다.
  const params = useMemo(
    () => new URLSearchParams(searchParams.toString()),
    [searchParams]
  );

  // params 변경을 URL에 반영한다. replace를 사용해 히스토리 스택을 오염시키지 않는다.
  // scroll: false로 스크롤 위치를 유지한다.
  const push = useCallback(
    (updated: URLSearchParams) => {
      router.replace(`?${updated.toString()}`, { scroll: false });
    },
    [router]
  );

  // 특정 파라미터를 단일 값으로 덮어쓴다.
  const set = useCallback(
    (name: string, value: string) => {
      params.set(name, value);
      push(params);
    },
    [params, push]
  );

  // 다중 값 파라미터에서 특정 값을 토글한다.
  // 이미 존재하면 제거, 없으면 추가한다.
  const toggle = useCallback(
    (name: string, value: string) => {
      const current = params.getAll(name);
      // 기존 값을 모두 지우고, 토글 대상을 제외한 나머지를 다시 append
      params.delete(name);
      current.filter((v) => v !== value).forEach((v) => params.append(name, v));
      // 기존에 없던 값이면 추가
      if (!current.includes(value)) params.append(name, value);
      push(params);
    },
    [params, push]
  );

  // 파라미터를 제거한다. value 미전달 시 해당 name의 모든 값을 제거한다.
  const remove = useCallback(
    (name: string, value?: string) => {
      params.delete(name, value);
      push(params);
    },
    [params, push]
  );

  // setParams 객체의 레퍼런스를 안정적으로 유지해 불필요한 리렌더를 방지한다.
  const setParams = useMemo<QueryParamActions>(
    () => ({ set, toggle, delete: remove }),
    [set, toggle, remove]
  );

  return [searchParams, setParams] as const;
}
