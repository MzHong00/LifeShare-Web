"use client";
import { Heart, Users } from "lucide-react";

import { APP_WORKSPACE } from "@/constants/config";
import { cx } from "@/utils/cn";
import { Checkbox } from "@/components/ui/Checkbox";
import styles from "./WorkspaceSetupView.module.scss";

import type { RoomType } from "@/features/workspace/types/workspace";

interface SetupCreateStepProps {
  subStep: "type" | "name"; // 유형 선택 / 이름 설정 세부 단계
  roomType: RoomType; // 현재 선택된 유형
  workspaceName: string; // 입력된 이름
  startDate: string; // 입력된 시작일
  isMain: boolean; // 메인 설정 여부
  /** 유형 선택 핸들러 */
  onSelectType: (type: RoomType) => void;
  /** 이름 입력 핸들러 */
  onChangeName: (name: string) => void;
  /** 시작일 입력 핸들러 */
  onChangeStartDate: (date: string) => void;
  /** 메인 설정 토글 핸들러 */
  onToggleMain: () => void;
}

const ROOM_TYPE_OPTIONS: { type: RoomType; label: string }[] = [
  { type: "couple", label: "커플 라이프룸" },
  { type: "group", label: "단체 라이프룸" },
];

export const SetupCreateStep = ({
  subStep,
  roomType,
  workspaceName,
  startDate,
  isMain,
  onSelectType,
  onChangeName,
  onChangeStartDate,
  onToggleMain,
}: SetupCreateStepProps) => (
  <div className={styles.topSection}>
    {subStep === "type" ? (
      <>
        <h2 className={styles.heading}>유형 선택</h2>
        <p className={styles.desc}>
          누구와 함께하는 {APP_WORKSPACE.KR}인가요?{"\n"}나중에 변경할 수 없으니 신중히 골라주세요.
        </p>
        <div className={styles.typeOptions}>
          {ROOM_TYPE_OPTIONS.map(({ type, label }) => {
            const isActive = roomType === type;
            const Icon = type === "couple" ? Heart : Users;
            const heartFill = isActive ? "var(--primary)" : "transparent"; // 커플 하트 채움 색
            const iconFill = type === "couple" ? heartFill : undefined; // 단체 아이콘은 채움 미적용
            return (
              <button
                key={type}
                onClick={() => onSelectType(type)}
                className={cx(
                  styles.typeButton,
                  isActive ? styles.typeButtonActive : styles.typeButtonInactive
                )}
              >
                <Icon
                  size={24}
                  color={isActive ? "var(--primary)" : "var(--grey-500)"}
                  fill={iconFill}
                />
                <span
                  className={cx(
                    styles.typeLabel,
                    isActive ? styles.typeLabelActive : styles.typeLabelInactive
                  )}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </>
    ) : (
      <div className={styles.formSection}>
        <h2 className={styles.heading}>이름 설정</h2>
        <p className={styles.desc}>
          우리만의 특별한 {APP_WORKSPACE.KR} 이름을{"\n"}지어주세요.
        </p>
        <input
          type="text"
          value={workspaceName}
          onChange={(e) => onChangeName(e.target.value)}
          placeholder={`${APP_WORKSPACE.KR} 이름을 입력하세요`}
          autoFocus
          className={styles.input}
        />
        <p className={styles.fieldLabel}>{roomType === "couple" ? "만난 날짜" : "시작일"}</p>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onChangeStartDate(e.target.value)}
          className={styles.input}
        />
        <Checkbox
          label={`메인 ${APP_WORKSPACE.KR}으로 설정`}
          isChecked={isMain}
          onPress={onToggleMain}
        />
      </div>
    )}
  </div>
);
