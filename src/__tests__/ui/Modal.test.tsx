import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "@/components/ui/Modal";

describe("Modal", () => {
  it("renders children", () => {
    render(<Modal onClickOutside={vi.fn()}><p>Content</p></Modal>);
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("has dialog role and aria-modal", () => {
    render(<Modal onClickOutside={vi.fn()}><p>Content</p></Modal>);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("calls onClickOutside when clicking the overlay", async () => {
    const user = userEvent.setup();
    const onClickOutside = vi.fn();
    render(<Modal onClickOutside={onClickOutside}><p>Content</p></Modal>);
    await user.click(screen.getByRole("dialog"));
    expect(onClickOutside).toHaveBeenCalledOnce();
  });

  it("does not call onClickOutside when clicking content inside", async () => {
    const user = userEvent.setup();
    const onClickOutside = vi.fn();
    render(
      <Modal onClickOutside={onClickOutside}>
        <div><button>Inner</button></div>
      </Modal>
    );
    await user.click(screen.getByRole("button", { name: "Inner" }));
    expect(onClickOutside).not.toHaveBeenCalled();
  });

  it("snapshot", () => {
    const { container } = render(
      <Modal onClickOutside={vi.fn()}>
        <div>Dialog content</div>
      </Modal>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
