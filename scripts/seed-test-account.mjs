/**
 * 공용 체험(테스트) 계정의 데이터를 초기 상태로 되돌리는 재시딩 스크립트.
 *
 * 실행: npm run seed:test-account
 *
 * 테스트 계정은 모든 방문자가 공유하므로 데이터가 수정·삭제될 수 있다.
 * 이 스크립트를 다시 돌리면 하위 데이터(일정·할 일·스토리·메시지·초대)를 전부 지우고 새로 채운다.
 * 서비스 롤 키 없이 테스트 계정 세션(RLS 적용)만으로 동작하므로, 이 계정이 만질 수 있는 범위만 건드린다.
 * 워크스페이스 자체는 앱에 삭제 기능이 없어(RLS도 막혀 있을 가능성) 새로 만들지 않고 기존 것을 재사용한다.
 */
import { createClient } from "@supabase/supabase-js";

const {
  NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: SUPABASE_KEY,
  NEXT_PUBLIC_TEST_ACCOUNT_EMAIL: TEST_ACCOUNT_EMAIL,
  NEXT_PUBLIC_TEST_ACCOUNT_PASSWORD: TEST_ACCOUNT_PASSWORD,
} = process.env;

const TEST_PROFILE_NAME = "체험하기";
const TEST_PROFILE_AVATAR = "https://picsum.photos/seed/duous-demo-profile/200/200";
const TEST_WORKSPACE_NAME = "우리의 라이프룸";
const TEST_WORKSPACE_TYPE = "couple";
const TEST_THEME_COLOR = "pink";
const RELATIONSHIP_START_DAYS_AGO = 730; // 시작일: 2년 전 (기념일·D-day 화면이 채워지도록)

