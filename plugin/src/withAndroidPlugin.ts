import {
  ConfigPlugin,
  withAndroidManifest,
  withAppBuildGradle,
  withMainApplication,
  withProjectBuildGradle,
  withDangerousMod,
  withMainActivity,
} from "@expo/config-plugins";

import type { ConfigPluginProps } from "./types";
import * as fs from "fs-extra";
import * as path from "path";

export const RN_APP_ID_META = "com.vibes.push.rn.plugin.appId";
export const RN_API_URL_META = "com.vibes.push.rn.plugin.apiUrl";
export const RN_PUSH_RECEIVER =
  "com.vibes.push.rn.plugin.notifications.VibesPushReceiver";
export const RN_FMS = "com.vibes.push.rn.plugin.notifications.Fms";
const LEGACY_EXPO_FMS = "expo.modules.vibessdk.Fms";
const LEGACY_EXPO_PUSH_RECEIVER = "expo.modules.vibessdk.VibesPushReceiver";

/** Wire MainActivity to RN VibesPushReceiver.handlePushOpened (cold/background tap). */
export function wireMainActivityPushOpened(contents: string): string {
  contents = contents.replace(
    /import expo\.modules\.vibessdk\.VibesPushReceiver/g,
    `import ${RN_PUSH_RECEIVER}`,
  );

  if (contents.includes("VibesPushReceiver.handlePushOpened")) {
    return contents;
  }

  if (!contents.includes(`import ${RN_PUSH_RECEIVER}`)) {
    contents = contents.replace(
      /import expo\.modules\.ReactActivityDelegateWrapper/,
      `import expo.modules.ReactActivityDelegateWrapper\nimport ${RN_PUSH_RECEIVER}`,
    );
  }

  return contents.replace(
    /super\.onCreate\(null\)/,
    `super.onCreate(null)\n    VibesPushReceiver.handlePushOpened(applicationContext, intent)`,
  );
}

// Add manifest placeholders to build.gradle (RN sample uses vibesApiUrl)
const addPlaceholders = (
  buildGradle: string,
  appId: string,
  appUrl?: string,
): string => {
  const androidBlockRegex = /android\s*\{/;
  const androidBlockMatch = buildGradle.match(androidBlockRegex);

  if (androidBlockMatch) {
    const defaultConfigRegex = /defaultConfig\s*\{([^}]+)\}/s;
    const defaultConfigMatch = buildGradle.match(defaultConfigRegex);

    if (defaultConfigMatch) {
      const defaultConfigContent = defaultConfigMatch[1];
      const manifestPlaceholdersRegex =
        /manifestPlaceholders\s*=\s*\[([^\]]+)\]/;

      if (manifestPlaceholdersRegex.test(defaultConfigContent)) {
        buildGradle = buildGradle.replace(
          manifestPlaceholdersRegex,
          (match, placeholders) => {
            let updatedPlaceholders = placeholders;

            if (!placeholders.includes("vibesAppId")) {
              updatedPlaceholders += `, vibesAppId:"${appId}"`;
            }

            if (appUrl && !placeholders.includes("vibesApiUrl")) {
              updatedPlaceholders += `, vibesApiUrl:"${appUrl}"`;
            }

            return `manifestPlaceholders = [${updatedPlaceholders}]`;
          },
        );
      } else {
        let placeholders = `vibesAppId:"${appId}"`;
        if (appUrl) {
          placeholders += `, vibesApiUrl:"${appUrl}"`;
        }

        buildGradle = buildGradle.replace(
          /defaultConfig\s*\{/,
          `defaultConfig {\n        manifestPlaceholders = [${placeholders}]\n`,
        );
      }
    }
  }

  return buildGradle;
};

// Add meta-data tags to AndroidManifest.xml for vibes-react-native
const addMetaTags = (application: any, includeCustomUrl?: boolean): void => {
  if (!application["meta-data"]) {
    application["meta-data"] = [];
  }

  // Remove legacy Expo meta-data keys if present from earlier plugin versions
  application["meta-data"] = application["meta-data"].filter(
    (metaData: any) => {
      const name = metaData.$?.["android:name"];
      return name !== "vibes_app_id" && name !== "vibes_api_url";
    },
  );

  const existingAppIdMetaData = application["meta-data"].find(
    (metaData: any) => metaData.$?.["android:name"] === RN_APP_ID_META,
  );

  if (!existingAppIdMetaData) {
    application["meta-data"].push({
      $: {
        "android:name": RN_APP_ID_META,
        "android:value": "${vibesAppId}",
      },
    });
  }

  if (includeCustomUrl) {
    const existingApiUrlMetaData = application["meta-data"].find(
      (metaData: any) => metaData.$?.["android:name"] === RN_API_URL_META,
    );

    if (!existingApiUrlMetaData) {
      application["meta-data"].push({
        $: {
          "android:name": RN_API_URL_META,
          "android:value": "${vibesApiUrl}",
        },
      });
    }
  }
};

