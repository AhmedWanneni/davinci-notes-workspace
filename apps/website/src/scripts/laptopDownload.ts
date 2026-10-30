/**
 * laptopDownload.ts — Client-side operating system & laptop architecture detection
 * Automatically tailors primary download links to macOS (.dmg), Windows (.exe), or Linux (.AppImage).
 */

export interface DownloadCatalog {
  macArm: string;
  macIntel: string;
  windows: string;
  linuxAppImage: string;
  linuxDeb: string;
  downloadPage: string;
}

export const DOWNLOAD_LINKS: DownloadCatalog = {
  macArm:
    "https://github.com/AhmedWanneni/davinci-notes-workspace/releases/latest/download/Sophia_0.3.0_aarch64.dmg",
  macIntel:
    "https://github.com/AhmedWanneni/davinci-notes-workspace/releases/latest/download/Sophia_0.3.0_x64.dmg",
  windows:
    "https://github.com/AhmedWanneni/davinci-notes-workspace/releases/latest/download/Sophia_0.3.0_x64-setup.exe",
  linuxAppImage:
    "https://github.com/AhmedWanneni/davinci-notes-workspace/releases/latest/download/sophia_0.3.0_amd64.AppImage",
  linuxDeb:
    "https://github.com/AhmedWanneni/davinci-notes-workspace/releases/latest/download/sophia_0.3.0_amd64.deb",
  downloadPage: "/download",
};

export type LaptopOs =
  "mac-arm" | "mac-intel" | "windows" | "linux" | "mobile" | "unknown";

export interface LaptopProfile {
  os: LaptopOs;
  btnLabel: string;
  detectLabel: string;
  primaryUrl: string;
  altLinks: Array<{ label: string; url: string }>;
}

export function detectLaptop(): LaptopProfile {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      os: "mac-arm",
      btnLabel: "↓ DOWNLOAD FOR MAC (.DMG)",
      detectLabel: "macOS 11+ (Apple Silicon)",
      primaryUrl: DOWNLOAD_LINKS.macArm,
      altLinks: [
        { label: "Intel .dmg", url: DOWNLOAD_LINKS.macIntel },
        { label: "Windows .exe", url: DOWNLOAD_LINKS.windows },
        { label: "Linux .AppImage", url: DOWNLOAD_LINKS.linuxAppImage },
      ],
    };
  }

  const nav = navigator as Navigator & {
    userAgentData?: {
      platform?: string;
      getHighEntropyValues?: (
        hints: string[],
      ) => Promise<{ architecture?: string }>;
    };
  };
  const ua = (nav.userAgent || "").toLowerCase();
  const platform = (
    nav.userAgentData?.platform ||
    nav.platform ||
    ""
  ).toLowerCase();

  // 1. Mobile Check
  if (/iphone|ipad|ipod|android|mobile/i.test(ua)) {
    return {
      os: "mobile",
      btnLabel: "↓ GET FOR DESKTOP & MOBILE",
      detectLabel: "Mobile Device Detected",
      primaryUrl: DOWNLOAD_LINKS.downloadPage,
      altLinks: [
        { label: "Mac (.dmg)", url: DOWNLOAD_LINKS.macArm },
        { label: "Windows (.exe)", url: DOWNLOAD_LINKS.windows },
        { label: "Linux (.AppImage)", url: DOWNLOAD_LINKS.linuxAppImage },
      ],
    };
  }

  // 2. Windows Check
  if (/win/i.test(platform) || /windows/i.test(ua)) {
    return {
      os: "windows",
      btnLabel: "↓ DOWNLOAD FOR WINDOWS (.EXE)",
      detectLabel: "Detected Windows (64-bit)",
      primaryUrl: DOWNLOAD_LINKS.windows,
      altLinks: [
        { label: "Mac Apple Silicon", url: DOWNLOAD_LINKS.macArm },
        { label: "Mac Intel", url: DOWNLOAD_LINKS.macIntel },
        { label: "Linux (.AppImage)", url: DOWNLOAD_LINKS.linuxAppImage },
        { label: "All Downloads ↗", url: DOWNLOAD_LINKS.downloadPage },
      ],
    };
  }

  // 3. Linux Check
  if (/linux/i.test(platform) || /linux|x11/i.test(ua)) {
    return {
      os: "linux",
      btnLabel: "↓ DOWNLOAD FOR LINUX (.APPIMAGE)",
      detectLabel: "Detected Linux (64-bit)",
      primaryUrl: DOWNLOAD_LINKS.linuxAppImage,
      altLinks: [
        { label: "Debian/Ubuntu (.deb)", url: DOWNLOAD_LINKS.linuxDeb },
        { label: "Mac (.dmg)", url: DOWNLOAD_LINKS.macArm },
        { label: "Windows (.exe)", url: DOWNLOAD_LINKS.windows },
        { label: "All Downloads ↗", url: DOWNLOAD_LINKS.downloadPage },
      ],
    };
  }

  // 4. macOS Check (Default for desktop Mac)
  return {
    os: "mac-arm",
    btnLabel: "↓ DOWNLOAD FOR MAC (.DMG)",
    detectLabel: "Detected macOS (Apple Silicon & Intel)",
    primaryUrl: DOWNLOAD_LINKS.macArm,
    altLinks: [
      { label: "Intel .dmg", url: DOWNLOAD_LINKS.macIntel },
      { label: "Windows .exe", url: DOWNLOAD_LINKS.windows },
      { label: "Linux .AppImage", url: DOWNLOAD_LINKS.linuxAppImage },
      { label: "All Downloads ↗", url: DOWNLOAD_LINKS.downloadPage },
    ],
  };
}

export function applyLaptopDownload(): void {
  if (typeof document === "undefined") return;
  const profile = detectLaptop();

  // Update all download buttons marked with [data-laptop-download-btn]
  document
    .querySelectorAll<HTMLAnchorElement>("[data-laptop-download-btn]")
    .forEach((btn) => {
      btn.href = profile.primaryUrl;
      btn.setAttribute("title", `Direct download for ${profile.detectLabel}`);
      const textSpan = btn.querySelector(".cta-btn-text, span:not(.btn-arrow)");
      if (textSpan) {
        textSpan.textContent = profile.btnLabel;
      }
    });

  // Update platform summary strips marked with [data-laptop-platforms]
  document
    .querySelectorAll<HTMLElement>("[data-laptop-platforms]")
    .forEach((container) => {
      const isHero = container.classList.contains("cta-sheet-platforms");
      const linksHtml = profile.altLinks
        .map(
          (link) =>
            `<a href="${link.url}" class="platform-quick-link">${link.label}</a>`,
        )
        .join(" · ");

      if (isHero) {
        container.innerHTML = `<span>${profile.detectLabel}</span><br /><span class="platform-alt-row">Also for: ${linksHtml}</span>`;
      } else {
        container.innerHTML = `<span class="platform-detected-tag">${profile.detectLabel}</span> · ${linksHtml}`;
      }
    });
}

// Auto-run on DOM ready
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyLaptopDownload);
  } else {
    applyLaptopDownload();
  }
}
