import { useState, useEffect, useRef } from "react";

export function useWordByWordStream(
  rawText: string,
  isStreaming?: boolean,
  onComplete?: () => void,
): string {
  const [displayedText, setDisplayedText] = useState(rawText);
  const wordsRef = useRef<string[]>([]);
  const indexRef = useRef(0);
  const completionRef = useRef(onComplete);
  completionRef.current = onComplete;

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
        if (indexRef.current >= wordsRef.current.length)
          completionRef.current?.();
      }
    }, 25);

    if (words.length === 0) completionRef.current?.();

    return () => clearInterval(timer);
  }, [rawText, isStreaming]);

  return isStreaming ? displayedText : rawText;
}
