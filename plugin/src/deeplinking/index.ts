import { ConfigPlugin, ExportedConfigWithProps } from "expo/config-plugins";
import { addAppLaunchNotificationObjC, addPushEmitterNotificationReceived, addPushEmitterNotificationResponseReceived, addPushEmitterNotificationResponseReceivedNew, addUNUserNotificationDelegate, addVibesPushEmitterImport } from "./appDelegate";
import {
    MergeResults
} from "@expo/config-plugins/build/utils/generateCode";
import { AppDelegateProjectFile } from "@expo/config-plugins/build/ios/Paths.js";
import { withVibesPushEmitterFiles, withVibesPushEmitterXcodeProject } from "./addPushEmitter";
import { ConfigPluginProps } from "../types";

export const addAppDelegateDeepLinking = (config: ExportedConfigWithProps<AppDelegateProjectFile>
): ExportedConfigWithProps<AppDelegateProjectFile> => {
    const importEmitterResults = addVibesPushEmitterImport(config.modResults.contents);
    if (importEmitterResults.didMerge || importEmitterResults.didClear) {
        config.modResults.contents = importEmitterResults.contents;
    }

    const notificationLaunchResults = addAppLaunchNotificationObjC(
        config.modResults.contents,
    );
    if (notificationLaunchResults.didMerge || notificationLaunchResults.didClear) {
        config.modResults.contents = notificationLaunchResults.contents;
    }

    // Add notification received for Objective-C 
    const notificationReceivedResults = addPushEmitterNotificationReceived(
        config.modResults.contents,
    );
    if (notificationReceivedResults.didMerge || notificationReceivedResults.didClear) {
        config.modResults.contents = notificationReceivedResults.contents;
    } else {
        console.warn("⚠️ [iOS Plugin] No existing notification received method found in AppDelegate.mm");
    }

    try {
        const responseResults = addPushEmitterNotificationResponseReceived(
            config.modResults.contents,
        );
        if (responseResults.didMerge || responseResults.didClear) {
            config.modResults.contents = responseResults.contents;
        }
    } catch (e) {
        // response received method didn't exist, create it 
        const responseResults = addPushEmitterNotificationResponseReceivedNew(
            config.modResults.contents,
        );
        if (responseResults.didMerge || responseResults.didClear) {
            config.modResults.contents = responseResults.contents;
        }
    }

    // Add notification response received for Objective-C 
    const userNotificationDelegateResults = addUNUserNotificationDelegate(
        config.modResults.contents,
    );
    if (userNotificationDelegateResults.didMerge || userNotificationDelegateResults.didClear) {
        config.modResults.contents = userNotificationDelegateResults.contents;
    }

    return config
}

export const addVibesPushEmitter: ConfigPlugin<ConfigPluginProps> = (
    config,
    props,
) => {
    config = withVibesPushEmitterFiles(config, props);
    config = withVibesPushEmitterXcodeProject(config, props);
    return config
}
