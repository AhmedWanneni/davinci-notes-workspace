import type { WebBookmarkItem } from "../../bookmarks/bookmarkTypes";

export function exportBookmarksToHtml(
  items: readonly WebBookmarkItem[],
  collectionName = "Web Bookmarks",
): void {
  const dateNow = Math.floor(Date.now() / 1000);
  const linksHtml = items
    .map(
      (item) =>
        `    <DT><A HREF="${item.url}" ADD_DATE="${Math.floor(item.addedAt / 1000)}"${
          item.tags && item.tags.length > 0
            ? ` TAGS="${item.tags.join(",")}"`
            : ""
        }>${item.title.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</A>${
          item.description ? `\n    <DD>${item.description}` : ""
        }`,
    )
    .join("\n");

  const html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file. -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="${dateNow}">${collectionName}</H3>
    <DL><p>
${linksHtml}
    </DL><p>
</DL><p>
`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bookmarks_${new Date().toISOString().slice(0, 10)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
