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
        androidAppId: "3344c960-f53b-43d5-9b3a-2b4498703ef3",   
        appUrl: "https://public-api-uatus0.vibescm.com/mobile_apps",
        iosAppId: "3344c960-f53b-43d5-9b3a-2b4498703ef3",
        vibesAppEnv: 'UAT',
        apsEnvironment: 'development',
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