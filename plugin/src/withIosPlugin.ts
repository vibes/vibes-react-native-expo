import {
  ConfigPlugin,
  withAppDelegate,
  withDangerousMod,
  withXcodeProject,
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
  MATCH_DID_REGISTER_REMOTE_NOTIFICATIONS_OBJCPP,
  DID_REGISTER_REMOTE_NOTIFICATIONS_OBJCPP,
} from "./iosNativeContent";
import type { ConfigPluginProps } from "./types";
import { getMajorSdkVersion } from "./utils";

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

// Add didRegisterForRemoteNotificationsWithDeviceToken method for Objective-C
export function addDidRegisterRemoteNotificationsMethod(src: string): MergeResults {
  return mergeContents({
    tag: "vibes-did-register-remote-notifications",
    src,
    newSrc: DID_REGISTER_REMOTE_NOTIFICATIONS_OBJCPP,
    anchor: MATCH_DID_REGISTER_REMOTE_NOTIFICATIONS_OBJCPP,
    offset: 0,
    comment: "//",
  });
}

export function removeDidRegisterRemoteNotificationsMethod(src: string): MergeResults {
  return removeContents({
    tag: "vibes-did-register-remote-notifications",
    src,
  });
}

// Add push notifications entitlements
const withPushNotificationsEntitlements: ConfigPlugin<ConfigPluginProps> = (
  config,
  props,
) => {
  if (!props?.iosAppId) {
    return config;
  }

  return withEntitlementsPlist(config, (config) => {
    const entitlements = config.modResults;

    // Add aps-environment entitlement for push notifications
    if (!entitlements["aps-environment"]) {
      entitlements["aps-environment"] = "development";
    }

    return config;
  });
};

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

      const vibesBridgeHPath = path.join(iosPath, "VibesBridge.h");
      fs.writeFileSync(vibesBridgeHPath, vibesBridgeHContent);

      const vibesBridgeMPath = path.join(iosPath, "VibesBridge.m");
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

    const nativeTarget = xcodeProject.getFirstTarget()?.firstTarget;

    if (!nativeTarget) {
      throw new Error("Could not find native target in Xcode project");
    }

    // Gets the main XCode group
    const mainGroup = xcodeProject.getFirstProject().firstProject.mainGroup;

    xcodeProject.addFile("VibesBridge.h", mainGroup, {
      lastKnownFileType: "sourcecode.c.h",
      sourceTree: "SOURCE_ROOT",
    });

    xcodeProject.addSourceFile(
      "VibesBridge.m",
      {
        target: nativeTarget.uuid,
        sourceTree: "SOURCE_ROOT",
      },
      mainGroup,
    );

    return config;
  });
};

const withIosPlugin: ConfigPlugin<ConfigPluginProps> = (config, props) => {
  const appId = props?.iosAppId;
  const appUrl = props?.appUrl;

  const sdkVersion = getMajorSdkVersion(config.sdkVersion);

  if (!sdkVersion) {
    throw new Error("Cannot parse SDK version");
  }

  if (sdkVersion <= 52) {
    config = withVibesBridgeFiles(config, props);

    config = withVibesBridgeXcodeProject(config, props);
  }

  // Add push notifications entitlements
  config = withPushNotificationsEntitlements(config, props);

  return withAppDelegate(config, (config) => {
    if (config.modResults.language === "swift") {
      if (!appId) {
        config.modResults.contents = removeVibesPackageImport(
          config.modResults.contents,
        ).contents;
        config.modResults.contents = removeVibesConfiguration(
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
        config.modResults.contents = removeDidRegisterRemoteNotificationsMethod(
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

        const didRegisterResults = addDidRegisterRemoteNotificationsMethod(
          config.modResults.contents,
        );
        if (didRegisterResults.didMerge || didRegisterResults.didClear) {
          config.modResults.contents = didRegisterResults.contents;
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
    } else {
      throw new Error(
        `Cannot add VibesPush because the project AppDelegate is not a supported language: ${config.modResults.language}`,
      );
    }

    return config;
  });
};

export default withIosPlugin;