/** Rewrite or drop legacy Expo FMS/receiver names so FCM can resolve RN classes. */
const migrateLegacyExpoPushComponents = (application: any): void => {
  if (application.service) {
    for (const service of application.service) {
      if (service.$?.["android:name"] === LEGACY_EXPO_FMS) {
        service.$["android:name"] = RN_FMS;
      }
    }
  }
  if (application.receiver) {
    for (const receiver of application.receiver) {
      if (receiver.$?.["android:name"] === LEGACY_EXPO_PUSH_RECEIVER) {
        receiver.$["android:name"] = RN_PUSH_RECEIVER;
      }
    }
  }
};

/** Copy vendored AAR into the app when plugin/libs exists. */
const addLocalMavenRepo = (buildGradle: string): string => {
  if (buildGradle.includes("./libs/maven")) {
    console.log(
      "❌ [Android Plugin] Local maven repository already configured in android/build.gradle",
    );
    return buildGradle;
  }

  const mavenRepoSnippet = `        maven {
            url new File(rootProject.projectDir, './libs/maven').absolutePath
        }`;

  const allProjectsRegex =
    /(allprojects\s*\{\s*repositories\s*\{)([\s\S]*?)(\n\s*\}\s*\n\s*\})/;

  if (allProjectsRegex.test(buildGradle)) {
    buildGradle = buildGradle.replace(
      allProjectsRegex,
      (match, before, repositories, after) => {
        return `${before}${repositories}\n${mavenRepoSnippet}${after}`;
      },
    );
  } else {
    const repositoriesRegex =
      /(repositories\s*\{[\s\S]*?)(\n\s*\}\s*(?=\n\s*\}))/;

    if (repositoriesRegex.test(buildGradle)) {
      buildGradle = buildGradle.replace(
        repositoriesRegex,
        (match, before, after) => {
          return `${before}\n${mavenRepoSnippet}${after}`;
        },
      );
      console.log(
        "🟦 [Android Plugin] Added local maven repository to android/build.gradle (fallback method)",
      );
    } else {
      console.warn(
        "❌ [Android Plugin] Could not find allprojects/repositories block in android/build.gradle",
      );
    }
  }

  return buildGradle;
};

