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

const MATCH_APP_DELEGATE_IMPORTS_OBJCPP = /#import "AppDelegate\.h"/;
const IMPORT_VIBES_PUSH_EMITTER_OBJCPP = `#import "VibesPushEmitter.h"`;

// Add import for VibesPushEmitter.h
export function addVibesPushEmitterImport(src: string): MergeResults {
  return mergeContents({
    tag: "vibes-push-emitter-import",
    src,
    newSrc: IMPORT_VIBES_PUSH_EMITTER_OBJCPP,
    anchor: MATCH_APP_DELEGATE_IMPORTS_OBJCPP,
    offset: 1,
    comment: "//",
  });
}

export function removeVibesPushEmitterImport(src: string): MergeResults {
  return removeContents({
    tag: "vibes-push-emitter-import",
    src,
  });
}

// App launch with notification

const MATCH_APP_LAUNCH_NOTIFICATION_OBJCPP = /-\s*\(BOOL\)\s*application:\s*\(UIApplication\s*\*\s*\)\s*\w+\s+didFinishLaunchingWithOptions:\s*\(NSDictionary\s*\*\s*\)\s*\w+/g;
const APP_LAUNCH_NOTIFICATION_OBJCPP = ` [[UNUserNotificationCenter currentNotificationCenter] setDelegate: self];
  if ([launchOptions objectForKey:UIApplicationLaunchOptionsRemoteNotificationKey]) {
    NSDictionary * payload = [launchOptions objectForKey:UIApplicationLaunchOptionsRemoteNotificationKey];
    [VibesPushEmitter setInitialNotification: payload];
  }`

export function addAppLaunchNotificationObjC(src: string): MergeResults {
  return mergeContents({
    tag: "vibes-push-emitter-app-launch-notification",
    src,
    newSrc: APP_LAUNCH_NOTIFICATION_OBJCPP,
    anchor: MATCH_APP_LAUNCH_NOTIFICATION_OBJCPP,
    offset: 5,
    comment: "//",
  });
}
// export const getAppLaunchNotificationSwift = (projectName: string) => `
//   UNUserNotificationCenter.current().delegate = self
//   if let payload = launchOptions?[UIApplication.LaunchOptionsKey.remoteNotification] as? [String: Any] {
//       VibesPushEmitter.setInitialNotification(payload)
//   }
// `

// UNUserNotificationCenterDelegate
const MATCH_UNUSER_NOTIFICATION_DELEGATE = /@implementation AppDelegate/;
const UNUSER_NOTIFICATION_DELEGATE = `#import <UserNotifications/UNUserNotificationCenter.h>

@interface AppDelegate()<UNUserNotificationCenterDelegate>
@end`;


export function addUNUserNotificationDelegate(src: string): MergeResults {
  return mergeContents({
    tag: "vibes-push-emitter-unusernotification-delegate",
    src,
    newSrc: UNUSER_NOTIFICATION_DELEGATE,
    anchor: MATCH_UNUSER_NOTIFICATION_DELEGATE,
    offset: 0,
    comment: "//",
  });
}


// Notification received
const MATCH_NOTIFICATION_RECEIVED_METHOD_OBJCPP =
  /-\s*\(void\)\s*application:\s*\(UIApplication\s*\*\s*\)\s*\w+\s+didReceiveRemoteNotification:\s*\(NSDictionary\s*\*\s*\)\s*\w+/g;
const NOTIFICATION_RECEIVED_OBJCPP = `[VibesPushEmitter sendPushReceivedEvent: userInfo];`;

// export const MATCH_NOTIFICATION_RECEIVED_METHOD_SWIFT =
//   /\bfunc\s+application\(\s*_\s+application:\s*UIApplication,\s*didReceiveRemoteNotification\s+deviceToken:\s*Data\s*\)/g;
// export const NOTIFICATION_RECEIVED_SWIFT = ``

export function addPushEmitterNotificationReceived(src: string): MergeResults {
  return mergeContents({
    tag: "vibes-push-emitter-notification-received",
    src,
    newSrc: NOTIFICATION_RECEIVED_OBJCPP,
    anchor: MATCH_NOTIFICATION_RECEIVED_METHOD_OBJCPP,
    offset: 2,
    comment: "//",
  });
}

export function removePushEmitterNotificationReceived(src: string): MergeResults {
  return removeContents({
    tag: "vibes-push-emitter-notification-received",
    src,
  });
}

// Notification response received

const MATCH_NOTIFICATION_RESPONSE_RECEIVED_METHOD_OBJCPP = /-\s*\(void\)\s*userNotificationCenter:\s*\(UNUserNotificationCenter\s*\*\s*\)\s*\w+\s+didReceiveNotificationResponse:\s*\(UNNotificationResponse\s*\*\s*\)\s*\w+/g;
const NOTIFICATION_RESPONSE_RECEIVED_OBJCPP = `
-(void)userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse *)response withCompletionHandler:(void (^)())completionHandler {
  NSDictionary *userInfo = [[[[response notification] request] content] userInfo];
  NSDictionary *payload = @{@"payload": userInfo};
  [VibesPushEmitter sendPushOpenedEvent: payload];
}
`;

export function addPushEmitterNotificationResponseReceived(src: string): MergeResults {
  return mergeContents({
    tag: "vibes-push-emitter-notification-response-received",
    src,
    newSrc: NOTIFICATION_RESPONSE_RECEIVED_OBJCPP,
    anchor: MATCH_NOTIFICATION_RESPONSE_RECEIVED_METHOD_OBJCPP,
    offset: 2,
    comment: "//",
  });
}

export function addPushEmitterNotificationResponseReceivedNew(src: string): MergeResults {
  return mergeContents({
    tag: "vibes-push-emitter-notification-response-received-new",
    src,
    newSrc: NOTIFICATION_RESPONSE_RECEIVED_OBJCPP,
    anchor: /@end/,
    offset: 0,
    comment: "//",
  });
}
