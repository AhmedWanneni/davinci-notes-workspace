export interface KanbanCard {
  id: string;
  title: string;
  body: string;
  completed: boolean;
  indent: string;
  rawLines: string[];
  preCardLines: string[];
}

export interface KanbanLane {
  id: string;
  title: string;
  color?: string;
  headingLine: string;
  preLines: string[];
  cards: KanbanCard[];
  postLines: string[];
}

export interface KanbanBoard {
  preambleLines: string[];
  lanes: KanbanLane[];
  epilogueLines: string[];
  lineEnding: "\n" | "\r\n";
  hasTrailingNewline: boolean;
  rawText: string;
  isModified?: boolean;
}
