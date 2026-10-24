import React from "react";
import { View } from "react-native";
import { Button, Sheet, Text } from "../components/primitives";
import { NoteActionSheet } from "../components/shell";
import { OutlineSheet } from "./OutlineSheet";
import { BacklinksSheet } from "./BacklinksSheet";
import { LocalGraphView } from "../graph";
import type { OutlineHeading } from "./markdownAst";
import type { MentionItem } from "./backlinksQuery";

export interface NoteAuxiliarySheetsProps {
  sheetOpen: boolean;
  onCloseSheet: () => void;
  onToggleReadingView: () => void;
  outlineOpen: boolean;
  onCloseOutline: () => void;
  outline: OutlineHeading[];
  onSelectHeading: (h: OutlineHeading) => void;
  backlinksOpen: boolean;
  onCloseBacklinks: () => void;
  linked: MentionItem[];
  unlinked: MentionItem[];
  loadingMentions: boolean;
  onSelectBacklinkNote: (note: string) => void;
  graphOpen: boolean;
  onCloseGraph: () => void;
  activePath: string;
  onNavigateGraph: (path: string) => void;
  unresolvedTarget: string | null;
  onCloseUnresolved: () => void;
  onCreateUnresolvedNote: () => Promise<void>;
  onOpenOutline: () => void;
  onOpenBacklinks: () => void;
  onOpenGraph: () => void;
}

export function NoteAuxiliarySheets({
  sheetOpen,
  onCloseSheet,
  onToggleReadingView,
  outlineOpen,
  onCloseOutline,
  outline,
  onSelectHeading,
  backlinksOpen,
  onCloseBacklinks,
  linked,
  unlinked,
  loadingMentions,
  onSelectBacklinkNote,
  graphOpen,
  onCloseGraph,
  activePath,
  onNavigateGraph,
  unresolvedTarget,
  onCloseUnresolved,
  onCreateUnresolvedNote,
  onOpenOutline,
  onOpenBacklinks,
  onOpenGraph,
}: NoteAuxiliarySheetsProps): React.ReactElement {
  return (
    <>
      <NoteActionSheet
        visible={sheetOpen}
        onClose={onCloseSheet}
        isReadingView={true}
        onToggleReadingView={onToggleReadingView}
        onToggleSourceMode={onToggleReadingView}
        onOpenOutline={onOpenOutline}
        onOpenBacklinks={onOpenBacklinks}
        onOpenGraph={onOpenGraph}
        onRename={onToggleReadingView}
      />

      <OutlineSheet
        visible={outlineOpen}
        onClose={onCloseOutline}
        outline={outline}
        onSelectHeading={onSelectHeading}
      />

      <BacklinksSheet
        visible={backlinksOpen}
        onClose={onCloseBacklinks}
        linked={linked}
        unlinked={unlinked}
        loading={loadingMentions}
        onSelectNote={onSelectBacklinkNote}
      />

      <Sheet visible={graphOpen} onClose={onCloseGraph} title="Local Graph">
        <LocalGraphView
          notePath={activePath}
          onNavigate={(targetPath) => onNavigateGraph(targetPath)}
        />
      </Sheet>

      <Sheet
        visible={unresolvedTarget !== null}
        onClose={onCloseUnresolved}
        title="Unresolved Note"
      >
        <Text variant="body" color="normal" className="mb-4">
          The note "{unresolvedTarget}" does not exist yet. Would you like to
          create it?
        </Text>
        <View className="flex-row gap-3 justify-end">
          <Button variant="secondary" onPress={onCloseUnresolved}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onPress={() => void onCreateUnresolvedNote()}
          >
            Create Note
          </Button>
        </View>
      </Sheet>
    </>
  );
}
