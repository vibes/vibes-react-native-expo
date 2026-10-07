import {
  ConfigPlugin,
  withAppDelegate,
  withDangerousMod,
  withXcodeProject,
  withInfoPlist,
  withEntitlementsPlist,
} from "@expo/config-plugins";
import {
  mergeContents,
  MergeResults,
  removeContents,
} from "@expo/config-plugins/build/utils/generateCode";
import fs from "fs";
import path from "path";

import {
  CONFIGURE_VIBES_BRIDGE_OBJCPP,
  getBridgeHeaderObjC,
  getBridgeImplementationObjC,
  getConfigLineSwift,
  getOptionalConfigLinesSwift,
  IMPORT_VIBES_BRIDGE_OBJCPP,
  IMPORT_VIBES_PACKAGE_SWIFT,
  MATCH_APP_DELEGATE_IMPORTS_OBJCPP,
  MATCH_APP_DELEGATE_IMPORTS_SWIFT,
  MATCH_FINISH_LAUNCHING_METHOD_OBJCPP,
  MATCH_FINISH_LAUNCHING_METHOD_SWIFT,
  MATCH_DEVICE_TOKEN_METHOD_OBJCPP,
  MATCH_DEVICE_TOKEN_METHOD_SWIFT,
  REGISTER_DEVICE_TOKEN_OBJCPP,
  REGISTER_DEVICE_TOKEN_SWIFT,
} from "./iosNativeContent";
import type { ConfigPluginProps } from "./types";
import { getMajorSdkVersion } from "./utils";
import { addAppDelegateDeepLinking, addVibesPushEmitter } from "./deeplinking";

/** Resolve a git tag for VibesPush when CocoaPods trunk is unavailable. */
function resolveVibesPushGitTag(startDir: string): string | null {
  let searchDir = startDir;
  for (let i = 0; i < 8; i++) {
    const candidates = [
      path.join(searchDir, "node_modules", "vibes-react-native", "package.json"),
      path.join(
        searchDir,
        "node_modules",
        "vibes-react-native-expo",
        "package.json",
      ),
    ];
    for (const candidate of candidates) {
      if (!fs.existsSync(candidate)) {
        continue;
      }
      try {
        const pkg = JSON.parse(fs.readFileSync(candidate, "utf8")) as {
          version?: string;
        };
        if (pkg.version) {
          return pkg.version;
        }
      } catch {
        // ignore unreadable package metadata
      }
    }
    const parent = path.dirname(searchDir);
    if (parent === searchDir) {
      break;
    }
    searchDir = parent;
  }
  try {
    const pkg = require("../../../package.json") as { version?: string };
    return pkg.version ?? null;
  } catch {
    return null;
  }
}

// Add import for VibesPush
export function addVibesPackageImport(src: string): MergeResults {
  return mergeContents({
    tag: "vibes-package-import",
    src,
    newSrc: IMPORT_VIBES_PACKAGE_SWIFT,
    anchor: MATCH_APP_DELEGATE_IMPORTS_SWIFT,
    offset: 0,
    comment: "//",
  });
}

export function removeVibesPackageImport(src: string): MergeResults {
  return removeContents({
    tag: "vibes-package-import",
    src,
  });
}

// Add vibes configuration to didFinishLaunchingWithOptions for Swift
export function addVibesConfiguration(
  src: string,
  appId: string,
  appUrl?: string,
): MergeResults {
  const newSrc = [];

  if (appUrl) {
    const codeLines = getOptionalConfigLinesSwift(appId, appUrl);
    codeLines.forEach((line) => newSrc.push(line));
  } else {
    newSrc.push(getConfigLineSwift(appId));
  }

  return mergeContents({
    tag: "vibes-push-config",
    src,
    newSrc: newSrc.join("\n"),
    anchor: MATCH_FINISH_LAUNCHING_METHOD_SWIFT,
    offset: 0,
    comment: "//",
  });
}

export function removeVibesConfiguration(src: string): MergeResults {
  return removeContents({
    tag: "vibes-push-config",
    src,
  });
}

// Add import for VibesBridge.h
export function addVibesBridgeImport(src: string): MergeResults {
  return mergeContents({
    tag: "vibes-bridge-import",
    src,
    newSrc: IMPORT_VIBES_BRIDGE_OBJCPP,
    anchor: MATCH_APP_DELEGATE_IMPORTS_OBJCPP,
    offset: 1,
    comment: "//",
  });
}

