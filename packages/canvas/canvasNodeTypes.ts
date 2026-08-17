import type { NodeTypes } from "@xyflow/react";
import { FileCardNode } from "./FileCardNode";
import { GroupCardNode } from "./GroupCardNode";
import { LinkCardNode } from "./LinkCardNode";
import { TextCardNode } from "./TextCardNode";

export const canvasNodeTypes: NodeTypes = {
  text: TextCardNode,
  file: FileCardNode,
  link: LinkCardNode,
  group: GroupCardNode,
};

