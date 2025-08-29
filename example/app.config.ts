import { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "expo-vibes-sdk-example",
  slug: "expo-vibes-sdk-example",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.vibes.push.test.rn",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false
    },
    entitlements: {
      "aps-environment": "development"
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    package: "com.vibes.push.test.rn",
    googleServicesFile: "./google-services.json",

  },
  plugins: [
    [
      "vibes-react-native-expo",
      {
        androidAppId: process.env.ANDROID_APP_ID,
        appUrl: process.env.APP_URL,
        iosAppId: process.env.IOS_APP_ID,
        vibesAppEnv: process.env.VIBES_APP_ENV,
      },
    ],
    // [
    //   "expo-build-properties",
    //   {
    //     ios: {
    //       useFrameworks: "static"
    //     }
    //   }
    // ]
  ],
  web: {
    favicon: "./assets/favicon.png",
  },
  extra: {
    eas: {
      projectId: "7bdea1b1-3b3b-47c4-a485-114c5099926b"
    }
  },
  owner: "simoninho",
};

export default config;