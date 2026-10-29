# ADR-0246: Static Website Download Architecture, Inline OS Detection, and Permalinks

## Context

Users downloading DaVinci Notes / Sophia need clear, immediate access to the installer corresponding to their operating system (macOS Apple Silicon, macOS Intel, Windows x64, Linux AppImage/deb).

Project constraints require:
1. Keeping the existing website navigation header (`SiteNav.astro`) completely untouched.
2. Near-zero JavaScript weight on the marketing website.
3. Resilience against GitHub API rate limits during client visits.
4. Stable, permanent download URLs for scripts and direct linking.

## Decision

1. **Static Pre-Rendering via Astro (`output: 'static'`)**:
   - Pre-render `/download` statically at site build time.
   - Fetch latest release metadata from the public GitHub Releases API during Astro static build (`fetch('https://api.github.com/repos/.../releases/latest')`) with a safe fallback to published default asset URLs.
   - Zero runtime client-side GitHub API requests; immune to client rate limiting.
2. **Zero-Dependency Inline OS Detection (< 1.5 KB JS)**:
   - Use an inline script analyzing `navigator.userAgentData?.platform` and `navigator.userAgent`.
   - Automatically configure the primary CTA button and subtext to the user's detected operating system without any external client library or framework.
   - Pure HTML fallback: All platform download links remain visible, structured, and clickable in the platforms grid even if JavaScript is disabled.
3. **Stable Permalinks via Static Redirects**:
   - Provide permanent static redirect routes:
     - `/download/mac` (Apple Silicon DMG)
     - `/download/mac-intel` (Intel DMG)
     - `/download/windows` (Windows x64 installer)
     - `/download/linux` (Linux AppImage)
4. **Header Invariance**:
   - Mount `SiteNav.astro` directly with zero modifications, ensuring complete design continuity across the landing page and download experience.

## Consequences

- Ultra-fast, CDN-cached download page with instant render times.
- Zero client-side API rate limit failures.
- Full accessibility across all modern desktop browsers with and without JavaScript.
