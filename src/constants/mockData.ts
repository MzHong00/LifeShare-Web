export const MOCK_DATA = {
  user: {
    id: "user-1",
    name: "민수",
    email: "minsu@example.com",
    profileImage:
      "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&fit=crop",
  },
  partner: {
    id: "user-2",
    name: "지민",
    profileImage:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    status: "카페에서 공부 중 📖",
    location: "서울시 강남구 역삼동",
    lastActive: "5분 전",
  },
  workspace: {
    id: "ws-1",
    name: "민수 & 지민",
    type: "couple" as const,
    startDate: "2022-08-15",
    backgroundImage:
      "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800",
    nextEvent: {
      title: "우리의 1300일",
      date: "2026-03-09",
      remainingDays: 52,
    },
    members: [
      {
        id: "user-1",
        name: "민수",
        email: "minsu@example.com",
        avatar:
          "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&fit=crop",
      },
      {
        id: "user-2",
        name: "지민",
        email: "jimin@example.com",
        avatar:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
      },
    ],
  },
  extraWorkspaces: [
    {
      id: "ws-2",
      name: "우리 가족 여행 👨‍👩‍👧‍👦",
      type: "group" as const,
      startDate: "2024-01-01",
      members: [
        {
          id: "user-1",
          name: "민수",
          email: "minsu@example.com",
          avatar:
            "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&fit=crop",
        },
        {
          id: "user-3",
          name: "아빠",
          email: "dad@example.com",
          avatar:
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
        },
      ],
    },
    {
      id: "ws-3",
      name: "대학 동기 모임 🎓",
      type: "group" as const,
      startDate: "2023-12-25",
      members: [
        {
          id: "user-1",
          name: "민수",
          email: "minsu@example.com",
          avatar:
            "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&fit=crop",
        },
        {
          id: "user-6",
          name: "철수",
          email: "chulsu@example.com",
        },
      ],
    },
  ],
  chats: [
    {
      id: "msg-1",
      senderId: "user-2",
      text: "오늘 저녁 뭐 먹을까?",
      time: "오후 4:30",
    },
    {
      id: "msg-2",
      senderId: "user-1",
      text: "파스타 어때? 저번에 가보고 싶다던 곳!",
      time: "오후 4:32",
    },
    {
      id: "msg-3",
      senderId: "user-2",
      text: "좋아! 7시에 역 앞에서 만나",
      time: "오후 4:35",
    },
  ],
  stories: [
    {
      id: "story-1",
      title: "첫 캠핑 ⛺️",
      date: "2025-10-05",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400",
      path: [
        { latitude: 37.5, longitude: 127.03, timestamp: Date.now() },
        { latitude: 37.505, longitude: 127.035, timestamp: Date.now() },
      ],
      pathColor: "#3182F6",
      userId: "user-1",
      workspaceId: "ws-1",
    },
    {
      id: "story-2",
      title: "한강 산책 🌊",
      date: "2025-11-12",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?w=400",
      path: [
        { latitude: 37.51, longitude: 127.04, timestamp: Date.now() },
        { latitude: 37.515, longitude: 127.045, timestamp: Date.now() },
      ],
      pathColor: "#F04452",
      userId: "user-1",
      workspaceId: "ws-1",
    },
    {
      id: "story-3",
      title: "크리스마스 파티 🎄",
      date: "2025-12-25",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1543589077-47d81606c1bf?w=400",
      path: [],
      pathColor: "#00BA54",
      userId: "user-1",
      workspaceId: "ws-1",
    },
  ],
};
