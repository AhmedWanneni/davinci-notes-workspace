import { useEffect } from "react";
import {
  getPlatformAdapters,
  hasPlatformAdapters,
} from "@app/platform-adapters";

export function useWindowFullscreen() {
  useEffect(() => {
    let isMounted = true;

    const syncFullscreenAttribute = async () => {
      let isFullscreen = false;
      if (hasPlatformAdapters()) {
        isFullscreen = await getPlatformAdapters()
          .windowControls.isFullscreen()
          .catch(() => false);
      } else if (typeof document !== "undefined") {
        isFullscreen = Boolean(document.fullscreenElement);
      }

      if (isMounted) {
        document.documentElement.toggleAttribute(
          "data-fullscreen",
          isFullscreen,
        );
      }
    };

    const handleResize = () => void syncFullscreenAttribute();

    void syncFullscreenAttribute();
    window.addEventListener("resize", handleResize);

    return () => {
      isMounted = false;
      window.removeEventListener("resize", handleResize);
      document.documentElement.removeAttribute("data-fullscreen");
    };
  }, []);
}
