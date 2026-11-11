import { lazy, Suspense, useEffect, useState } from "react";
import { AgentWelcomeView } from "./AgentWelcomeView";
import { AgentProjectView } from "./AgentProjectView";
import { AgentActiveChat } from "./AgentActiveChat";
import { AgentAvailabilityBanner } from "./AgentAvailabilityBanner";
import { AgentLibraryBoard, AgentLibraryErrorBoundary } from "./Library";
import { useScheduledRunDispatch } from "./Scheduled/useScheduledRunDispatch";
import { useAgentExecution } from "./useAgentExecution";
import { useAgentConversations } from "./useAgentConversations";
import { useAgentMessageSync } from "./useAgentMessageSync";
import { useAgentViewConfig } from "./useAgentViewConfig";
import { useAgentStore } from "./useAgentStore";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import type { AIProviderId } from "../../ai/AISubsystem";
import "./AgentView.scss";

const LazyAgentScheduledView = lazy(() =>
  import("./Scheduled/AgentScheduledView").then((m) => ({
    default: m.AgentScheduledView,
  })),
);

export interface AgentViewProps {
  onOpenSettings?: () => void;
}

export function AgentView({
  onOpenSettings: _onOpenSettings,
}: AgentViewProps = {}) {
  const {
    webSearchEnabled,
    autoApply,
    rewriteEnabled,
    shortcuts,
  } = useAgentViewConfig();

  const vaultPath = useWorkspaceStore((state) => state.vaultPath);
  const vaultName = vaultPath
    ? vaultPath.split(/[/\\]/).pop() || "Vault"
    : "Vault";

  const selectedModel = useAgentStore((s) => s.selectedModel);
  const selectedProvider = useAgentStore((s) => s.selectedProvider);
  const selectedCliAgent = useAgentStore((s) => s.selectedCliAgent);
  const activeProjectId = useAgentStore((s) => s.activeProjectId);
  const activeNavSection = useAgentStore((s) => s.activeNavSection);
  const projectInstructions = useAgentStore((s) => s.projectInstructions);
  const pendingPromptText = useAgentStore((s) => s.pendingPromptText);
  const setPendingPromptText = useAgentStore((s) => s.setPendingPromptText);
  const selectProject = useAgentStore((s) => s.selectProject);
  const deleteConversation = useAgentStore((s) => s.deleteConversation);
  const renameConversation = useAgentStore((s) => s.renameConversation);

  const {
    projects,
    activeConversation,
    activeConversationId,
    conversations,
    createNewConversation,
    saveActiveMessages,
  } = useAgentConversations();

  const currentProjectId = activeConversation
    ? (activeConversation.projectId ?? null)
    : activeProjectId;
  const activeProject = currentProjectId
    ? projects.find((p) => p.id === currentProjectId)
    : undefined;

  const {
    messages,
    stagedChanges,
    isStreaming,
    handleApplyChange,
    handleRejectChange,
    handleApplyAllChanges,
    sendMessage,
    abortExecution,
    setMessages,
  } = useAgentExecution({
    providerId: selectedProvider as AIProviderId,
    model: selectedModel,
    webSearchEnabled,
    autoApply,
    rewriteEnabled,
    vaultName,
    selectedCliAgent,
    vaultPath: vaultPath ?? undefined,
    projectId: currentProjectId ?? undefined,
    projectSources: currentProjectId ? activeProject?.sources : undefined,
    projectInstructions: currentProjectId
      ? (activeProject?.instructions ?? projectInstructions[currentProjectId])
      : undefined,
    projectName: currentProjectId ? activeProject?.name : undefined,
    conversations: currentProjectId ? conversations : undefined,
    activeConversationId: activeConversationId ?? undefined,
  });

  const [chatInput, setChatInput] = useState("");

  useAgentMessageSync({
    activeConversationId,
    activeConversation,
    messages,
    isStreaming,
    setMessages,
    saveActiveMessages,
  });

  // Fires scheduled prompts at their time (single timer, no polling).
  useScheduledRunDispatch({
    isStreaming,
    messages,
    activeConversationId,
    setMessages,
    sendMessage,
  });

  useEffect(() => {
    if (pendingPromptText) {
      setChatInput((prev) =>
        prev ? `${prev}\n\n${pendingPromptText}` : pendingPromptText,
      );
      setPendingPromptText(null);
    }
  }, [pendingPromptText, setPendingPromptText]);

  const availabilityBanner = (
    <AgentAvailabilityBanner
      providerId={selectedProvider as AIProviderId}
      selectedCliAgent={selectedCliAgent}
      onOpenSettings={_onOpenSettings}
    />
  );

  if (activeNavSection === "library") {
    return (
      <div
        className="agent-view"
        role="main"
        aria-label="AI Vault Agent Library"
      >
        <AgentLibraryErrorBoundary>
          <AgentLibraryBoard />
        </AgentLibraryErrorBoundary>
      </div>
    );
  }

  if (activeNavSection === "scheduled") {
    return (
      <div className="agent-view" role="main" aria-label="AI Agent Scheduled">
        <Suspense fallback={null}>
          <LazyAgentScheduledView />
        </Suspense>
      </div>
    );
  }

  if (currentProjectId && (!activeConversationId || messages.length === 0)) {
    return (
      <div className="agent-view" role="main" aria-label="AI Vault Agent">
        {availabilityBanner}
        <AgentProjectView
          projectId={currentProjectId}
          onSend={(prompt, imgs) => {
            if (!activeConversationId) {
              void createNewConversation("New Chat", currentProjectId).then(
                () => void sendMessage(prompt, imgs),
              );
            } else {
              void sendMessage(prompt, imgs);
            }
          }}
          shortcuts={shortcuts}
          isStreaming={isStreaming}
          onCancel={abortExecution}
        />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="agent-view" role="main" aria-label="AI Vault Agent">
        {availabilityBanner}
        <AgentWelcomeView
          userName={vaultName}
          onSend={(prompt) => void sendMessage(prompt)}
          shortcuts={shortcuts}
          isStreaming={isStreaming}
          onCancel={abortExecution}
        />
      </div>
    );
  }

  const chatTitle = activeConversation?.title || "New Chat";

  return (
    <div className="agent-view-active-wrap" style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", overflow: "hidden" }}>
      {availabilityBanner}
      <AgentActiveChat
        chatTitle={chatTitle}
        activeProject={activeProject}
        onNavigateProject={(pId) => selectProject(pId)}
        onRename={() => {
          if (!activeConversationId) return;
          const next = window.prompt("Rename conversation:", chatTitle);
          if (next?.trim())
            void renameConversation(activeConversationId, next.trim());
        }}
        onDelete={() => {
          if (!activeConversationId) return;
          if (window.confirm(`Delete conversation "${chatTitle}"?`))
            void deleteConversation(activeConversationId);
        }}
        messages={messages}
        isStreaming={isStreaming}
        stagedChanges={stagedChanges}
        onAcceptChange={handleApplyChange}
        onRejectChange={handleRejectChange}
        onAcceptAllChanges={handleApplyAllChanges}
        chatInput={chatInput}
        onChangeChatInput={setChatInput}
        onSendChat={(text, imgs) => {
          if (text.trim() || (imgs && imgs.length > 0)) {
            void sendMessage(text, imgs);
            setChatInput("");
          }
        }}
        shortcuts={shortcuts}
        onCancel={abortExecution}
      />
    </div>
  );
}
