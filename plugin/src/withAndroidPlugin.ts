import {
  ConfigPlugin,
  withAndroidManifest,
  withAppBuildGradle,
  withMainApplication,
  withProjectBuildGradle,
  withDangerousMod,
} from "@expo/config-plugins";

import type { ConfigPluginProps } from "./types";
import path from "path";
import fs from "fs";

// Add manifest placeholders to build.gradle
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

            if (appUrl && !placeholders.includes("vibesAppUrl")) {
              updatedPlaceholders += `, vibesAppUrl:"${appUrl}"`;
            }

            return `manifestPlaceholders = [${updatedPlaceholders}]`;
          },
        );
      } else {
        let placeholders = `vibesAppId:"${appId}"`;
        if (appUrl) {
          placeholders += `, vibesAppUrl:"${appUrl}"`;
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

// Add meta-data tags to AndroidManifest.xml
const addMetaTags = (application: any, includeCustomUrl?: boolean): void => {
  if (!application["meta-data"]) {
    application["meta-data"] = [];
  }

  const existingAppIdMetaData = application["meta-data"].find(
    (metaData: any) => metaData.$?.["android:name"] === "vibes_app_id",
  );

  if (!existingAppIdMetaData) {
    application["meta-data"].push({
      $: {
        "android:name": "vibes_app_id",
        "android:value": "${vibesAppId}",
      },
    });
  }

  if (includeCustomUrl) {
    const existingApiUrlMetaData = application["meta-data"].find(
      (metaData: any) => metaData.$?.["android:name"] === "vibes_api_url",
    );

    if (!existingApiUrlMetaData) {
      application["meta-data"].push({
        $: {
          "android:name": "vibes_api_url",
          "android:value": "${vibesAppUrl}",
        },
      });
    }
  }
};

const withAndroidPlugin: ConfigPlugin<ConfigPluginProps> = (config, props) => {
  const appId = props?.androidAppId;
  const appUrl = props?.appUrl;

  if (!appId) {
    return config;
  }

  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const googleServicesPath = path.join(projectRoot, 'google-services.json');
      const androidAppPath = path.join(projectRoot, 'android', 'app', 'google-services.json');
      
      if (fs.existsSync(googleServicesPath)) {
        // Ensure android/app directory exists
        const androidAppDir = path.dirname(androidAppPath);
        if (!fs.existsSync(androidAppDir)) {
          fs.mkdirSync(androidAppDir, { recursive: true });
        }
        
        // Copy the file
        fs.copyFileSync(googleServicesPath, androidAppPath);
        console.log('✅ Copied google-services.json to android/app/');
      } else {
        console.warn('⚠️  google-services.json not found in project root');
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
    if (!config.modResults.contents.includes('com.google.gms.google-services')) {
      config.modResults.contents = config.modResults.contents.replace(
        /apply plugin: "com.facebook.react"/,
        `apply plugin: "com.facebook.react"
apply plugin: "com.google.gms.google-services"`
      );
    }
    // Dodaj dependency Firebase
    if (!config.modResults.contents.includes('firebase-core')) {
      config.modResults.contents = config.modResults.contents.replace(
        /dependencies \{/, 
        `dependencies {
    implementation 'com.google.firebase:firebase-core:21.1.1'
    implementation 'com.google.firebase:firebase-messaging:23.4.1'`
      );
    }
    return config;
  });

  // Dodaj classpath do google-services w project build.gradle
  config = withProjectBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes('com.google.gms:google-services')) {
      config.modResults.contents = config.modResults.contents.replace(
        /dependencies \{/, 
        `dependencies {\n        classpath 'com.google.gms:google-services:4.4.0'`
      );
    }
    return config;
  });

  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const application = androidManifest.manifest.application?.[0];

    if (!androidManifest.manifest['uses-permission']) {
      androidManifest.manifest['uses-permission'] = [];
    }
    const pushPermissions = [
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.WAKE_LOCK',
      'com.google.android.c2dm.permission.RECEIVE'
    ];
    pushPermissions.forEach(permission => {
      const existingPermission = androidManifest.manifest['uses-permission']?.find(
        (perm: any) => perm.$?.['android:name'] === permission
      );
      if (!existingPermission && androidManifest.manifest['uses-permission']) {
        androidManifest.manifest['uses-permission'].push({
          $: { 'android:name': permission }
        });
      }
    });

    if (application) {
      addMetaTags(application, !!appUrl);

      if (!application.service) {
        application.service = [];
      }
      const existingService = application.service.find(
        (service: any) => service.$?.['android:name'] === 'expo.modules.vibessdk.Fms'
      );
      if (!existingService) {
        application.service.push({
          $: {
            'android:name': 'expo.modules.vibessdk.Fms',
            'android:exported': 'false'
          },
          'intent-filter': [{
            action: [{ $: { 'android:name': 'com.google.firebase.MESSAGING_EVENT' } }]
          }]
        });
      }

      if (!application.receiver) {
        application.receiver = [];
      }
      const existingReceiver = application.receiver.find(
        (receiver: any) => receiver.$?.['android:name'] === 'expo.modules.vibessdk.VibesPushReceiver'
      );
      if (!existingReceiver) {
        application.receiver.push({
          $: {
            'android:name': 'expo.modules.vibessdk.VibesPushReceiver',
            'android:exported': 'false'
          }
        });
      }
    }
    return config;
  });

  config = withMainApplication(config, (config) => {
    const { modResults } = config;
    if (!modResults.contents.includes('FirebaseApp.initializeApp')) {
      // Add Firebase import
      if (!modResults.contents.includes('import com.google.firebase.FirebaseApp')) {
        modResults.contents = modResults.contents.replace(
          /import expo\.modules\.ApplicationLifecycleDispatcher/,
          `import expo.modules.ApplicationLifecycleDispatcher\nimport com.google.firebase.FirebaseApp`
        );
      }
      // Add Firebase initialization in onCreate
      modResults.contents = modResults.contents.replace(
        /super\.onCreate\(\)/,
        `super.onCreate()\n    // Initialize Firebase\n    FirebaseApp.initializeApp(this)`
      );
    }
    return config;
  });

  return config;
};

export default withAndroidPlugin;
