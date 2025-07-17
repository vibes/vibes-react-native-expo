import {
  ConfigPlugin,
  withXcodeProject,
  withDangerousMod,
  withInfoPlist,
  withEntitlementsPlist,
} from "@expo/config-plugins";
import fs from "fs";
import path from "path";

import {
  getBridgeHeaderObjC,
  getBridgeImplementationObjC,
  getAppDelegate,
} from "./iosBridgeContent";
import type { ConfigPluginProps } from "./types";

// Creates VibesBridge files and AppDelegate.m
const withVibesBridgeFiles: ConfigPlugin<ConfigPluginProps> = (
  config,
  props,
) => {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const iosPath = config.modRequest.platformProjectRoot;
      // Find folder with AppDelegate.m or AppDelegate.mm
      const appFolders = fs.readdirSync(iosPath).filter(f => {
        try {
          return fs.statSync(path.join(iosPath, f)).isDirectory() &&
            (fs.existsSync(path.join(iosPath, f, "AppDelegate.mm")) || fs.existsSync(path.join(iosPath, f, "AppDelegate.m")));
        } catch {
          return false;
        }
      });
      const appFolder = appFolders[0] || "expovibessdkexample";
      const projectName = appFolder;

      const vibesBridgeHContent = getBridgeHeaderObjC(projectName);
      const vibesBridgeMContent = getBridgeImplementationObjC(
        projectName,
        props.iosAppId ?? "",
        props.appUrl,
      );
      const appDelegateContent = getAppDelegate(projectName);

      const vibesBridgeHPath = path.join(iosPath, "VibesBridge.h");
      const vibesBridgeMPath = path.join(iosPath, "VibesBridge.m");
      const appDelegateMMPath = path.join(iosPath, appFolder, "AppDelegate.mm");
      const appDelegateMPath = path.join(iosPath, appFolder, "AppDelegate.m");

      fs.writeFileSync(vibesBridgeHPath, vibesBridgeHContent);
      fs.writeFileSync(vibesBridgeMPath, vibesBridgeMContent);
      if (fs.existsSync(appDelegateMMPath)) {
        fs.writeFileSync(appDelegateMMPath, appDelegateContent);
      } else {
        fs.writeFileSync(appDelegateMPath, appDelegateContent);
      }

      return config;
    },
  ]);
};

// Add VibesBridge to Xcode project
const withVibesBridgeXcodeProject: ConfigPlugin<ConfigPluginProps> = (
  config,
  props,
) => {
  return withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    const iosPath = config.modRequest.platformProjectRoot;

    // Add VibesBridge.h and VibesBridge.m to the project
    const vibesBridgeHPath = path.join(iosPath, "VibesBridge.h");
    const vibesBridgeMPath = path.join(iosPath, "VibesBridge.m");

    if (fs.existsSync(vibesBridgeHPath) && fs.existsSync(vibesBridgeMPath)) {
      try {
        // Get the main group
        const mainGroup = xcodeProject.getFirstProject().firstProject.mainGroup;
        
        // Add header file
        xcodeProject.addFile("VibesBridge.h", mainGroup, {
          lastKnownFileType: "sourcecode.c.h",
          sourceTree: "SOURCE_ROOT",
        });

        // Add implementation file
        xcodeProject.addSourceFile(
          "VibesBridge.m",
          {
            target: xcodeProject.getFirstTarget().uuid,
            sourceTree: "SOURCE_ROOT",
          },
          mainGroup,
        );
      } catch (error) {
        console.warn("Failed to add VibesBridge files to Xcode project:", error);
      }
    }

    return config;
  });
};

const withIosPlugin: ConfigPlugin<ConfigPluginProps> = (config, props) => {
  config = withVibesBridgeFiles(config, props);
  config = withVibesBridgeXcodeProject(config, props);

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
