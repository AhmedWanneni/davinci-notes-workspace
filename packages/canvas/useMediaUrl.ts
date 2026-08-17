import { useEffect, useState } from "react";

export function useMediaUrl(
  filePath: string,
  resolveMediaUrl?: (path: string) => string | Promise<string>,
): { src: string | null; isLoading: boolean } {
  const [src, setSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!filePath) {
      setSrc(null);
      setIsLoading(false);
      return;
    }

    if (!resolveMediaUrl) {
      setSrc(filePath);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    try {
      const result = resolveMediaUrl(filePath);
      if (typeof result === "string") {
        setSrc(result);
        setIsLoading(false);
      } else {
        Promise.resolve(result)
          .then((resolvedUrl) => {
            if (isMounted) {
              setSrc(resolvedUrl);
              setIsLoading(false);
            }
          })
          .catch(() => {
            if (isMounted) {
              setSrc(filePath);
              setIsLoading(false);
            }
          });
      }
    } catch {
      setSrc(filePath);
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [filePath, resolveMediaUrl]);

  return { src, isLoading };
}
