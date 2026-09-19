import { useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

export function useWindowFullscreen() {
  useEffect(() => {
    let isMounted = true;

    const syncFullscreenAttribute = async () => {
      const isFullscreen = await getCurrentWindow()
        .isFullscreen()
        .catch(() => false);
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
