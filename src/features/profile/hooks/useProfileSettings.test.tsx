import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { authApi } from "@/features/auth/api/auth";
import { authQueries } from "@/features/auth/queries/authQueries";
import { profileApi } from "@/features/profile/api/profile";
import { storageApi } from "@/lib/supabase/storage";
import { resizeImageFile } from "@/utils/imageResize";
import { modalActions } from "@/stores/useModalStore";
import { toastActions } from "@/stores/useToastStore";
import { useProfileSettings } from "./useProfileSettings";

import type { ChangeEvent, ReactNode } from "react";
import type { User } from "@/types/user";

const routerReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplace }),
}));

vi.mock("@/features/auth/api/auth", () => ({
  authApi: { signOut: vi.fn() },
}));

vi.mock("@/features/profile/api/profile", () => ({
  profileApi: { updateProfile: vi.fn(), getProfile: vi.fn() },
}));

vi.mock("@/lib/supabase/storage", () => ({
  storageApi: { uploadImage: vi.fn() },
}));

vi.mock("@/utils/imageResize", () => ({
  resizeImageFile: vi.fn(),
}));

vi.mock("@/stores/useModalStore", () => ({
  modalActions: { showModal: vi.fn() },
}));

vi.mock("@/stores/useToastStore", () => ({
  toastActions: { showToast: vi.fn() },
}));

let lastQueryClient: QueryClient; // 직전에 생성된 QueryClient (캐시 시드·검증용)

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  lastQueryClient = queryClient;
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

const USER_KEY = authQueries.user().queryKey;

/** 파일 input change 이벤트를 흉내 낸다 */
const createChangeEvent = (file: File | null) =>
  ({
    target: { files: file ? [file] : [], value: "C:\\fakepath\\photo.png" },
  }) as unknown as ChangeEvent<HTMLInputElement>;

/** changePhoto는 내부적으로 비동기지만 반환 타입이 void라 await 가능하도록 캐스팅한다 */
const invokeChangePhoto = (
  changePhoto: (event: ChangeEvent<HTMLInputElement>) => void,
  event: ChangeEvent<HTMLInputElement>
) => changePhoto(event) as unknown as Promise<void>;

const getCachedUser = () => lastQueryClient.getQueryData<User | null>(USER_KEY);

describe("useProfileSettings - confirmLogout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("로그아웃 실패 시 세션 정리·이동 없이 에러 토스트를 표시한다", async () => {
    vi.mocked(authApi.signOut).mockRejectedValueOnce(new Error("network error"));

    const { result } = renderHook(() => useProfileSettings(), { wrapper: createWrapper() });
    result.current.confirmLogout();

    const { onConfirm } = vi.mocked(modalActions.showModal).mock.calls[0][0];
    await onConfirm?.();

    await waitFor(() =>
      expect(toastActions.showToast).toHaveBeenCalledWith(
        "로그아웃에 실패했습니다. 다시 시도해주세요.",
        "error"
      )
    );
    expect(routerReplace).not.toHaveBeenCalled();
  });

  it("로그아웃 성공 시 로그인 페이지로 이동한다 (다음 로그인 시 이전 선택 라이프룸을 유지하기 위해 currentWorkspaceId는 지우지 않는다)", async () => {
    vi.mocked(authApi.signOut).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useProfileSettings(), { wrapper: createWrapper() });
    result.current.confirmLogout();

    const { onConfirm } = vi.mocked(modalActions.showModal).mock.calls[0][0];
    await onConfirm?.();

    await waitFor(() => expect(routerReplace).toHaveBeenCalledWith("/login"));
  });

  it("로그아웃 성공 시 쿼리 캐시를 비운다", async () => {
    vi.mocked(authApi.signOut).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useProfileSettings(), { wrapper: createWrapper() });
    lastQueryClient.setQueryData<User>(USER_KEY, { id: "user-1", name: "지민" });
    result.current.confirmLogout();

    const { onConfirm } = vi.mocked(modalActions.showModal).mock.calls[0][0];
    await onConfirm?.();

    expect(getCachedUser()).toBeUndefined();
  });
});

