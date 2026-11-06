const AGENT_ARTIFACT_PATTERNS = [
  /^walkthrough.*\.md$/i,
  /^implementation_plan.*\.md$/i,
  /^plan.*\.md$/i,
  /^scratch/i,
  /\.tmp$/i,
  /\.bak$/i,
  /\.old$/i,
  /\.orig$/i,
  /\.log$/i,
  /^readme\.md$/i,
];

export function isIgnoredAgentArtifact(
  filePath: string,
  promptText?: string,
): boolean {
  const baseName = filePath.split(/[/\\]/).pop() || filePath;
  // If the user explicitly mentioned this file name in their prompt, preserve it
  if (promptText && promptText.toLowerCase().includes(baseName.toLowerCase())) {
    return false;
  }
  return AGENT_ARTIFACT_PATTERNS.some((pattern) => pattern.test(baseName));
}