/** 오늘 기준 offset일만큼 이동한 날짜를 YYYY-MM-DD로 반환 (UTC 변환 시 날짜가 밀리지 않도록 로컬 기준으로 포맷) */
const day = (offset) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const dayOfMonth = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${dayOfMonth}`;
};

/** 서울 근방 좌표로 산책 경로(LocationPoint[])를 만든다 — 지도·스토리 상세의 폴리라인용 */
const makePath = (baseLat, baseLng, pointCount) =>
  Array.from({ length: pointCount }, (_, i) => ({
    latitude: baseLat + i * 0.0012,
    longitude: baseLng + i * 0.0016,
    timestamp: Date.now() - (pointCount - i) * 60_000,
  }));

const CALENDAR_EVENTS = [
  {
    title: "2주년 기념일 디너",
    description: "예약해둔 곳으로 저녁 7시까지",
    start_date: day(12),
    end_date: day(12),
    start_time: "19:00",
    end_time: "21:00",
    is_all_day: false,
    color: "#F044D2",
  },
  {
    title: "주말 제주 여행",
    description: "2박 3일 렌터카 예약 완료",
    start_date: day(26),
    end_date: day(28),
    start_time: null,
    end_time: null,
    is_all_day: true,
    color: "#3182F6",
  },
  {
    title: "영화 보기",
    description: null,
    start_date: day(4),
    end_date: day(4),
    start_time: "20:30",
    end_time: "22:40",
    is_all_day: false,
    color: "#8E44AD",
  },
  {
    title: "부모님 생신 식사",
    description: null,
    start_date: day(-9),
    end_date: day(-9),
    start_time: "12:00",
    end_time: "14:00",
    is_all_day: false,
    color: "#FFB800",
  },
  {
    title: "함께 등록한 클래스",
    description: "매주 화요일 저녁",
    start_date: day(-21),
    end_date: day(-21),
    start_time: "19:30",
    end_time: "21:00",
    is_all_day: false,
    color: "#00BA54",
  },
];

const TODOS = [
  {
    title: "기념일 케이크 예약하기",
    description: "딸기 생크림으로",
    is_completed: false,
    start_date: day(0),
    end_date: day(9),
    color: "#F044D2",
  },
  {
    title: "제주 숙소 최종 확정",
    description: null,
    is_completed: false,
    start_date: day(0),
    end_date: day(3),
    color: "#3182F6",
  },
  {
    title: "장보기 — 주말 요리 재료",
    description: "파스타 재료랑 와인",
    is_completed: false,
    start_date: day(0),
    end_date: day(1),
    color: "#00BA54",
  },
  {
    title: "사진 정리해서 앨범 만들기",
    description: null,
    is_completed: true,
    start_date: day(-14),
    end_date: day(-7),
    color: "#8E44AD",
  },
  {
    title: "렌터카 예약",
    description: null,
    is_completed: true,
    start_date: day(-10),
    end_date: day(-5),
    color: "#FF6B01",
  },
];

const STORIES = [
  {
    title: "한강 야경 산책",
    description: "바람 선선해서 두 바퀴나 돌았던 날",
    date: day(-6),
    thumbnail_url: "https://picsum.photos/seed/duous-demo-story-1/800/1066",
    path: makePath(37.5285, 126.9327, 12),
    path_color: "#3182F6",
  },
  {
    title: "성수동 카페 투어",
    description: "세 군데 돌았는데 두 번째 집이 제일 좋았음",
    date: day(-19),
    thumbnail_url: "https://picsum.photos/seed/duous-demo-story-2/800/1066",
    path: makePath(37.5445, 127.0557, 9),
    path_color: "#F044D2",
  },
  {
    title: "남산 올라간 날",
    description: "계단으로 올라가자고 한 거 후회했지만 야경은 최고",
    date: day(-38),
    thumbnail_url: "https://picsum.photos/seed/duous-demo-story-3/800/1066",
    path: makePath(37.5512, 126.9882, 14),
    path_color: "#FFB800",
  },
];

/** 실패 시 메시지를 출력하고 종료한다 */
const exitWithError = (message, error) => {
  console.error(`\n❌ ${message}`);
  if (error) console.error(`   ${error.message ?? error}`);
  process.exit(1);
};

const main = async () => {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    exitWithError("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY가 필요합니다.");
  }
  if (!TEST_ACCOUNT_EMAIL || !TEST_ACCOUNT_PASSWORD) {
    exitWithError(
      "NEXT_PUBLIC_TEST_ACCOUNT_EMAIL / NEXT_PUBLIC_TEST_ACCOUNT_PASSWORD가 필요합니다.\n" +
        "   Supabase 대시보드에서 테스트 계정을 만든 뒤 .env.local에 추가해주세요."
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. 테스트 계정 로그인 — 이후 모든 쿼리는 이 계정 권한(RLS)으로 수행된다
  const { data: auth, error: signInError } = await supabase.auth.signInWithPassword({
    email: TEST_ACCOUNT_EMAIL,
    password: TEST_ACCOUNT_PASSWORD,
  });
  if (signInError) exitWithError("테스트 계정 로그인에 실패했습니다.", signInError);
  const userId = auth.user.id;
  console.log(`✓ 테스트 계정 로그인 (${TEST_ACCOUNT_EMAIL})`);

  // 2. 프로필 — 앱의 로그인 콜백은 OAuth 메타데이터로 채우므로, 이메일 계정은 여기서 직접 지정한다
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: userId, name: TEST_PROFILE_NAME, avatar_url: TEST_PROFILE_AVATAR });
  if (profileError) exitWithError("프로필 설정에 실패했습니다.", profileError);
  console.log(`✓ 프로필 설정 (${TEST_PROFILE_NAME})`);

  // 3. 워크스페이스 확보 — 앱에 삭제 기능이 없어 기존 것을 재사용하고, 없을 때만 새로 만든다
  const { data: memberRows, error: memberError } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId);
  if (memberError) exitWithError("워크스페이스 조회에 실패했습니다.", memberError);

  let workspaceIds = memberRows.map((row) => row.workspace_id);

  if (workspaceIds.length === 0) {
    const { data: created, error: createError } = await supabase
      .from("workspaces")
      .insert({
        name: TEST_WORKSPACE_NAME,
        type: TEST_WORKSPACE_TYPE,
        start_date: day(-RELATIONSHIP_START_DAYS_AGO),
        created_by: userId,
      })
      .select("id")
      .single();
    if (createError) exitWithError("워크스페이스 생성에 실패했습니다.", createError);

    const { error: insertMemberError } = await supabase.from("workspace_members").insert({
      workspace_id: created.id,
      user_id: userId,
      display_name: TEST_PROFILE_NAME,
      email: TEST_ACCOUNT_EMAIL,
      avatar_url: TEST_PROFILE_AVATAR,
    });
    if (insertMemberError) exitWithError("멤버 등록에 실패했습니다.", insertMemberError);

    workspaceIds = [created.id];
    console.log("✓ 워크스페이스 생성");
  }

  const workspaceId = workspaceIds[0]; // 체험 시 실제로 보게 될 기본 워크스페이스

  // 4. 하위 데이터 전부 삭제 — 방문자가 다른 워크스페이스를 만들었을 수 있으므로 소속된 전부를 훑는다
  for (const table of ["messages", "todos", "stories", "calendar_events", "workspace_invites"]) {
    const { error } = await supabase.from(table).delete().in("workspace_id", workspaceIds);
    if (error) exitWithError(`${table} 초기화에 실패했습니다.`, error);
  }
  console.log("✓ 기존 데이터 삭제");

  // 5. 워크스페이스·멤버 정보를 기본값으로 되돌린다 (방문자가 이름·테마를 바꿨을 수 있음)
  const { error: updateWorkspaceError } = await supabase
    .from("workspaces")
    .update({
      name: TEST_WORKSPACE_NAME,
      type: TEST_WORKSPACE_TYPE,
      start_date: day(-RELATIONSHIP_START_DAYS_AGO),
      theme_color: TEST_THEME_COLOR,
    })
    .eq("id", workspaceId);
  if (updateWorkspaceError)
    exitWithError("워크스페이스 초기화에 실패했습니다.", updateWorkspaceError);

  const { error: updateMemberError } = await supabase
    .from("workspace_members")
    .update({ display_name: TEST_PROFILE_NAME, avatar_url: TEST_PROFILE_AVATAR })
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId);
  if (updateMemberError) exitWithError("멤버 정보 초기화에 실패했습니다.", updateMemberError);
  console.log("✓ 워크스페이스 정보 초기화");

  // 6. 새 데이터 삽입
  const { error: eventsError } = await supabase
    .from("calendar_events")
    .insert(CALENDAR_EVENTS.map((event) => ({ ...event, workspace_id: workspaceId })));
  if (eventsError) exitWithError("일정 생성에 실패했습니다.", eventsError);

  const { error: todosError } = await supabase
    .from("todos")
    .insert(TODOS.map((todo) => ({ ...todo, workspace_id: workspaceId, assignee_id: userId })));
  if (todosError) exitWithError("할 일 생성에 실패했습니다.", todosError);

  const { error: storiesError } = await supabase
    .from("stories")
    .insert(STORIES.map((story) => ({ ...story, workspace_id: workspaceId, user_id: userId })));
  if (storiesError) exitWithError("스토리 생성에 실패했습니다.", storiesError);

  console.log(
    `✓ 데이터 생성 (일정 ${CALENDAR_EVENTS.length} · 할 일 ${TODOS.length} · 스토리 ${STORIES.length})`
  );

  console.log("\n✅ 테스트 계정 재시딩 완료");
  if (workspaceIds.length > 1) {
    console.log(
      `⚠️  방문자가 만든 것으로 보이는 워크스페이스가 ${workspaceIds.length - 1}개 더 있습니다.\n` +
        "   데이터는 비웠지만 워크스페이스 자체는 앱에 삭제 기능이 없어 남아 있습니다(대시보드에서 수동 정리 필요)."
    );
  }
};

main();
