import {
  addAppLaunchNotificationObjC,
  addPushEmitterNotificationReceived,
  addPushEmitterNotificationResponseReceived,
  addPushEmitterNotificationResponseReceivedNew,
  addPushEmitterWillPresentNotification,
  APP_LAUNCH_NOTIFICATION_OBJCPP,
  NOTIFICATION_RECEIVED_OBJCPP,
  NOTIFICATION_RESPONSE_BODY_OBJCPP,
  NOTIFICATION_RESPONSE_RECEIVED_OBJCPP,
  WILL_PRESENT_NOTIFICATION_OBJCPP,
} from "../deeplinking/appDelegate";
import {
  RN_PUSH_RECEIVER,
  wireMainActivityPushOpened,
} from "../withAndroidPlugin";

const SAMPLE_APP_DELEGATE = `#import "AppDelegate.h"

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"main";
  self.initialProps = @{};

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  completionHandler(UIBackgroundFetchResultNoData);
}

@end
`;

describe("iOS AppDelegate push lifecycle injection", () => {
  it("wraps cold-start launch payload as @{payload: ...}", () => {
    expect(APP_LAUNCH_NOTIFICATION_OBJCPP).toContain(
      '[VibesPushEmitter setInitialNotification: @{@"payload": payload}]',
    );

    const result = addAppLaunchNotificationObjC(SAMPLE_APP_DELEGATE);
    expect(result.didMerge).toBe(true);
    expect(result.contents).toContain('@{@"payload": payload}');
    expect(result.contents).toContain(
      "setDelegate: self",
    );
  });

  it("wraps didReceiveRemoteNotification payload for pushReceived", () => {
    expect(NOTIFICATION_RECEIVED_OBJCPP).toContain('@{@"payload": userInfo}');
    expect(NOTIFICATION_RECEIVED_OBJCPP).toContain(
      "sendPushReceivedEvent: vibesPayload",
    );

    const result = addPushEmitterNotificationReceived(SAMPLE_APP_DELEGATE);
    expect(result.didMerge).toBe(true);
    expect(result.contents).toContain("sendPushReceivedEvent: vibesPayload");
  });

  it("injects didReceiveNotificationResponse with wrapped payload + completionHandler", () => {
    expect(NOTIFICATION_RESPONSE_BODY_OBJCPP).toContain(
      '@{@"payload": userInfo}',
    );
    expect(NOTIFICATION_RESPONSE_BODY_OBJCPP).toContain(
      "sendPushOpenedEvent: payload",
    );
    expect(NOTIFICATION_RESPONSE_BODY_OBJCPP).toContain("completionHandler()");

    const result =
      addPushEmitterNotificationResponseReceivedNew(SAMPLE_APP_DELEGATE);
    expect(result.didMerge).toBe(true);
    expect(result.contents).toContain(NOTIFICATION_RESPONSE_RECEIVED_OBJCPP.trim());
    expect(result.contents).toContain("completionHandler()");
  });

  it("injects body into an existing didReceiveNotificationResponse method", () => {
    const withExisting = SAMPLE_APP_DELEGATE.replace(
      "@end",
      `-(void)userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse *)response withCompletionHandler:(void (^)(void))completionHandler
{
}

@end`,
    );

    const result = addPushEmitterNotificationResponseReceived(withExisting);
    expect(result.didMerge).toBe(true);
    expect(result.contents).toContain("sendPushOpenedEvent: payload");
    expect(result.contents).toContain("completionHandler()");
  });

  it("injects willPresentNotification for foreground pushReceived", () => {
    expect(WILL_PRESENT_NOTIFICATION_OBJCPP).toContain(
      "willPresentNotification",
    );
    expect(WILL_PRESENT_NOTIFICATION_OBJCPP).toContain(
      '@{@"payload": userInfo}',
    );
    expect(WILL_PRESENT_NOTIFICATION_OBJCPP).toContain(
      "sendPushReceivedEvent: payload",
    );
    expect(WILL_PRESENT_NOTIFICATION_OBJCPP).toContain(
      "UNNotificationPresentationOptionAlert",
    );

    const result = addPushEmitterWillPresentNotification(SAMPLE_APP_DELEGATE);
    expect(result.didMerge).toBe(true);
    expect(result.contents).toContain("willPresentNotification");
    expect(result.contents).toContain("sendPushReceivedEvent: payload");
  });
});

describe("Android MainActivity handlePushOpened wiring", () => {
  const SAMPLE_MAIN_ACTIVITY = `
package com.example

import expo.modules.ReactActivityDelegateWrapper
import com.facebook.react.ReactActivity

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
  }
}
`;

  it("imports RN VibesPushReceiver and calls handlePushOpened", () => {
    const wired = wireMainActivityPushOpened(SAMPLE_MAIN_ACTIVITY);
    expect(wired).toContain(`import ${RN_PUSH_RECEIVER}`);
    expect(wired).toContain(
      "VibesPushReceiver.handlePushOpened(applicationContext, intent)",
    );
    expect(wired).toContain("super.onCreate(null)");
  });

  it("migrates legacy Expo VibesPushReceiver import to RN FQCN", () => {
    const legacy = SAMPLE_MAIN_ACTIVITY.replace(
      "import expo.modules.ReactActivityDelegateWrapper",
      "import expo.modules.ReactActivityDelegateWrapper\nimport expo.modules.vibessdk.VibesPushReceiver",
    );
    const wired = wireMainActivityPushOpened(legacy);
    expect(wired).not.toContain("expo.modules.vibessdk.VibesPushReceiver");
    expect(wired).toContain(`import ${RN_PUSH_RECEIVER}`);
  });

  it("is idempotent when handlePushOpened is already present", () => {
    const once = wireMainActivityPushOpened(SAMPLE_MAIN_ACTIVITY);
    const twice = wireMainActivityPushOpened(once);
    expect(twice).toBe(once);
    expect(
      (twice.match(/handlePushOpened/g) || []).length,
    ).toBe(1);
  });
});
