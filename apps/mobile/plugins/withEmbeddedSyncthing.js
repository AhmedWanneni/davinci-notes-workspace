const {
  withAndroidManifest,
  withAppBuildGradle,
  withGradleProperties,
} = require("expo/config-plugins");

const REQUIRED_PERMISSIONS = [
  "android.permission.FOREGROUND_SERVICE",
  "android.permission.FOREGROUND_SERVICE_DATA_SYNC",
  "android.permission.POST_NOTIFICATIONS",
  "android.permission.WAKE_LOCK",
  "android.permission.RECEIVE_BOOT_COMPLETED",
  "android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS",
];

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
        (s) => s.$["android:name"] === "com.davinci.syncthing.SyncthingForegroundService"
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
        (r) => r.$["android:name"] === "com.davinci.syncthing.SyncthingBootReceiver"
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

function withSyncthingBuildGradle(config) {
  return withAppBuildGradle(config, (modConfig) => {
    let contents = modConfig.modResults.contents;
    if (!contents.includes("jniLibs.srcDirs")) {
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

function withSyncthingGradleProperties(config) {
  return withGradleProperties(config, (modConfig) => {
    const item = modConfig.modResults.find(
      (prop) => prop.type === "property" && prop.key === "expo.useLegacyPackaging"
    );
    if (item) {
      item.value = "true";
    } else {
      modConfig.modResults.push({
        type: "property",
        key: "expo.useLegacyPackaging",
        value: "true",
      });
    }
    return modConfig;
  });
}

module.exports = function withEmbeddedSyncthing(config) {
  return withSyncthingGradleProperties(
    withSyncthingBuildGradle(withSyncthingPermissions(config))
  );
};
