import { useEffect, useState } from "react";
import { Button, Typography } from "@app/design-system";
import { lineDiff, type DiffLine } from "../../git/lineDiff";
import {
  listLocalGitVersions,
  readLocalGitVersion,
  restoreLocalGitVersion,
  type LocalGitVersion,
} from "../../git/localGitHistory";

export interface VersionHistoryPanelProps {
  activePath: string | null;
  onRestored: (content: string) => void;
}

export function VersionHistoryPanel({
  activePath,
  onRestored,
}: VersionHistoryPanelProps) {
  const [versions, setVersions] = useState<LocalGitVersion[]>([]);
  const [selected, setSelected] = useState<LocalGitVersion | null>(null);
  const [selectedContent, setSelectedContent] = useState("");
  const [diff, setDiff] = useState<DiffLine[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelected(null);
    setSelectedContent("");
    setDiff([]);
    setError(null);

    if (!activePath?.endsWith(".md")) {
      setVersions([]);
      return;
    }

    void listLocalGitVersions(activePath)
      .then(setVersions)
      .catch(() => setError("Could not load local version history."));
  }, [activePath]);

  const selectVersion = async (version: LocalGitVersion) => {
    if (!activePath) return;

    const prior = versions[versions.indexOf(version) + 1];
    try {
      const [current, previous] = await Promise.all([
        readLocalGitVersion(activePath, version.revision),
        prior
          ? readLocalGitVersion(activePath, prior.revision)
          : Promise.resolve(""),
      ]);
      setSelected(version);
      setSelectedContent(current);
      setDiff(lineDiff(previous, current));
      setError(null);
    } catch {
      setError("Could not load this local version.");
    }
  };

  const restoreVersion = async () => {
    if (!activePath || !selected) return;

    try {
      await restoreLocalGitVersion(activePath, selected.revision);
      onRestored(selectedContent);
      setError(null);
    } catch {
      setError("Could not restore this local version.");
    }
  };

  if (!activePath?.endsWith(".md")) {
    return (
      <Typography variant="text" size="xs" color="muted">
        Version history is available for Markdown notes.
      </Typography>
    );
  }

  return (
    <div className="version-history">
      <div className="version-history__list">
        {versions.length ? (
          versions.map((version) => (
            <button
              type="button"
              className="version-history__item"
              key={version.revision}
              onClick={() => void selectVersion(version)}
            >
              <Typography variant="text" size="xs" weight="semibold">
                {version.message}
              </Typography>
              <Typography variant="text" size="xs" color="muted">
                {new Date(version.timestamp * 1000).toLocaleString()}
              </Typography>
            </button>
          ))
        ) : (
          <Typography variant="text" size="xs" color="muted">
            No saved versions yet.
          </Typography>
        )}
      </div>
      {error && (
        <Typography variant="text" size="xs" color="muted">
          {error}
        </Typography>
      )}
      {selected && (
        <>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => void restoreVersion()}
          >
            Restore this version
          </Button>
          <pre className="version-history__diff">
            {diff.map((line, index) => (
              <span key={`${line.kind}-${index}`} data-kind={line.kind}>
                {line.kind === "added"
                  ? "+ "
                  : line.kind === "removed"
                    ? "− "
                    : "  "}
                {line.text}
                {"\n"}
              </span>
            ))}
          </pre>
        </>
      )}
    </div>
  );
}
