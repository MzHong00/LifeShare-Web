"use client";
import { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Users, Check, Trash2 } from "lucide-react";
import { useTodoStore, todoActions } from "@/stores/useTodoStore";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { modalActions } from "@/stores/useModalStore";
import { getTodayDateString, getDateWithOffset } from "@/utils/date";
import { AppHeader } from "@/components/common/AppHeader";
import { ProfileAvatar } from "@/components/common/ProfileAvatar";
import { TODO_COLORS, COLORS } from "@/constants/theme";
import styles from "./todoCreate.module.scss";

const QUICK_DATES = [
  { label: "오늘", offset: 0 },
  { label: "내일", offset: 1 },
  { label: "다음 주", offset: 7 },
];

function TodoCreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const todoId = searchParams.get("todoId");
  const initialDate = searchParams.get("initialDate");

  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const todos = useTodoStore((s) => s.todos);

  const existingTodo = useMemo(
    () => (todoId ? todos.find((t) => t.id === todoId) : null),
    [todoId, todos]
  );

  const [title, setTitle] = useState(existingTodo?.title || "");
  const [description, setDescription] = useState(existingTodo?.description || "");
  const [assigneeId, setAssigneeId] = useState<string | undefined>(existingTodo?.assigneeId);
  const [startDate, setStartDate] = useState(existingTodo?.startDate || initialDate || getTodayDateString());
  const [endDate, setEndDate] = useState(existingTodo?.endDate || initialDate || getTodayDateString());
  const [selectedColor, setSelectedColor] = useState(
    existingTodo?.color || TODO_COLORS[Math.floor(Math.random() * TODO_COLORS.length)]
  );

  const members = currentWorkspace?.members || [];

  const handleDelete = () => {
    if (!todoId) return;
    modalActions.showModal({
      type: "confirm",
      title: "삭제",
      message: "이 항목을 삭제하시겠습니까?",
      onConfirm: () => {
        todoActions.removeTodo(todoId);
        router.back();
      },
    });
  };

  const handleSave = () => {
    if (!title.trim()) {
      modalActions.showModal({ type: "alert", title: "알림", message: "제목을 입력해주세요." });
      return;
    }
    if (!currentWorkspace) return;

    const todoData = {
      workspaceId: currentWorkspace.id,
      title: title.trim(),
      description: description.trim(),
      isCompleted: false,
      assigneeId,
      startDate,
      endDate,
      color: selectedColor,
    };

    if (todoId) {
      todoActions.updateTodo(todoId, todoData);
      modalActions.showModal({
        type: "alert",
        title: "알림",
        message: "항목이 수정되었습니다.",
        onConfirm: () => router.back(),
      });
    } else {
      todoActions.addTodo(todoData);
      router.back();
    }
  };

  return (
    <div className={styles.page}>
      <AppHeader
        title={todoId ? "할 일 수정" : "할 일 추가"}
        rightElement={
          todoId ? (
            <button onClick={handleDelete} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Trash2 size={20} color="var(--error)" />
            </button>
          ) : undefined
        }
      />

      <div className={styles.scrollArea}>
        <div className={styles.field}>
          <label className={styles.label}>제목 <span className={styles.required}>*</span></label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="무엇을 하나요? (예: 데이트, 장보기)"
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>설명 (선택)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="상세 내용을 입력해주세요."
            rows={3}
            className={styles.textarea}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>시작일</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              if (e.target.value > endDate) setEndDate(e.target.value);
            }}
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>종료일</label>
          <div className={styles.quickDates}>
            {QUICK_DATES.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  const d = getDateWithOffset(item.offset);
                  setEndDate(d);
                  if (d < startDate) setStartDate(d);
                }}
                className={styles.quickDateButton}
              >
                {item.label}
              </button>
            ))}
          </div>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              if (e.target.value < startDate) setStartDate(e.target.value);
            }}
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>색상 선택</label>
          <div className={styles.colorPicker}>
            {TODO_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={styles.colorButton}
                style={{
                  backgroundColor: color,
                  boxShadow: selectedColor === color ? `0 0 0 3px white, 0 0 0 5px ${color}` : "none",
                }}
              />
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>담당자 지정</label>
          <div className={styles.assigneeRow}>
            <button onClick={() => setAssigneeId(undefined)} className={styles.assigneeOption}>
              <div className={[styles.assigneeIcon, assigneeId === undefined ? styles.assigneeIconActive : styles.assigneeIconInactive].filter(Boolean).join(' ')}>
                <Users size={22} color={assigneeId === undefined ? "white" : COLORS.textTertiary} />
              </div>
              <span className={[styles.assigneeLabel, assigneeId === undefined ? styles.assigneeLabelActive : styles.assigneeLabelInactive].filter(Boolean).join(' ')}>
                공통
              </span>
            </button>

            {members.map((member) => {
              const isActive = assigneeId === member.id;
              return (
                <button key={member.id} onClick={() => setAssigneeId(member.id)} className={styles.assigneeOption}>
                  <div className={[styles.memberWrap, isActive && "ring-2"].filter(Boolean).join(' ')}>
                    <div style={isActive ? { outline: "2px solid var(--primary)", outlineOffset: 1, borderRadius: 9999 } : {}}>
                      <ProfileAvatar uri={member.avatar} name={member.name} size={56} />
                    </div>
                    {isActive && (
                      <div className={styles.checkBadge}>
                        <Check size={10} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <span className={[styles.assigneeLabel, isActive ? styles.assigneeLabelActive : styles.assigneeLabelInactive].filter(Boolean).join(' ')}>
                    {member.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <button onClick={handleSave} className={styles.saveButton}>
          {todoId ? "저장하기" : "추가하기"}
        </button>
      </div>
    </div>
  );
}

export default function TodoCreatePage() {
  return (
    <Suspense>
      <TodoCreateContent />
    </Suspense>
  );
}