export function removeVibesBridgeImport(src: string): MergeResults {
  return removeContents({
    tag: "vibes-bridge-import",
    src,
  });
}

// Add vibes bridge configuration to didFinishLaunchingWithOptions for Objective-C
export function addVibesBridgeConfiguration(src: string): MergeResults {
  const newSrc = [];

  newSrc.push(CONFIGURE_VIBES_BRIDGE_OBJCPP);

  return mergeContents({
    tag: "vibes-bridge-config",
    src,
    newSrc: newSrc.join("\n"),
    anchor: MATCH_FINISH_LAUNCHING_METHOD_OBJCPP,
    offset: 2,
    comment: "//",
  });
}

export function removeVibesBridgeConfiguration(src: string): MergeResults {
  return removeContents({
    tag: "vibes-bridge-config",
    src,
  });
}

// Add device token registration for Swift
export function addVibesDeviceTokenRegistration(src: string): MergeResults {
  return mergeContents({
    tag: "vibes-device-token-registration",
    src,
    newSrc: REGISTER_DEVICE_TOKEN_SWIFT,
    anchor: MATCH_DEVICE_TOKEN_METHOD_SWIFT,
    offset: 2,
    comment: "//",
  });
}

export function removeVibesDeviceTokenRegistration(src: string): MergeResults {
  return removeContents({
    tag: "vibes-device-token-registration",
    src,
  });
}


// Add device token registration for Objective-C
export function addVibesBridgeDeviceTokenRegistration(src: string): MergeResults {
  return mergeContents({
    tag: "vibes-bridge-device-token-registration",
    src,
    newSrc: REGISTER_DEVICE_TOKEN_OBJCPP,
    anchor: MATCH_DEVICE_TOKEN_METHOD_OBJCPP,
    offset: 2,
    comment: "//",
  });
}

export function removeVibesBridgeDeviceTokenRegistration(src: string): MergeResults {
  return removeContents({
    tag: "vibes-bridge-device-token-registration",
    src,
  });
}


// Creates VibesBridge files
const withVibesBridgeFiles: ConfigPlugin<ConfigPluginProps> = (
  config,
  props,
) => {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const projectName = config.modRequest.projectName;
      const iosPath = config.modRequest.platformProjectRoot;

      const vibesBridgeHContent = getBridgeHeaderObjC(projectName ?? "");
      const vibesBridgeMContent = getBridgeImplementationObjC(
        projectName ?? "",
        props.iosAppId ?? "",
        props.appUrl,
      );

      const vibesBridgeHPath = path.join(
        iosPath,
        projectName ?? "",
        "VibesBridge.h",
      );
      fs.writeFileSync(vibesBridgeHPath, vibesBridgeHContent);

      const vibesBridgeMPath = path.join(
        iosPath,
        projectName ?? "",
        "VibesBridge.m",
      );
      fs.writeFileSync(vibesBridgeMPath, vibesBridgeMContent);

      return config;
    },
  ]);
};

// Adds Bridge files to XCode Project
const withVibesBridgeXcodeProject: ConfigPlugin<ConfigPluginProps> = (
  config,
) => {
  return withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    const projectName = config.modRequest.projectName;

    const nativeTarget = xcodeProject.getFirstTarget()?.firstTarget;

    if (!nativeTarget) {
      throw new Error("Could not find native target in Xcode project");
    }

    const projectGroupKey = xcodeProject.findPBXGroupKey({ name: projectName });
    if (!projectGroupKey) {
      throw new Error(
        `Could not find project group for project "${projectName}".`,
      );
    }

    const bridgeHeaderPath = path.join(projectName ?? "", "VibesBridge.h");
    const bridgeImplPath = path.join(projectName ?? "", "VibesBridge.m");

    xcodeProject.addFile(bridgeHeaderPath, projectGroupKey, {
      lastKnownFileType: "sourcecode.c.h",
      sourceTree: "SOURCE_ROOT",
    });

    xcodeProject.addSourceFile(
      bridgeImplPath,
      {
        target: nativeTarget.uuid,
        sourceTree: "SOURCE_ROOT",
      },
      projectGroupKey,
    );

    return config;
  });
};

