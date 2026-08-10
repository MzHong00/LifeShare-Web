import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { modalActions } from "@/stores/useModalStore";
import { toastActions } from "@/stores/useToastStore";
import { TODO_COLORS } from "@/constants/theme";
import { getTodayDateString } from "@/utils/date";
import { useResetOnChange } from "@/hooks/useResetOnChange";

import { todoQueries } from "@/features/todo/queries/todoQueries";
import {
  useCreateTodoMutation,
  useUpdateTodoMutation,
  useDeleteTodoMutation,
} from "@/features/todo/queries/todoMutations";
import { useCurrentWorkspace } from "@/features/workspace/hooks/useCurrentWorkspace";

const MESSAGES = {
  notFound: "항목을 찾을 수 없습니다.",
  titleRequired: "제목을 입력해주세요.",
  updated: "항목이 수정되었습니다.",
  saveFailed: "저장에 실패했습니다. 다시 시도해주세요.",
  deleteFailed: "삭제에 실패했습니다. 다시 시도해주세요.",
} as const; // 폼 동작 결과를 알리는 토스트 메시지

/**
 * 할 일 생성/수정 폼의 상태와 저장·삭제 로직을 관리하는 훅.
 * todoId가 있으면 수정 모드, 없으면 생성 모드로 동작한다.
 */
export const useTodoForm = (todoId: string | null, initialDate: string | null) => {
  const router = useRouter();
  const { currentWorkspace } = useCurrentWorkspace();
  const workspaceId = currentWorkspace?.id ?? "";
  const { data: todos = [], isPending: isTodosPending } = useQuery(todoQueries.list(workspaceId));
  const createTodo = useCreateTodoMutation(workspaceId);
  const updateTodo = useUpdateTodoMutation(workspaceId);
  const deleteTodo = useDeleteTodoMutation(workspaceId);

  // 수정 모드일 때 기존 할 일을 찾아 초기값으로 사용한다.
  const existingTodo = useMemo(
    () => (todoId ? todos.find((t) => t.id === todoId) : null),
    [todoId, todos]
  );

  const [title, setTitle] = useState(existingTodo?.title || ""); // 제목
  const [description, setDescription] = useState(existingTodo?.description || ""); // 설명
  const [assigneeId, setAssigneeId] = useState<string | undefined>(existingTodo?.assigneeId); // 담당자 id
  const defaultDate = initialDate || getTodayDateString(); // 신규 생성 시 사용할 기본 날짜
  const [startDate, setStartDate] = useState(existingTodo?.startDate || defaultDate); // 시작일
  const [endDate, setEndDate] = useState(existingTodo?.endDate || defaultDate); // 종료일
  const [selectedColor, setSelectedColor] = useState(
    () => existingTodo?.color || TODO_COLORS[Math.floor(Math.random() * TODO_COLORS.length)]
  ); // 선택된 색상

  // 수정 모드에서 할 일 쿼리 로드가 초기 렌더보다 늦을 수 있어, 로드 완료(existingTodo.id 등장) 시 렌더 중 즉시 폼 값을 채운다
  const existingTodoChanged = useResetOnChange(existingTodo?.id);
  if (existingTodoChanged && existingTodo) {
    setTitle(existingTodo.title || "");
    setDescription(existingTodo.description || "");
    setAssigneeId(existingTodo.assigneeId);
    setStartDate(existingTodo.startDate);
    setEndDate(existingTodo.endDate);
    setSelectedColor(existingTodo.color || TODO_COLORS[0]);
  }

  const members = currentWorkspace?.members || [];
  // 로드 완료 후에도 현재 워크스페이스 목록에 없는 todoId(다른 워크스페이스 등 조작된 요청) 여부
  const isExistingTodoMissing = !!todoId && !isTodosPending && !existingTodo;

  /** 시작일을 변경하고 종료일이 앞서면 종료일도 같은 날짜로 보정한다 */
  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    if (date > endDate) setEndDate(date);
  };

  /** 종료일을 변경하고 시작일이 뒤서면 시작일도 같은 날짜로 보정한다 */
  const handleEndDateChange = (date: string) => {
    setEndDate(date);
    if (date < startDate) setStartDate(date);
  };

  /** 삭제 확인 모달을 띄우고 확인 시 서버에서 항목을 제거한다 */
  const handleDelete = () => {
    if (!todoId) return;
    if (isExistingTodoMissing) {
      toastActions.showToast(MESSAGES.notFound, "error");
      return;
    }
    modalActions.showModal({
      type: "confirm",
      title: "삭제",
      message: "이 항목을 삭제하시겠습니까?",
      onConfirm: async () => {
        try {
          await deleteTodo.mutateAsync(todoId);
          router.back();
        } catch {
          toastActions.showToast(MESSAGES.deleteFailed, "error");
        }
      },
    });
  };

  const isSaving = createTodo.isPending || updateTodo.isPending; // 저장(생성/수정) 진행 중 여부

  /** 입력값을 검증한 뒤 서버에 생성/수정하고 이전 화면으로 돌아간다 */
  const handleSave = async () => {
    if (isSaving) return;
    if (!title.trim()) {
      toastActions.showToast(MESSAGES.titleRequired, "error");
      return;
    }
    if (!currentWorkspace) return;
    if (isExistingTodoMissing) {
      toastActions.showToast(MESSAGES.notFound, "error");
      return;
    }

    const todoData = {
      workspaceId: currentWorkspace.id,
      title: title.trim(),
      description: description.trim(),
      isCompleted: existingTodo?.isCompleted ?? false, // 수정 시 기존 완료 상태 유지, 생성 시 false
      assigneeId,
      startDate,
      endDate,
      color: selectedColor,
    };

    try {
      if (todoId) {
        await updateTodo.mutateAsync({ id: todoId, updates: todoData });
        toastActions.showToast(MESSAGES.updated, "success");
      } else {
        await createTodo.mutateAsync(todoData);
      }
      router.back();
    } catch {
      toastActions.showToast(MESSAGES.saveFailed, "error");
    }
  };

  return {
    title,
    setTitle,
    description,
    setDescription,
    assigneeId,
    setAssigneeId,
    startDate,
    endDate,
    handleStartDateChange,
    handleEndDateChange,
    selectedColor,
    setSelectedColor,
    members,
    isSaving,
    handleSave,
    handleDelete,
  };
};
