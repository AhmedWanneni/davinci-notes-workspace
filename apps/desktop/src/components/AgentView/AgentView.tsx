import { useEffect, useRef, useState } from "react";
import { AgentWelcomeView } from "./AgentWelcomeView";
import { AgentProjectView } from "./AgentProjectView";
import { AgentActiveChat } from "./AgentActiveChat";
import { AgentLibraryBoard, AgentLibraryErrorBoundary } from "./Library";
import { useAgentExecution } from "./useAgentExecution";
import { useAgentConversations } from "./useAgentConversations";
import { useAgentViewConfig } from "./useAgentViewConfig";
import { useAgentStore } from "./useAgentStore";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import type { AIProviderId } from "../../ai/AISubsystem";
import type { ChatMessageItem } from "./agentTypes";
import "./AgentView.scss";

export interface AgentViewProps {
  onOpenSettings?: () => void;
}

export function AgentView({
  onOpenSettings: _onOpenSettings,
}: AgentViewProps = {}) {
  const { webSearchEnabled, autoApply, rewriteEnabled, shortcuts } =
    useAgentViewConfig();

  const vaultPath = useWorkspaceStore((state) => state.vaultPath);
  const vaultName = vaultPath
    ? vaultPath.split(/[/\\]/).pop() || "Ahmed"
    : "Ahmed";

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
    createNewConversation,
    saveActiveMessages,
  } = useAgentConversations();

  const currentProjectId =
    activeProjectId || activeConversation?.projectId || null;
  const activeProject = projects.find((p) => p.id === currentProjectId);

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
    projectSources: activeProject?.sources,
    projectInstructions:
      activeProject?.instructions ??
      (currentProjectId ? projectInstructions[currentProjectId] : undefined),
    projectName: activeProject?.name,
  });

  const [chatInput, setChatInput] = useState("");
  const lastLoadedConvIdRef = useRef<string | null>(null);
  const lastSavedKeyRef = useRef<string>("");

  useEffect(() => {
    if (pendingPromptText) {
      setChatInput((prev) =>
        prev ? `${prev}\n\n${pendingPromptText}` : pendingPromptText,
      );
      setPendingPromptText(null);
    }
  }, [pendingPromptText, setPendingPromptText]);

  useEffect(() => {
    if (
      activeConversationId &&
      activeConversation &&
      activeConversation.id !== lastLoadedConvIdRef.current
    ) {
      lastLoadedConvIdRef.current = activeConversation.id;
      setMessages(activeConversation.messages as ChatMessageItem[]);
    } else if (!activeConversationId) {
      lastLoadedConvIdRef.current = null;
      setMessages([]);
    }
  }, [activeConversationId, activeConversation, setMessages]);

  useEffect(() => {
    if (!activeConversationId || messages.length === 0 || isStreaming) return;
    const lastMsg = messages[messages.length - 1];
    const key = `${activeConversationId}:${messages.length}:${lastMsg?.id || ""}:${lastMsg?.content?.length || 0}`;
    if (key === lastSavedKeyRef.current) return;
    lastSavedKeyRef.current = key;
    void saveActiveMessages(messages);
  }, [activeConversationId, messages, isStreaming, saveActiveMessages]);

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

  if (currentProjectId && (!activeConversationId || messages.length === 0)) {
    return (
      <div className="agent-view" role="main" aria-label="AI Vault Agent">
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
        />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="agent-view" role="main" aria-label="AI Vault Agent">
        <AgentWelcomeView
          userName={vaultName}
          onSend={(prompt) => void sendMessage(prompt)}
          shortcuts={shortcuts}
          isStreaming={isStreaming}
        />
      </div>
    );
  }

  const chatTitle =
    activeProject?.name || activeConversation?.title || "Search";

  return (
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
  );
}
