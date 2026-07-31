"use client";
import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { authQueries } from "@/features/auth/queries/authQueries";
import { useCurrentWorkspace } from "@/features/workspace/hooks/useCurrentWorkspace";
import { ProfileImage } from "@/components/ui/ProfileImage";
import { MemberListContent } from "./MemberListContent";
import { modalActions } from "@/stores/useModalStore";

import { ActivityDashboard } from "./ActivityDashboard";
import { AnniversaryJourney } from "./AnniversaryJourney";
import { AnniversarySpotlight } from "./AnniversarySpotlight";
import { UpcomingDigest } from "./UpcomingDigest";

import styles from "./MemoryFeed.module.scss";

const AFTERNOON_START_HOUR = 12; // 오후 인사말 시작 시각
const EVENING_START_HOUR = 18; // 저녁 인사말 시작 시각
const NIGHT_START_HOUR = 22; // 밤 인사말 시작 시각
const MORNING_START_HOUR = 5; // 아침 인사말 시작 시각

/** 현재 시각대에 맞는 인사말 문구를 반환 */
const getTimeGreeting = (hour: number): string => {
  if (hour >= NIGHT_START_HOUR || hour < MORNING_START_HOUR) return "포근한 밤이에요";
  if (hour >= EVENING_START_HOUR) return "좋은 저녁이에요";
  if (hour >= AFTERNOON_START_HOUR) return "좋은 오후예요";
  return "좋은 아침이에요";
};

/** 홈 화면 본문: 인사말 헤더 + 함께한 날 스포트라이트 + 기념일 여정 레일 + 일정·할 일 다이제스트 + 활동 대시보드 */
export const MemoryFeed = () => {
  const { currentWorkspace } = useCurrentWorkspace();
  const { data: user } = useQuery(authQueries.user());
  // 참여자 아바타 스택은 역순으로 표시하므로 members 참조가 바뀔 때만 재계산한다
  const reversedMembers = useMemo(
    () => [...(currentWorkspace?.members ?? [])].reverse(),
    [currentWorkspace?.members]
  );

  if (!currentWorkspace || !user) return null;

  const greeting = getTimeGreeting(new Date().getHours());

  /** 참여자 아바타 스택 클릭 시 참여자 목록 모달 표시 */
  const handleMembersClick = () => {
    const members = currentWorkspace.members;
    if (!members?.length) return;
    modalActions.showModal({
      type: "alert",
      title: "참여자 목록",
      content: <MemberListContent members={members} />,
      confirmText: "닫기",
    });
  };

  return (
    <div className={styles.feed}>
      <div className={styles.board}>
        {/* 중앙 스크롤 영역: 프레임리스 헤더 + 인사말 + 기념일 스포트라이트 + 일정·할 일 다이제스트 + 활동 대시보드 */}
        <div className={styles.content}>
          {/* 상단 프레임리스 헤더: 시간대별 인사말 + 참여자 아바타 스택 (스크롤에 함께 흘러감) */}
          <header className={styles.header}>
            <div className={styles.headerInfo}>
              <p className={styles.greetingLine}>
                {greeting}
                {user.name ? `, ${user.name}님` : ""}
              </p>
              <p className={styles.greetingSub}>오늘의 순간도 소중하게 기록해보세요</p>
            </div>
            <button
              type="button"
              onClick={handleMembersClick}
              className={styles.membersStack}
              aria-label={`참여자 ${currentWorkspace.members?.length ?? 0}명 보기`}
            >
              {reversedMembers.map((member) => (
                <div key={member.id} className={styles.memberAvatar}>
                  <ProfileImage uri={member.avatar} name={member.name} size={28} />
                </div>
              ))}
            </button>
          </header>

          <AnniversarySpotlight />
          <AnniversaryJourney />
          <UpcomingDigest />
          <ActivityDashboard />
        </div>
      </div>
    </div>
  );
};
