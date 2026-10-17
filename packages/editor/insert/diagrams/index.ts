import type { InsertItem } from "../InsertItem";
import { dataAndChartsDiagrams } from "./dataAndCharts";
import { flowAndStructureDiagrams } from "./flowAndStructure";
import { frameworksDiagrams } from "./frameworks";
import { timeAndPlanningDiagrams } from "./timeAndPlanning";

export { flowAndStructureDiagrams } from "./flowAndStructure";
export { timeAndPlanningDiagrams } from "./timeAndPlanning";
export { dataAndChartsDiagrams } from "./dataAndCharts";
export { frameworksDiagrams } from "./frameworks";
export { resolveSnippetPlaceholders } from "./types";

export const diagramItems: readonly InsertItem[] = [
  ...flowAndStructureDiagrams,
  ...timeAndPlanningDiagrams,
  ...dataAndChartsDiagrams,
  ...frameworksDiagrams,
];
