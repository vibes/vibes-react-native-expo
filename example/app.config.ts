import { ExpoConfig } from "expo/config";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, ".env") });

const androidAppId = process.env.ANDROID_APP_ID || "[YOUR_ANDROID_APP_ID]";
const iosAppId = process.env.IOS_APP_ID || "[YOUR_IOS_APP_ID]";
const androidPackage =
  process.env.ANDROID_PACKAGE_NAME || "com.vibes.push.test.rn";
const iosBundleId =
  process.env.IOS_BUNDLE_IDENTIFIER || "com.vibes.push.test.rn";
const appUrl = process.env.APP_URL || "[YOUR_API_URL]";
const vibesAppEnv = process.env.VIBES_APP_ENV || "[YOUR_APP_ENV]";

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
    bundleIdentifier: iosBundleId,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    package: androidPackage,
    googleServicesFile: "./google-services.json",
  },
  plugins: [
    [
      "vibes-react-native-expo",
      {
        androidAppId,
        appUrl,
        iosAppId,
        vibesAppEnv,
        apsEnvironment: "development",
      },
    ],
  ],
  web: {
    favicon: "./assets/favicon.png",
  },
};

export default config;
