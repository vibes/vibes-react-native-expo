import {
  mockInboxMessage,
  mockVibesNativeModule,
  resetMockVibesNativeModule,
} from "./mocks/vibesNativeModule";

import * as ExpoVibesSDK from "..";
import ExpoVibesSDKDefault from "..";

describe("vibes-react-native-expo API parity (via vibes-react-native)", () => {
  beforeEach(() => {
    resetMockVibesNativeModule();
  });

  describe("export surface", () => {
    it("exposes the named methods that were on the pre-consolidation Expo module", () => {
      const expectedMethods = [
        "getSDKVersion",
        "registerDevice",
        "unregisterDevice",
        "registerPush",
        "unregisterPush",
        "associatePerson",
        "updateDevice",
        "getPerson",
        "fetchInboxMessages",
        "fetchInboxMessage",
        "markInboxMessageAsRead",
        "expireInboxMessage",
        "onInboxMessageOpen",
        "onInboxMessagesFetched",
        "getVibesDeviceInfo",
        "requestNotificationPermissions",
      ] as const;

      for (const method of expectedMethods) {
        expect(typeof ExpoVibesSDK[method]).toBe("function");
      }
    });

    it("supports default-export style calls used by the pre-consolidation Expo SDK", () => {
      expect(ExpoVibesSDKDefault).toBeDefined();
      expect(typeof ExpoVibesSDKDefault.registerDevice).toBe("function");
      expect(typeof ExpoVibesSDKDefault.getSDKVersion).toBe("function");
      expect(typeof ExpoVibesSDKDefault.getVibesDeviceInfo).toBe("function");
    });
  });

  describe("device and push APIs", () => {
    it("getSDKVersion returns a version string", async () => {
      await expect(ExpoVibesSDK.getSDKVersion()).resolves.toBe("1.2.0");
      expect(mockVibesNativeModule.getSDKVersion).toHaveBeenCalledTimes(1);
    });

    it("registerDevice returns device info with device_id", async () => {
      const result = await ExpoVibesSDK.registerDevice();
      expect(result).toEqual({ device_id: "device-123" });
      expect(mockVibesNativeModule.registerDevice).toHaveBeenCalledTimes(1);
    });

    it("unregisterDevice completes successfully", async () => {
      await expect(ExpoVibesSDK.unregisterDevice()).resolves.toBeUndefined();
      expect(mockVibesNativeModule.unregisterDevice).toHaveBeenCalledTimes(1);
    });

    it("registerPush completes successfully", async () => {
      await expect(ExpoVibesSDK.registerPush()).resolves.toBeUndefined();
      expect(mockVibesNativeModule.registerPush).toHaveBeenCalledTimes(1);
    });

    it("unregisterPush completes successfully", async () => {
      await expect(ExpoVibesSDK.unregisterPush()).resolves.toBeUndefined();
      expect(mockVibesNativeModule.unregisterPush).toHaveBeenCalledTimes(1);
    });

    it("getVibesDeviceInfo returns device_id and push_token", async () => {
      const info = await ExpoVibesSDK.getVibesDeviceInfo();
      expect(info).toMatchObject({
        device_id: "device-123",
        push_token: "push-token-abc",
      });
    });

    it("updateDevice forwards credentials and coordinates", async () => {
      await ExpoVibesSDK.updateDevice(false, 41.88, -87.63);
      expect(mockVibesNativeModule.updateDevice).toHaveBeenCalledWith(
        false,
        41.88,
        -87.63
      );
    });
  });

  describe("person APIs", () => {
    it("associatePerson returns association status", async () => {
      const result = await ExpoVibesSDK.associatePerson("ext-person-1");
      expect(result).toEqual({
        externalPersonId: "ext-person-1",
        status: "success",
      });
      expect(mockVibesNativeModule.associatePerson).toHaveBeenCalledWith(
        "ext-person-1"
      );
    });

    it("getPerson returns person_key and external_person_id", async () => {
      const person = await ExpoVibesSDK.getPerson();
      expect(person).toMatchObject({
        person_key: "person-key-1",
        external_person_id: "ext-1",
      });
    });
  });

  describe("inbox APIs", () => {
    it("fetchInboxMessages returns messages with RN inbox fields", async () => {
      const messages = await ExpoVibesSDK.fetchInboxMessages();
      expect(messages).toHaveLength(1);
      expect(messages[0]).toMatchObject({
        message_uid: "msg-1",
        subject: "Hello",
        content: "World",
        read: false,
        inbox_custom_data: { key: "value" },
      });
    });

    it("fetchInboxMessage returns a single message by id", async () => {
      const message = await ExpoVibesSDK.fetchInboxMessage("msg-42");
      expect(message.message_uid).toBe("msg-42");
      expect(mockVibesNativeModule.fetchInboxMessage).toHaveBeenCalledWith(
        "msg-42"
      );
    });

    it("markInboxMessageAsRead returns an updated message", async () => {
      const message = await ExpoVibesSDK.markInboxMessageAsRead("msg-1");
      expect(message.read).toBe(true);
      expect(mockVibesNativeModule.markInboxMessageAsRead).toHaveBeenCalledWith(
        "msg-1"
      );
    });

    it("expireInboxMessage returns an updated message", async () => {
      const message = await ExpoVibesSDK.expireInboxMessage("msg-1");
      expect(message.message_uid).toBe("msg-1");
      expect(mockVibesNativeModule.expireInboxMessage).toHaveBeenCalledWith(
        "msg-1"
      );
    });

    it("onInboxMessageOpen forwards a full InboxMessage object", async () => {
      await ExpoVibesSDK.onInboxMessageOpen(mockInboxMessage);
      expect(mockVibesNativeModule.onInboxMessageOpen).toHaveBeenCalledWith(
        mockInboxMessage
      );
    });

    it("onInboxMessagesFetched completes successfully", async () => {
      await expect(ExpoVibesSDK.onInboxMessagesFetched()).resolves.toBeUndefined();
      expect(mockVibesNativeModule.onInboxMessagesFetched).toHaveBeenCalledTimes(
        1
      );
    });
  });

  describe("notification helpers used by the Expo example app", () => {
    const { PermissionsAndroid, Platform } = require("react-native");

    afterEach(() => {
      jest.restoreAllMocks();
      Platform.OS = "ios";
      Platform.Version = 33;
    });

    it("requestNotificationPermissions on iOS delegates to native", async () => {
      Platform.OS = "ios";
      await ExpoVibesSDK.requestNotificationPermissions();
      expect(
        mockVibesNativeModule.requestNotificationPermissions
      ).toHaveBeenCalledTimes(1);
    });

    it("requestNotificationPermissions on Android uses PermissionsAndroid", async () => {
      Platform.OS = "android";
      Platform.Version = 33;
      PermissionsAndroid.request.mockClear();
      mockVibesNativeModule.requestNotificationPermissions.mockClear();

      await ExpoVibesSDK.requestNotificationPermissions();

      expect(PermissionsAndroid.request).toHaveBeenCalledWith(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      expect(
        mockVibesNativeModule.requestNotificationPermissions
      ).not.toHaveBeenCalled();
    });
  });

  describe("default export parity with pre-consolidation ExpoVibesSDK usage", () => {
    it("default.registerDevice reaches the RN native module", async () => {
      await ExpoVibesSDKDefault.registerDevice();
      expect(mockVibesNativeModule.registerDevice).toHaveBeenCalledTimes(1);
    });

    it("default.getVibesDeviceInfo reaches the RN native module", async () => {
      const info = await ExpoVibesSDKDefault.getVibesDeviceInfo();
      expect(info.device_id).toBe("device-123");
    });
  });
});
