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

  const sdkVersion = getMajorSdkVersion(config.sdkVersion);

  if (!sdkVersion) {
    throw new Error("Cannot parse SDK version");
  }

  if (sdkVersion <= 52) {
    config = withVibesBridgeFiles(config, props);

    config = withVibesBridgeXcodeProject(config, props);
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

  // Add Info.plist with Vibes keys
  config = withInfoPlist(config, (c) => {
    // Add Vibes keys
    if (props.iosAppId) {
      c.modResults.VibesAppId = props.iosAppId;
    }
    if (props.appUrl) {
      c.modResults.VibesApiURL = props.appUrl;
    }
    if (props.vibesAppEnv) {
      c.modResults.VibesAppEnv = props.vibesAppEnv;
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
    c.modResults["aps-environment"] = "development";
    return c;
  });

  return config;
};

export default withIosPlugin;
