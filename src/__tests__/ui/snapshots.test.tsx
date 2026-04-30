import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { Activity } from "lucide-react";
import { Checkbox } from "@/components/ui/Checkbox";
import { TextInput, NumberInput } from "@/components/ui/Input";
import { StatusBadge, Tag } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { FormField } from "@/components/layout/FormField";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { AppAvatar } from "@/components/AppAvatar";

describe("Checkbox snapshots", () => {
  it("unchecked", () => {
    const { container } = render(<Checkbox label="Restart on crash" checked={false} onChange={vi.fn()} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("checked", () => {
    const { container } = render(<Checkbox label="Restart on crash" checked onChange={vi.fn()} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("with hint", () => {
    const { container } = render(
      <Checkbox label="Force kill" hint="Skips WM_CLOSE" checked={false} onChange={vi.fn()} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe("Input snapshots", () => {
  it("TextInput default", () => {
    const { container } = render(<TextInput value="SimHub" onChange={vi.fn()} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("TextInput mono", () => {
    const { container } = render(<TextInput value="C:/SimHub/SimHub.exe" onChange={vi.fn()} mono />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("NumberInput", () => {
    const { container } = render(<NumberInput value={3} onChange={vi.fn()} min={1} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe("Badge snapshots", () => {
  it("StatusBadge running", () => {
    const { container } = render(
      <StatusBadge status={{ app_id: "1", state: { type: "running", pid: 1234 } }} enabled label="Running" />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("StatusBadge crashed", () => {
    const { container } = render(
      <StatusBadge status={{ app_id: "1", state: { type: "crashed" } }} enabled label="Crashed" />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("StatusBadge idle", () => {
    const { container } = render(
      <StatusBadge status={undefined} enabled label="Idle" />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("StatusBadge disabled", () => {
    const { container } = render(
      <StatusBadge status={undefined} enabled={false} label="Disabled" />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("Tag", () => {
    const { container } = render(<Tag>SimHub</Tag>);
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe("EmptyState snapshot", () => {
  it("without action", () => {
    const { container } = render(<EmptyState icon={Activity} message="No apps yet" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("with action", () => {
    const { container } = render(
      <EmptyState icon={Activity} message="No apps yet" action={<button>Add app</button>} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe("SectionDivider snapshot", () => {
  it("renders", () => {
    const { container } = render(<SectionDivider title="Basic" />);
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe("FormField snapshot", () => {
  it("with label only", () => {
    const { container } = render(
      <FormField label="Name"><input /></FormField>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("with hint", () => {
    const { container } = render(
      <FormField label="Name" hint="Display name"><input /></FormField>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe("ScreenHeader snapshot", () => {
  it("title only", () => {
    const { container } = render(<ScreenHeader title="Apps" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("with action", () => {
    const { container } = render(
      <ScreenHeader title="History" action={<button>Clear</button>} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe("AppAvatar snapshot", () => {
  it("renders first letter", () => {
    const { container } = render(<AppAvatar name="SimHub" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("color cycles by char code", () => {
    const { container: c1 } = render(<AppAvatar name="A" />);
    const { container: c2 } = render(<AppAvatar name="B" />);
    expect(c1.firstChild).toMatchSnapshot();
    expect(c2.firstChild).toMatchSnapshot();
  });
});
