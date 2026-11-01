import { useState, useEffect, useRef } from "react";

export function useWordByWordStream(
  rawText: string,
  isStreaming?: boolean,
): string {
  const [displayedText, setDisplayedText] = useState(rawText);
  const wordsRef = useRef<string[]>([]);
  const indexRef = useRef(0);

  useEffect(() => {
    if (!isStreaming) {
      setDisplayedText(rawText);
      indexRef.current = 0;
      return;
    }

    const words = rawText.split(/(\s+)/);
    wordsRef.current = words;

    const timer = setInterval(() => {
      if (indexRef.current < wordsRef.current.length) {
        indexRef.current = Math.min(
          indexRef.current + 2,
          wordsRef.current.length,
        );
        setDisplayedText(wordsRef.current.slice(0, indexRef.current).join(""));
      }
    }, 25);

    return () => clearInterval(timer);
  }, [rawText, isStreaming]);

  return isStreaming ? displayedText : rawText;
}
