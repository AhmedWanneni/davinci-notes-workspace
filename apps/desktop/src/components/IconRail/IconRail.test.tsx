// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@app/design-system";
import { IconRail } from "./IconRail";

function renderIconRail(props: Partial<Parameters<typeof IconRail>[0]> = {}) {
  const defaults = {
    isLeftSidebarOpen: false,
    onToggleLeftSidebar: vi.fn(),
    onOpenSearch: vi.fn(),
    onOpenGlobalGraph: vi.fn(),
    onOpenSettings: vi.fn(),
    onCloseVault: vi.fn(),
    isGlobalGraphOpen: false,
  };
  return render(
    <TooltipProvider>
      <IconRail {...defaults} {...props} />
    </TooltipProvider>,
  );
}

describe("IconRail", () => {
  it("renders navigation buttons and triggers onOpenGlobalGraph", () => {
    const onOpenGlobalGraph = vi.fn();
    renderIconRail({ onOpenGlobalGraph });

    const graphBtn = screen.getByLabelText("Graph view");
    expect(graphBtn).toBeDefined();
    expect(graphBtn.getAttribute("data-active")).toBeNull();

    fireEvent.click(graphBtn);
    expect(onOpenGlobalGraph).toHaveBeenCalledOnce();
  });

  it("marks graph button as active when isGlobalGraphOpen is true", () => {
    renderIconRail({ isGlobalGraphOpen: true });

    const graphBtn = screen.getByLabelText("Graph view");
    expect(graphBtn.getAttribute("data-active")).toBe("true");
  });

  it("triggers sidebar toggle and search handlers", () => {
    const onToggleLeftSidebar = vi.fn();
    const onOpenSearch = vi.fn();
    renderIconRail({
      isLeftSidebarOpen: true,
      onToggleLeftSidebar,
      onOpenSearch,
    });

    const filesBtn = screen.getByLabelText("Files");
    expect(filesBtn.getAttribute("data-active")).toBe("true");

    fireEvent.click(filesBtn);
    expect(onToggleLeftSidebar).toHaveBeenCalledOnce();

    const searchBtn = screen.getByLabelText("Search");
    fireEvent.click(searchBtn);
    expect(onOpenSearch).toHaveBeenCalledOnce();
  });

  it("renders reminders button and triggers onOpenReminders", () => {
    const onOpenReminders = vi.fn();
    renderIconRail({ onOpenReminders });

    const remindersBtn = screen.getByLabelText("Reminders");
    expect(remindersBtn).toBeDefined();

    fireEvent.click(remindersBtn);
    expect(onOpenReminders).toHaveBeenCalledOnce();
  });

  it("renders calendar button, triggers onOpenCalendar, and reflects isCalendarOpen", () => {
    const onOpenCalendar = vi.fn();
    const { rerender } = renderIconRail({
      onOpenCalendar,
      isCalendarOpen: false,
    });

    const calBtn = screen.getByLabelText("Calendar");
    expect(calBtn).toBeDefined();
    expect(calBtn.getAttribute("data-active")).toBeNull();

    fireEvent.click(calBtn);
    expect(onOpenCalendar).toHaveBeenCalledOnce();

    rerender(
      <TooltipProvider>
        <IconRail
          isLeftSidebarOpen={false}
          onToggleLeftSidebar={vi.fn()}
          onOpenSearch={vi.fn()}
          onOpenGlobalGraph={vi.fn()}
          onOpenSettings={vi.fn()}
          onCloseVault={vi.fn()}
          onOpenCalendar={onOpenCalendar}
          isCalendarOpen={true}
        />
      </TooltipProvider>,
    );

    const activeCalBtn = screen.getByLabelText("Calendar");
    expect(activeCalBtn.getAttribute("data-active")).toBe("true");
  });

  it("renders AI agent button, triggers onOpenAgent, and reflects isAgentOpen", () => {
    const onOpenAgent = vi.fn();
    const { rerender } = renderIconRail({ onOpenAgent, isAgentOpen: false });

    const agentBtn = screen.getByLabelText("AI Agent");
    expect(agentBtn).toBeDefined();
    expect(agentBtn.getAttribute("data-active")).toBeNull();

    fireEvent.click(agentBtn);
    expect(onOpenAgent).toHaveBeenCalledOnce();

    rerender(
      <TooltipProvider>
        <IconRail
          isLeftSidebarOpen={false}
          onToggleLeftSidebar={vi.fn()}
          onOpenSearch={vi.fn()}
          onOpenGlobalGraph={vi.fn()}
          onOpenSettings={vi.fn()}
          onCloseVault={vi.fn()}
          onOpenAgent={onOpenAgent}
          isAgentOpen={true}
        />
      </TooltipProvider>,
    );

    const activeAgentBtn = screen.getByLabelText("AI Agent");
    expect(activeAgentBtn.getAttribute("data-active")).toBe("true");
  });

  it("renders Ask Your Vault button, triggers onOpenAskVault, and reflects isAskVaultOpen", () => {
    const onOpenAskVault = vi.fn();
    const { rerender } = renderIconRail({
      onOpenAskVault,
      isAskVaultOpen: false,
    });

    const askBtn = screen.getByLabelText("Ask Your Vault");
    expect(askBtn).toBeDefined();
    expect(askBtn.getAttribute("data-active")).toBeNull();

    fireEvent.click(askBtn);
    expect(onOpenAskVault).toHaveBeenCalledOnce();

    rerender(
      <TooltipProvider>
        <IconRail
          isLeftSidebarOpen={false}
          onToggleLeftSidebar={vi.fn()}
          onOpenSearch={vi.fn()}
          onOpenGlobalGraph={vi.fn()}
          onOpenSettings={vi.fn()}
          onCloseVault={vi.fn()}
          onOpenAskVault={onOpenAskVault}
          isAskVaultOpen={true}
        />
      </TooltipProvider>,
    );

    const activeAskBtn = screen.getByLabelText("Ask Your Vault");
    expect(activeAskBtn.getAttribute("data-active")).toBe("true");
  });

  it("renders AI listening button, triggers onOpenListening, and reflects isListeningOpen", () => {
    const onOpenListening = vi.fn();
    const { rerender } = render(
      <TooltipProvider>
        <IconRail
          isLeftSidebarOpen={false}
          onToggleLeftSidebar={vi.fn()}
          onOpenSearch={vi.fn()}
          onOpenGlobalGraph={vi.fn()}
          onOpenSettings={vi.fn()}
          onCloseVault={vi.fn()}
          onOpenListening={onOpenListening}
          isListeningOpen={false}
        />
      </TooltipProvider>,
    );

    const listeningBtn = screen.getByLabelText("AI Listening");
    expect(listeningBtn).toBeDefined();
    expect(listeningBtn.getAttribute("data-active")).toBeNull();

    fireEvent.click(listeningBtn);
    expect(onOpenListening).toHaveBeenCalledOnce();

    rerender(
      <TooltipProvider>
        <IconRail
          isLeftSidebarOpen={false}
          onToggleLeftSidebar={vi.fn()}
          onOpenSearch={vi.fn()}
          onOpenGlobalGraph={vi.fn()}
          onOpenSettings={vi.fn()}
          onCloseVault={vi.fn()}
          onOpenListening={onOpenListening}
          isListeningOpen={true}
        />
      </TooltipProvider>,
    );

    const activeListeningBtn = screen.getByLabelText("AI Listening");
    expect(activeListeningBtn.getAttribute("data-active")).toBe("true");
  });
});
