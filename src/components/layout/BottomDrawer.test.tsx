import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BottomDrawer } from "./BottomDrawer";

describe("BottomDrawer", () => {
  it("children을 렌더링한다", () => {
    render(
      <BottomDrawer>
        <div>드로어 내용</div>
      </BottomDrawer>
    );

    expect(screen.getByText("드로어 내용")).toBeInTheDocument();
  });

  it("초기 높이는 minHeight로 접힌 상태다", () => {
    const { container } = render(
      <BottomDrawer minHeight={50}>
        <div>내용</div>
      </BottomDrawer>
    );
    const drawer = container.firstChild as HTMLElement;

    expect(drawer).toHaveStyle({ height: "50px" });
  });

  it("bottomOffset을 전달하면 해당 값이 적용된다", () => {
    const { container } = render(
      <BottomDrawer bottomOffset="20px">
        <div>내용</div>
      </BottomDrawer>
    );
    const drawer = container.firstChild as HTMLElement;

    expect(drawer).toHaveStyle({ bottom: "20px" });
  });

  it("핸들을 드래그하면 높이가 변경된다", () => {
    const { container } = render(
      <BottomDrawer minHeight={40} initialHeightRatio={0.45} maxHeightRatio={0.8}>
        <div>내용</div>
      </BottomDrawer>
    );
    const drawer = container.firstChild as HTMLElement;
    const handle = screen.getByLabelText("드로어 높이 조절");

    fireEvent.mouseDown(handle, { clientY: 500 });
    fireEvent.mouseMove(document, { clientY: 300 });

    expect(drawer.style.height).not.toBe("40px");

    fireEvent.mouseUp(document);
  });

  it("드래그가 끝나면 가장 가까운 앵커 높이로 스냅된다", () => {
    const { container } = render(
      <BottomDrawer minHeight={40} initialHeightRatio={0.45} maxHeightRatio={0.8}>
        <div>내용</div>
      </BottomDrawer>
    );
    const drawer = container.firstChild as HTMLElement;
    const handle = screen.getByLabelText("드로어 높이 조절");

    fireEvent.mouseDown(handle, { clientY: 500 });
    fireEvent.mouseMove(document, { clientY: 500 - window.innerHeight * 0.45 });
    fireEvent.mouseUp(document);

    expect(drawer.style.height).toBe(`${window.innerHeight * 0.45}px`);
  });
});