describe("useProfileSettings - openEditNameModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /** 이름 수정 모달을 띄우고 onConfirm 핸들러를 꺼낸다 */
  const openModal = (getName: () => string, currentName = "지민") => {
    const { result } = renderHook(() => useProfileSettings(), { wrapper: createWrapper() });
    lastQueryClient.setQueryData<User>(USER_KEY, { id: "user-1", name: currentName });
    result.current.openEditNameModal(currentName, <input />, getName);
    return vi.mocked(modalActions.showModal).mock.calls[0][0];
  };

  it("확인 모달을 이름 수정 제목으로 띄운다", () => {
    const config = openModal(() => "새이름");

    expect(config).toEqual(
      expect.objectContaining({ type: "confirm", title: "이름 수정", confirmText: "변경하기" })
    );
  });

  it("입력값이 공백뿐이면 프로필을 수정하지 않는다", async () => {
    const { onConfirm } = openModal(() => "   ");

    await onConfirm?.();

    expect(profileApi.updateProfile).not.toHaveBeenCalled();
    expect(getCachedUser()?.name).toBe("지민");
  });

  it("이름 변경 성공 시 캐시를 갱신하고 성공 토스트를 표시한다", async () => {
    vi.mocked(profileApi.updateProfile).mockResolvedValueOnce(undefined);
    const { onConfirm } = openModal(() => "  새이름  ");

    await onConfirm?.();

    expect(profileApi.updateProfile).toHaveBeenCalledWith({ name: "새이름" });
    expect(getCachedUser()?.name).toBe("새이름");
    expect(toastActions.showToast).toHaveBeenCalledWith(
      "이름이 성공적으로 변경되었습니다",
      "success"
    );
  });

  it("이름 변경 실패 시 이전 이름으로 롤백하고 에러 토스트를 표시한다", async () => {
    vi.mocked(profileApi.updateProfile).mockRejectedValueOnce(new Error("fail"));
    const { onConfirm } = openModal(() => "새이름");

    await onConfirm?.();

    expect(getCachedUser()?.name).toBe("지민");
    expect(toastActions.showToast).toHaveBeenCalledWith(
      "이름 변경에 실패했습니다. 다시 시도해주세요.",
      "error"
    );
  });

  it("사용자 캐시가 없으면 캐시를 새로 만들지 않는다", async () => {
    vi.mocked(profileApi.updateProfile).mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useProfileSettings(), { wrapper: createWrapper() });
    result.current.openEditNameModal("지민", <input />, () => "새이름");

    const { onConfirm } = vi.mocked(modalActions.showModal).mock.calls[0][0];
    await onConfirm?.();

    expect(getCachedUser()).toBeUndefined();
  });
});

describe("useProfileSettings - changePhoto", () => {
  const file = new File(["raw"], "photo.png", { type: "image/png" });
  const resizedFile = new File(["small"], "photo.jpg", { type: "image/jpeg" });
  const createObjectURL = vi.fn(() => "blob:preview");
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    vi.mocked(resizeImageFile).mockResolvedValue(resizedFile);
    vi.mocked(storageApi.uploadImage).mockResolvedValue("https://cdn/new.jpg");
    vi.mocked(profileApi.updateProfile).mockResolvedValue(undefined);
  });

  /** 사용자 캐시를 시드한 훅을 렌더링한다 */
  const renderWithUser = (
    user: User | null = {
      id: "user-1",
      name: "지민",
      profileImage: "https://cdn/old.jpg",
    }
  ) => {
    const { result } = renderHook(() => useProfileSettings(), { wrapper: createWrapper() });
    if (user) lastQueryClient.setQueryData(USER_KEY, user);
    return result;
  };

  it("같은 파일 재선택이 가능하도록 input value를 초기화한다", async () => {
    const result = renderWithUser();
    const event = createChangeEvent(file);

    await invokeChangePhoto(result.current.changePhoto, event);

    expect(event.target.value).toBe("");
  });

  it("선택된 파일이 없으면 업로드하지 않는다", async () => {
    const result = renderWithUser();

    await invokeChangePhoto(result.current.changePhoto, createChangeEvent(null));

    expect(storageApi.uploadImage).not.toHaveBeenCalled();
  });

  it("사용자 캐시가 없으면 업로드하지 않는다", async () => {
    const result = renderWithUser(null);

    await invokeChangePhoto(result.current.changePhoto, createChangeEvent(file));

    expect(storageApi.uploadImage).not.toHaveBeenCalled();
  });

  it("업로드 성공 시 리사이즈 후 업로드하고 캐시를 최종 URL로 갱신한다", async () => {
    const result = renderWithUser();

    await invokeChangePhoto(result.current.changePhoto, createChangeEvent(file));

    expect(resizeImageFile).toHaveBeenCalledWith(file);
    expect(storageApi.uploadImage).toHaveBeenCalledWith(resizedFile, "user-1");
    expect(profileApi.updateProfile).toHaveBeenCalledWith({ profileImage: "https://cdn/new.jpg" });
    expect(getCachedUser()?.profileImage).toBe("https://cdn/new.jpg");
    expect(toastActions.showToast).toHaveBeenCalledWith("프로필 사진이 변경되었습니다", "success");
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:preview");
  });

  it("업로드 실패 시 이전 이미지로 롤백하고 에러 토스트를 표시한다", async () => {
    vi.mocked(storageApi.uploadImage).mockRejectedValueOnce(new Error("upload fail"));
    const result = renderWithUser();

    await invokeChangePhoto(result.current.changePhoto, createChangeEvent(file));

    expect(getCachedUser()?.profileImage).toBe("https://cdn/old.jpg");
    expect(toastActions.showToast).toHaveBeenCalledWith(
      "프로필 사진 변경에 실패했습니다. 다시 시도해주세요.",
      "error"
    );
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:preview");
  });

  it("업로드가 진행 중이면 중복 요청을 무시한다", async () => {
    let resolveUpload: (url: string) => void = () => {};
    vi.mocked(storageApi.uploadImage).mockReturnValueOnce(
      new Promise<string>((resolve) => {
        resolveUpload = resolve;
      })
    );
    const result = renderWithUser();

    const first = invokeChangePhoto(result.current.changePhoto, createChangeEvent(file));
    await invokeChangePhoto(result.current.changePhoto, createChangeEvent(file));
    resolveUpload("https://cdn/new.jpg");
    await first;

    expect(storageApi.uploadImage).toHaveBeenCalledTimes(1);
  });
});
