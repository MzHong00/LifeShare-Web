"use client";
import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { cx } from "@/utils/cn";
import { Skeleton } from "@/components/feedback/Skeleton";

import { FILTERS, useFilteredTodos } from "@/features/todo/hooks/useFilteredTodos";
import { TodoItem } from "@/features/todo/components/TodoItem";

import styles from "./TodoList.module.scss";

import type { Filter } from "@/features/todo/hooks/useFilteredTodos";
import type { Todo } from "@/features/todo/types/todo";
import type { Workspace } from "@/features/workspace/types/workspace";

// 캘린더 등 외부 소비자 호환을 위해 Filter 타입을 재노출한다.
export type { Filter };

const FILTER_LABELS: Record<Filter, string> = {
  all: "전체",
  active: "진행 중",
  completed: "완료",
};

const SKELETON_ROW_KEYS = ["todo-skeleton-1", "todo-skeleton-2", "todo-skeleton-3"]; // 로딩 스켈레톤 행 개수(3개)

interface TodoListProps {
  todos: Todo[];
  currentWorkspace: Workspace | null;
  // 캘린더처럼 특정 날짜 기준으로 추가할 때 initialDate를 넘길 수 있음
  initialDate?: string;
  // 현재 활성 필터. 부모(페이지)에서 URL 쿼리스트링과 동기화해 관리한다.
  filter: Filter;
  isPending?: boolean; // 할 일 목록 로딩 여부(true면 스켈레톤 표시)
  isError?: boolean; // 할 일 목록 조회 실패 여부(true면 에러 안내 표시)
  /** 필터 변경 핸들러 */
  onFilterChange: (filter: Filter) => void;
  /** 완료 여부 토글 핸들러 */
  onToggle: (id: string) => void;
}

export const TodoList = ({
  todos,
  currentWorkspace,
  initialDate,
  filter,
  isPending = false,
  isError = false,
  onFilterChange,
  onToggle,
}: TodoListProps) => {
  const router = useRouter();

  const displayedTodos = useFilteredTodos(todos, filter);

  // 항목별 담당자 조회를 O(n) find 대신 O(1) 조회로 처리하기 위해 id -> member 맵을 미리 구성한다
  const memberMap = useMemo(
    () => new Map(currentWorkspace?.members?.map((member) => [member.id, member])),
    [currentWorkspace]
  );

  /** 항목 클릭 시 상세/수정 화면으로 이동한다 */
  const handlePress = useCallback(
    (id: string) => router.push(ROUTES.TODO.CREATE.query({ todoId: id })),
    [router]
  );

  // initialDate가 있으면 해당 날짜를 기본값으로 세팅한 채로 생성 화면으로 이동한다.
  const addHref = initialDate ? ROUTES.TODO.CREATE.query({ initialDate }) : ROUTES.TODO.CREATE.path;
  const isEmpty = !isPending && !isError && displayedTodos.length === 0;

  return (
    <div className={styles.container}>
      {/* 필터 탭: 전체 / 진행 중 / 완료 */}
      <div className={styles.filters}>
        {FILTERS.map((f) => (
          <button
            key={f}
            className={cx(styles.filterButton, filter === f && styles.filterActive)}
            onClick={() => onFilterChange(f)}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {isPending &&
          SKELETON_ROW_KEYS.map((key) => (
            <div key={key} className={styles.skeletonRow} aria-hidden="true">
              <Skeleton width={26} height={26} radius="50%" />
              <div className={styles.skeletonTextGroup}>
                <Skeleton width="60%" height={16} />
                <Skeleton width="30%" height={13} />
              </div>
            </div>
          ))}

        {isError && <p className={styles.errorText}>할 일 목록을 불러오지 못했습니다.</p>}

        {isEmpty && (
          <div className={styles.empty}>
            <p className={styles.emptyText}>
              {filter === "completed" ? "완료된 할 일이 없습니다." : "할 일이 없습니다."}
            </p>
            {/* 완료 필터일 때는 추가 버튼을 숨긴다 */}
            {filter !== "completed" && (
              <button onClick={() => router.push(addHref)} className={styles.emptyAction}>
                할 일 추가하기
              </button>
            )}
          </div>
        )}

        {!isPending &&
          !isError &&
          !isEmpty &&
          displayedTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              item={todo}
              assignee={memberMap.get(todo.assigneeId ?? "")}
              onToggle={onToggle}
              onPress={handlePress}
            />
          ))}
      </div>
    </div>
  );
};