const withAndroidPlugin: ConfigPlugin<ConfigPluginProps> = (config, props) => {
  const appId = props?.androidAppId;
  const appUrl = props?.appUrl;
  console.log("🟦 [Android Plugin] Running");

  if (!appId) {
    console.log("❌ [Android Plugin] No app id found");

    return config;
  }

  config = withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const googleServicesPath = path.join(projectRoot, "google-services.json");
      const androidAppPath = path.join(
        projectRoot,
        "android",
        "app",
        "google-services.json",
      );

      if (fs.existsSync(googleServicesPath)) {
        const androidAppDir = path.dirname(androidAppPath);
        if (!fs.existsSync(androidAppDir)) {
          fs.mkdirSync(androidAppDir, { recursive: true });
        }

        fs.copyFileSync(googleServicesPath, androidAppPath);
        console.log(
          "🟦 [Android Plugin] Copied google-services.json to android/app/",
        );
      } else {
        console.warn(
          "❌ [Android Plugin] google-services.json not found in project root",
        );
      }

      return config;
    },
  ]);

  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.language === "groovy") {
      config.modResults.contents = addPlaceholders(
        config.modResults.contents,
        appId,
        appUrl,
      );
    }
    if (!config.modResults.contents.includes("com.google.gms.google-services")) {
      console.log(
        "🟦 [Android Plugin] Adding google services to app/build.gradle",
      );
      config.modResults.contents = config.modResults.contents.replace(
        /apply plugin: "com.facebook.react"/,
        `apply plugin: "com.facebook.react"
apply plugin: "com.google.gms.google-services"`,
      );
    }
    if (!config.modResults.contents.includes("firebase-core")) {
      console.log(
        "🟦 [Android Plugin] Adding firebase dependencies to app/build.gradle",
      );
      config.modResults.contents = config.modResults.contents.replace(
        /dependencies \{/,
        `dependencies {
    implementation 'com.google.firebase:firebase-core:21.1.1'
    implementation 'com.google.firebase:firebase-messaging:23.4.1'`,
      );
    }
    return config;
  });

  config = withProjectBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes("com.google.gms:google-services")) {
      console.log(
        "🟦 [Android Plugin] Adding google services classpath to build.gradle",
      );
      config.modResults.contents = config.modResults.contents.replace(
        /dependencies \{/,
        `dependencies {\n        classpath 'com.google.gms:google-services:4.4.0'`,
      );
    }
    return config;
  });

  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const application = androidManifest.manifest.application?.[0];
    console.log("🟦 [Android Plugin] Updating android manifest");

    if (!androidManifest.manifest["uses-permission"]) {
      androidManifest.manifest["uses-permission"] = [];
    }
    const pushPermissions = [
      "android.permission.POST_NOTIFICATIONS",
      "android.permission.WAKE_LOCK",
      "com.google.android.c2dm.permission.RECEIVE",
    ];
    pushPermissions.forEach((permission) => {
      const existingPermission =
        androidManifest.manifest["uses-permission"]?.find(
          (perm: any) => perm.$?.["android:name"] === permission,
        );
      if (
        !existingPermission &&
        androidManifest.manifest["uses-permission"]
      ) {
        androidManifest.manifest["uses-permission"].push({
          $: { "android:name": permission },
        });
      }
    });

    if (application) {
      addMetaTags(application, !!appUrl);
      // Prefer RN FMS/receiver FQCNs; rewrite any leftover legacy Expo names
      migrateLegacyExpoPushComponents(application);
    }
    return config;
  });

  config = withMainApplication(config, (config) => {
    console.log("🟦 [Android Plugin] Updating main application");
    const { modResults } = config;
    if (!modResults.contents.includes("FirebaseApp.initializeApp")) {
      console.log(
        "🟦 [Android Plugin] Adding FirebaseApp.initializeApp to main application",
      );

      if (
        !modResults.contents.includes("import com.google.firebase.FirebaseApp")
      ) {
        console.log("🟦 [Android Plugin] Adding FirebaseApp import");
        modResults.contents = modResults.contents.replace(
          /import expo\.modules\.ApplicationLifecycleDispatcher/,
          `import expo.modules.ApplicationLifecycleDispatcher\nimport com.google.firebase.FirebaseApp`,
        );
      }
      console.log("🟦 [Android Plugin] Init FirebaseApp in onCreate");
      modResults.contents = modResults.contents.replace(
        /super\.onCreate\(\)/,
        `super.onCreate()\n    // Initialize Firebase\n    FirebaseApp.initializeApp(this)`,
      );
    }
    return config;
  });

  config = withMainActivity(config, (config) => {
    console.log("🟦 [Android Plugin] Updating main activity");
    const { modResults } = config;
    modResults.contents = wireMainActivityPushOpened(modResults.contents);
    return config;
  });

  // Copy vendored AAR under plugin/libs into the app when present.
  config = withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const androidProjectRoot = path.join(projectRoot, "android");
      const pluginLibsPath = path.join(__dirname, "..", "libs");
      const androidLibsPath = path.join(androidProjectRoot, "libs");

      if (await fs.pathExists(pluginLibsPath)) {
        await fs.copy(pluginLibsPath, androidLibsPath, {
          overwrite: true,
        });
        console.log(
          `🟦 [Android Plugin] Copied local maven repo directory to ${androidLibsPath}`,
        );
      } else {
        console.log(
          "🟦 [Android Plugin] No plugin/libs maven repo found",
        );
      }

      return config;
    },
  ]);

  config = withProjectBuildGradle(config, (config) => {
    const pluginLibsPath = path.join(__dirname, "..", "libs");
    if (
      config.modResults.language === "groovy" &&
      fs.existsSync(pluginLibsPath)
    ) {
      config.modResults.contents = addLocalMavenRepo(
        config.modResults.contents,
      );
    }
    return config;
  });

  return config;
};

export default withAndroidPlugin;
