const { withAndroidManifest, withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const NETWORK_SECURITY_CONFIG_XML = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">127.0.0.1</domain>
    </domain-config>
</network-security-config>
`;

/**
 * Expo config plugin to write narrow network_security_config.xml allowing
 * cleartext HTTP strictly on localhost / 127.0.0.1.
 */
function withLocalhostNetworkSecurityXml(config) {
  return withDangerousMod(config, [
    "android",
    async (modConfig) => {
      const resXmlDir = path.join(
        modConfig.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "res",
        "xml"
      );
      await fs.promises.mkdir(resXmlDir, { recursive: true });
      const filePath = path.join(resXmlDir, "network_security_config.xml");
      await fs.promises.writeFile(filePath, NETWORK_SECURITY_CONFIG_XML, "utf8");
      return modConfig;
    },
  ]);
}

/**
 * Injects android:networkSecurityConfig="@xml/network_security_config" into AndroidManifest.xml.
 */
function withLocalhostManifestConfig(config) {
  return withAndroidManifest(config, async (modConfig) => {
    const mainApplication = modConfig.modResults.manifest.application?.[0];
    if (mainApplication) {
      mainApplication.$["android:networkSecurityConfig"] =
        "@xml/network_security_config";
    }
    return modConfig;
  });
}

function withLocalhostNetworkSecurity(config) {
  return withLocalhostManifestConfig(withLocalhostNetworkSecurityXml(config));
}

module.exports = withLocalhostNetworkSecurity;
