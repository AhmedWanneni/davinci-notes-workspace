import type { DatabaseColumn, DatabaseRow } from "./databaseTypes";

export function filterAndSortRows(
  rows: DatabaseRow[],
  columns: DatabaseColumn[],
  searchQuery: string,
  filterCol: string | null,
  filterVal: string,
  sortCol: string | null,
  sortOrder: "asc" | "desc",
): DatabaseRow[] {
  let result = [...rows];

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    result = result.filter((row) =>
      row.cells.some((c) => c.toLowerCase().includes(q)),
    );
  }

  if (filterCol && filterVal.trim()) {
    const colIdx = columns.findIndex((c) => c.name === filterCol);
    if (colIdx !== -1) {
      const q = filterVal.toLowerCase();
      result = result.filter((row) =>
        (row.cells[colIdx] || "").toLowerCase().includes(q),
      );
    }
  }

  if (sortCol) {
    const colIdx = columns.findIndex((c) => c.name === sortCol);
    if (colIdx !== -1) {
      const col = columns[colIdx];
      const isNum = col?.type === "number";
      result.sort((a, b) => {
        const valA = a.cells[colIdx] || "";
        const valB = b.cells[colIdx] || "";
        if (isNum) {
          const numA = parseFloat(valA) || 0;
          const numB = parseFloat(valB) || 0;
          return sortOrder === "asc" ? numA - numB : numB - numA;
        }
        const cmp = valA.localeCompare(valB);
        return sortOrder === "asc" ? cmp : -cmp;
      });
    }
  }

  return result;
}
