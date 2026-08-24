import { mockVibesNativeModule } from "./vibesNativeModule";

export const Platform = {
  OS: "ios" as "ios" | "android",
  Version: 33 as number | string,
  select: <T,>(specs: { ios?: T; android?: T; default?: T }) =>
    Platform.OS === "android"
      ? (specs.android ?? specs.default)
      : (specs.ios ?? specs.default),
};

export const PermissionsAndroid = {
  PERMISSIONS: {
    POST_NOTIFICATIONS: "android.permission.POST_NOTIFICATIONS",
  },
  RESULTS: {
    GRANTED: "granted",
    DENIED: "denied",
    NEVER_ASK_AGAIN: "never_ask_again",
  },
  request: jest.fn(() => Promise.resolve("granted")),
};

export const NativeModules = {
  Vibes: mockVibesNativeModule,
};

export default {
  Platform,
  PermissionsAndroid,
  NativeModules,
};
