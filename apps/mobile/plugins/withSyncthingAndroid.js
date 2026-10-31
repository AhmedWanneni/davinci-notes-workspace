const fs = require("node:fs");
const path = require("node:path");
const {
  withAndroidManifest,
  withAppBuildGradle,
  withGradleProperties,
  withDangerousMod,
} = require("expo/config-plugins");

const REQUIRED_PERMISSIONS = [
  "android.permission.FOREGROUND_SERVICE",
  "android.permission.FOREGROUND_SERVICE_DATA_SYNC",
  "android.permission.POST_NOTIFICATIONS",
  "android.permission.WAKE_LOCK",
  "android.permission.RECEIVE_BOOT_COMPLETED",
  "android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS",
  "android.permission.INTERNET",
];

const SUPPORTED_ABIS = ["arm64-v8a", "x86_64"];

function withSyncthingJniLibs(config) {
  return withDangerousMod(config, [
    "android",
    async (modConfig) => {
      const projectRoot = modConfig.modRequest.projectRoot;
      const androidRoot = modConfig.modRequest.platformProjectRoot;
      const assetsDir = path.join(projectRoot, "assets", "syncthing");
      const appJniDir = path.join(androidRoot, "app", "src", "main", "jniLibs");

      for (const abi of SUPPORTED_ABIS) {
        let srcSo = path.join(assetsDir, abi, "libsyncthing.so");
        if (!fs.existsSync(srcSo)) {
          srcSo = path.join(projectRoot, "modules", "expo-syncthing", "android", "src", "main", "jniLibs", abi, "libsyncthing.so");
        }
        const dstDir = path.join(appJniDir, abi);
        const dstSo = path.join(dstDir, "libsyncthing.so");

        if (fs.existsSync(srcSo)) {
          fs.mkdirSync(dstDir, { recursive: true });
          fs.copyFileSync(srcSo, dstSo);
          fs.chmodSync(dstSo, 0o755);
        }
      }
      return modConfig;
    },
  ]);
}

function withSyncthingPermissions(config) {
  return withAndroidManifest(config, (modConfig) => {
    const manifest = modConfig.modResults.manifest;
    if (!manifest["uses-permission"]) {
      manifest["uses-permission"] = [];
    }

    REQUIRED_PERMISSIONS.forEach((perm) => {
      const exists = manifest["uses-permission"].some(
        (p) => p.$["android:name"] === perm
      );
      if (!exists) {
        manifest["uses-permission"].push({
          $: { "android:name": perm },
        });
      }
    });

    const app = manifest.application?.[0];
    if (app) {
      app.$["android:extractNativeLibs"] = "true";

      if (!app.service) app.service = [];
      const serviceExists = app.service.some(
        (s) =>
          s.$["android:name"] ===
          "com.davinci.syncthing.SyncthingForegroundService"
      );
      if (!serviceExists) {
        app.service.push({
          $: {
            "android:name": "com.davinci.syncthing.SyncthingForegroundService",
            "android:foregroundServiceType": "dataSync",
            "android:exported": "false",
          },
        });
      }

      if (!app.receiver) app.receiver = [];
      const receiverExists = app.receiver.some(
        (r) =>
          r.$["android:name"] === "com.davinci.syncthing.SyncthingBootReceiver"
      );
      if (!receiverExists) {
        app.receiver.push({
          $: {
            "android:name": "com.davinci.syncthing.SyncthingBootReceiver",
            "android:exported": "false",
          },
          "intent-filter": [
            {
              action: [
                {
                  $: {
                    "android:name": "android.intent.action.BOOT_COMPLETED",
                  },
                },
              ],
            },
          ],
        });
      }
    }

    return modConfig;
  });
}

function withSyncthingGradleProperties(config) {
  return withGradleProperties(config, (modConfig) => {
    const setProp = (key, value) => {
      const item = modConfig.modResults.find(
        (prop) => prop.type === "property" && prop.key === key
      );
      if (item) {
        item.value = value;
      } else {
        modConfig.modResults.push({
          type: "property",
          key,
          value,
        });
      }
    };

    setProp("expo.useLegacyPackaging", "true");
    setProp("reactNativeArchitectures", "arm64-v8a,x86_64");
    return modConfig;
  });
}

function withSyncthingBuildGradle(config) {
  return withAppBuildGradle(config, (modConfig) => {
    let contents = modConfig.modResults.contents;
    if (!contents.includes("jniLibs.srcDirs") && !contents.includes("useLegacyPackaging true")) {
      contents = contents.replace(
        /android\s*\{/,
        `android {
    packagingOptions {
        jniLibs {
            useLegacyPackaging true
        }
    }`
      );
    }
    modConfig.modResults.contents = contents;
    return modConfig;
  });
}

module.exports = function withSyncthingAndroid(config) {
  return withSyncthingJniLibs(
    withSyncthingGradleProperties(
      withSyncthingBuildGradle(withSyncthingPermissions(config))
    )
  );
};