const withIosPlugin: ConfigPlugin<ConfigPluginProps> = (config, props) => {
  const appId = props?.iosAppId;
  const appUrl = props?.appUrl;

  console.log(`🔧 [iOS Plugin] Starting with props:`, {
    iosAppId: appId,
    appUrl: appUrl,
    vibesAppEnv: props?.vibesAppEnv
  });

  console.log(`🔧 [iOS Plugin] Raw props object:`, props);

  const sdkVersion = getMajorSdkVersion(config.sdkVersion);

  if (!sdkVersion) {
    throw new Error("Cannot parse SDK version");
  }

  if (sdkVersion <= 52) {
    config = withVibesBridgeFiles(config, props);
    config = withVibesBridgeXcodeProject(config, props);
    config = addVibesPushEmitter(config, props)
  }

  config = withAppDelegate(config, (config) => {
    if (config.modResults.language === "swift") {
      if (!appId) {
        config.modResults.contents = removeVibesPackageImport(
          config.modResults.contents,
        ).contents;
        config.modResults.contents = removeVibesConfiguration(
          config.modResults.contents,
        ).contents;
        config.modResults.contents = removeVibesDeviceTokenRegistration(
          config.modResults.contents,
        ).contents;
        return config;
      }

      try {
        const importResults = addVibesPackageImport(config.modResults.contents);
        if (importResults.didMerge || importResults.didClear) {
          config.modResults.contents = importResults.contents;
        }

        const configResults = addVibesConfiguration(
          config.modResults.contents,
          appId,
          appUrl,
        );
        if (configResults.didMerge || configResults.didClear) {
          config.modResults.contents = configResults.contents;
        }

        // Add device token registration for Swift
        const deviceTokenResults = addVibesDeviceTokenRegistration(
          config.modResults.contents,
        );
        if (deviceTokenResults.didMerge || deviceTokenResults.didClear) {
          config.modResults.contents = deviceTokenResults.contents;
        } else {
          console.warn("⚠️ [iOS Plugin] No existing device token method found in AppDelegate.swift");
        }
      } catch (error: any) {
        if (error.code === "ERR_NO_MATCH") {
          throw new Error(
            `Cannot add Vibes package configuration to the project's AppDelegate.swift because it's malformed. ` +
            `Please report this issue with a copy of your AppDelegate.`,
          );
        }
        throw error;
      }
    } else if (["objc", "objcpp"].includes(config.modResults.language)) {
      if (!appId) {
        config.modResults.contents = removeVibesBridgeConfiguration(
          config.modResults.contents,
        ).contents;
        config.modResults.contents = removeVibesBridgeImport(
          config.modResults.contents,
        ).contents;
        config.modResults.contents = removeVibesBridgeDeviceTokenRegistration(
          config.modResults.contents,
        ).contents;
        return config;
      }

      try {
        const importResults = addVibesBridgeImport(config.modResults.contents);
        if (importResults.didMerge || importResults.didClear) {
          config.modResults.contents = importResults.contents;
        }

        const configResults = addVibesBridgeConfiguration(
          config.modResults.contents,
        );
        if (configResults.didMerge || configResults.didClear) {
          config.modResults.contents = configResults.contents;
        }

        // Add device token registration for Objective-C 
        const deviceTokenResults = addVibesBridgeDeviceTokenRegistration(
          config.modResults.contents,
        );
        if (deviceTokenResults.didMerge || deviceTokenResults.didClear) {
          config.modResults.contents = deviceTokenResults.contents;
        } else {
          console.warn("⚠️ [iOS Plugin] No existing device token method found in AppDelegate.mm");
        }
      } catch (error: any) {
        if (error.code === "ERR_NO_MATCH") {
          throw new Error(
            `Cannot add Vibes configuration bridge to the project's AppDelegate.mm because it's malformed. ` +
            `Please report this issue with a copy of your AppDelegate.`,
          );
        }
        throw error;
      }

      try {
        // Add deep linking code to AppDelegate.mm
        config = addAppDelegateDeepLinking(config);
      }
      catch (error: any) {
        console.error(`❌ [iOS Plugin] Error adding deep linking code to AppDelegate.mm: ${error.message}`);
      }
    } else {
      throw new Error(
        `Cannot add VibesPush because the project AppDelegate is not a supported language: ${config.modResults.language}`,
      );
    }

    return config;
  });

  // Add Info.plist with Vibes keys
  config = withInfoPlist(config, (c) => {
    // Add Vibes keys
    if (props.iosAppId) {
      c.modResults.VibesAppId = props.iosAppId;
      console.log(`✅ [iOS Plugin] Added VibesAppId: ${props.iosAppId}`);
    }
    if (props.appUrl) {
      c.modResults.VibesApiURL = props.appUrl;
      console.log(`✅ [iOS Plugin] Added VibesApiURL: ${props.appUrl}`);
    }
    if (props.vibesAppEnv) {
      c.modResults.VibesAppEnv = props.vibesAppEnv;
      console.log(`✅ [iOS Plugin] Added VibesAppEnv: ${props.vibesAppEnv}`);
    }

    // Add push notifications description
    c.modResults.NSPushNotificationsUsageDescription =
      "This app uses push notifications to keep you updated.";

    // Add background modes
    if (!c.modResults.UIBackgroundModes) {
      c.modResults.UIBackgroundModes = [];
    }
    if (!c.modResults.UIBackgroundModes.includes("remote-notification")) {
      c.modResults.UIBackgroundModes.push("remote-notification");
    }

    return c;
  });

  // Add entitlements
  config = withEntitlementsPlist(config, (c) => {
    // Set aps-environment from plugin props
    if (props.apsEnvironment) {
      c.modResults["aps-environment"] = props.apsEnvironment;
    } else {
      // Fallback to automatic detection if not specified
      const isDevelopment = process.env.EAS_BUILD_PROFILE === "development" ||
        process.env.EAS_BUILD_PROFILE === "preview" ||
        !process.env.EAS_BUILD_PROFILE; // local builds

      c.modResults["aps-environment"] = isDevelopment ? "development" : "production";
    }

    return c;
  });

  // Point CocoaPods at a local VibesPush checkout when one sits above the app (survives prebuild).
  config = withDangerousMod(config, [
    "ios",
    async (config) => {
      const iosRoot = config.modRequest.platformProjectRoot;
      const podfilePath = path.join(iosRoot, "Podfile");
      if (!fs.existsSync(podfilePath)) {
        return config;
      }

      let searchDir = iosRoot;
      let localIosSdk: string | null = null;
      for (let i = 0; i < 6; i++) {
        const candidate = path.join(searchDir, "packages", "ios");
        if (fs.existsSync(path.join(candidate, "VibesPush.podspec"))) {
          localIosSdk = candidate;
          break;
        }
        const parent = path.dirname(searchDir);
        if (parent === searchDir) {
          break;
        }
        searchDir = parent;
      }
      let podfile = fs.readFileSync(podfilePath, "utf8");
      if (
        podfile.includes("pod 'VibesPush', :path") ||
        podfile.includes("pod 'VibesPush', :git")
      ) {
        return config;
      }

      let marker: string | null = null;
      let logMessage: string | null = null;
      if (localIosSdk) {
        let rel = path.relative(iosRoot, localIosSdk);
        if (!rel.startsWith(".")) {
          rel = `./${rel}`;
        }
        marker =
          "  # Local monorepo iOS SDK (overrides CocoaPods versioned VibesPush)\n" +
          `  pod 'VibesPush', :path => '${rel}'\n\n`;
        logMessage = "🔧 [iOS Plugin] Wired local monorepo VibesPush into Podfile";
      } else {
        const tag = resolveVibesPushGitTag(iosRoot);
        if (tag) {
          marker =
            "  # VibesPush from git (CocoaPods trunk may not have this version)\n" +
            `  pod 'VibesPush', :git => 'https://github.com/vibes/push-sdk-ios.git', :tag => '${tag}'\n\n`;
          logMessage = "🔧 [iOS Plugin] Wired VibesPush from git into Podfile";
        }
      }

      if (marker && podfile.includes("post_install do |installer|")) {
        podfile = podfile.replace(
          "  post_install do |installer|",
          `${marker}  post_install do |installer|`,
        );
        fs.writeFileSync(podfilePath, podfile);
        if (logMessage) {
          console.log(logMessage);
        }
      }
      return config;
    },
  ]);

  return config;
};

export default withIosPlugin;
