import ExpoModulesCore
import VibesPush
import UserNotifications
import UIKit
import ObjectiveC.runtime

public class ExpoVibesSDKModule: Module, VibesAPIDelegate {
  
  public static var lastDeviceToken: String? = nil
  
  // Static method to be called from AppDelegate
  @objc public static func setLastDeviceToken(_ token: String) {
    lastDeviceToken = token
    print("🔑 [PUSH_TOKEN] APNs Device Token: \(token)")
  }
  
  // MARK: - Logging Helper
  private func logPushNotification(_ message: String, type: String = "INFO") {
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
    let timestamp = formatter.string(from: Date())
    print("🔔 [PUSH_\(type)] [\(timestamp)] \(message)")
  }
  
  private func logDeviceInfo() {
    let device = UIDevice.current
    let systemVersion = device.systemVersion
    let model = device.model
    let name = device.name
    
    logPushNotification("Device Info - Model: \(model), iOS: \(systemVersion), Name: \(name)")
  }
  
  private func logNotificationSettings() {
    let center = UNUserNotificationCenter.current()
    center.getNotificationSettings { settings in
      self.logPushNotification("Notification Settings - Authorization: \(settings.authorizationStatus.rawValue)")
      self.logPushNotification("Notification Settings - Alert: \(settings.alertSetting.rawValue)")
      self.logPushNotification("Notification Settings - Sound: \(settings.soundSetting.rawValue)")
      self.logPushNotification("Notification Settings - Badge: \(settings.badgeSetting.rawValue)")
    }
  }
  public func definition() -> ModuleDefinition {
    Name("ExpoVibesSDK")

    OnCreate {
    }

    let vibes: Vibes = VibesClient.standard.vibes
    var vibesDeviceId: String = ""

    Constants([
      "SDKBuildVersion": "4.12.0",
    ])

    let userDefaults = UserDefaults.standard

    Events("onChangeRegisterDevice")

    /// Register Device
    AsyncFunction("registerDevice") {
      logPushNotification("=== DEVICE REGISTRATION START ===")
      logDeviceInfo()
      logNotificationSettings()
      
      if vibes.isDeviceRegistered(),
        let deviceId = userDefaults.string(forKey: "vibesDeviceId")
      {
        vibesDeviceId = deviceId
        logPushNotification("Device already registered with ID: \(deviceId)")
      } else {
        logPushNotification("Device not registered, proceeding with registration")
      }
      
      logPushNotification("Calling vibes.registerDevice()")
      vibes.registerDevice()
      logPushNotification("=== DEVICE REGISTRATION END ===")
    }

    /// Un-register Device
    AsyncFunction("unregisterDevice") {
      vibes.unregisterDevice()
    }

    /// Register Push
    AsyncFunction("registerPush") {
      logPushNotification("=== PUSH REGISTRATION START ===")
      logNotificationSettings()
      
      if vibes.isDeviceRegistered() {
        logPushNotification("Device is registered, proceeding with push registration")
        vibes.registerPush()
        logPushNotification("Push registration initiated (no callback)")
      } else {
        logPushNotification("ERROR: Device Not Registered - \(VibesError.noCredentials)", type: "ERROR")
        print(
          "REGISTER_PUSH_ERROR",
          "Device Not Registered: \(VibesError.noCredentials)")
      }
      logPushNotification("=== PUSH REGISTRATION END ===")
    }

    /// Un-register Push
    AsyncFunction("unregisterPush") {
      if vibes.isDevicePushRegistered() {
        vibes.unregisterPush()
      } else {
        print(
          "UNREGISTER_PUSH_ERROR",
          "Push Not Registered: \(VibesError.noPushToken)")
      }
    }

    /// Associate device to person
    /// - Parameters:
    ///   - externalPersonId: External person ID
    AsyncFunction("associatePerson") { (externalPersonId: String) in
      vibes.associatePerson(externalPersonId: externalPersonId)
    }

    /// Update device
    /// - Parameters:
    ///   - updateCredentials: a boolean indicating if it's a token update or device info update. Specify false if not certain
    ///   - lat: Latitude
    ///   - lon: Longitude
    AsyncFunction("updateDevice") {
      (updateCredentials: Bool, lat: Double, lon: Double) in
      vibes.updateDevice(
        lat: lat as NSNumber, long: lon as NSNumber,
        updateCredentials: updateCredentials)
    }

    Events("onGetPerson")

    /// Get Person Info
    AsyncFunction("getPerson") {
      vibes.getPerson { (person, error) in
        guard error == nil else {
          print("GET_PERSON_ERROR", error!)
          return
        }
        self.sendEvent("onGetPerson", ["person": person ?? NSNull()])
      }
    }

    Events("onFetchInboxMessages")

    /// Fetch Inbox Messages
    AsyncFunction("fetchInboxMessages") {
      vibes.fetchInboxMessages { messages, error in
        if let error = error {
          print("There was an error fetching messages: \(error)")
        }
        self.sendEvent("onFetchInboxMessages", ["messages": messages])
      }
    }

    Events("onFetchInboxMessage")

    /// Fetch single Inbox Message
    ///
    /// - Parameters:
    ///   - messageUid: The Message ID
    AsyncFunction("fetchInboxMessage") { messageUID in
      vibes.fetchInboxMessage(messageUID: messageUID) { message, error in
        guard error == nil else {
          return
        }
        self.sendEvent("onFetchInboxMessage", ["message": message])
      }
    }

    Events("onMarkInboxMessageAsRead")

    /// Mark Inbox Message as Read
    ///
    /// - Parameters:
    ///   - messageUid: The Message ID
    AsyncFunction("markInboxMessageAsRead") { messageUID in
      vibes.markInboxMessageAsRead(messageUID: messageUID) { messages, error in
        guard error == nil else {
          return
        }
        self.sendEvent("onMarkInboxMessageAsRead", ["messages": messages])
      }
    }

    Events("onExpireInboxMessage")

    /// Expire Inbox Message
    ///
    /// - Parameters:
    ///   - messageUid: The Message ID
    AsyncFunction("expireInboxMessage") { messageUID in
      vibes.expireInboxMessage(messageUID: messageUID) { messages, error in
        guard error == nil else {
          return
        }
        self.sendEvent("onExpireInboxMessage", ["messages": messages])
      }
    }
    
    Events("onInboxMessageOpenEvent")

    ///  Inbox Message Opened
    ///
    /// - Parameters:
    ///   - message: The Inbox Message
    AsyncFunction("onInboxMessageOpen") { (message: [String: Any]) in
      guard let inboxMessage = InboxMessage(attributes: message) else {
        print("INBOX_MESSAGE_OPEN_ERROR: Could not create Inbox Message from payload")
        return
      }
      vibes.onInboxMessageOpen(inboxMessage: inboxMessage)
      
      self.sendEvent("onInboxMessageOpenEvent", ["message": "Success"])
    }
    
    Events("onInboxMessagesFetchedEvent")
    
    ///  Inbox Messages Fetched
    AsyncFunction("onInboxMessagesFetched") {
      vibes.onInboxMessagesFetched()
      self.sendEvent("onInboxMessagesFetchedEvent", ["message": "Success"])
    }

    Events("onChange")

    AsyncFunction("setValueAsync") { (value: String) in
      self.sendEvent(
        "onChange",
        [
          "value": value
        ])
    }

    /// Get push token status
    AsyncFunction("getPushTokenStatus") {
      logPushNotification("=== PUSH TOKEN STATUS CHECK ===")
      
      // Check if device is registered for push
      let isPushRegistered = vibes.isDevicePushRegistered()
      logPushNotification("Device push registered: \(isPushRegistered)")
      
      // Check notification settings
      let center = UNUserNotificationCenter.current()
      center.getNotificationSettings { settings in
        self.logPushNotification("Authorization status: \(settings.authorizationStatus.rawValue)")
        self.logPushNotification("Alert setting: \(settings.alertSetting.rawValue)")
        self.logPushNotification("Sound setting: \(settings.soundSetting.rawValue)")
        self.logPushNotification("Badge setting: \(settings.badgeSetting.rawValue)")
      }
      
      // Check if app is registered for remote notifications (must be on main thread)
      var isRegisteredForRemoteNotifications = false
      if Thread.isMainThread {
        isRegisteredForRemoteNotifications = UIApplication.shared.isRegisteredForRemoteNotifications
      } else {
        DispatchQueue.main.sync {
          isRegisteredForRemoteNotifications = UIApplication.shared.isRegisteredForRemoteNotifications
        }
      }
      logPushNotification("App registered for remote notifications: \(isRegisteredForRemoteNotifications)")
      
      // Return status object
      return [
        "isPushRegistered": isPushRegistered,
        "isRegisteredForRemoteNotifications": isRegisteredForRemoteNotifications
      ]
    }

    /// Request notification permissions
    AsyncFunction("requestNotificationPermissions") {
      logPushNotification("=== NOTIFICATION PERMISSIONS REQUEST START ===")
      let center = UNUserNotificationCenter.current()
      
      center.getNotificationSettings { settings in
        self.logPushNotification("Current authorization status: \(settings.authorizationStatus.rawValue)")
        
        switch settings.authorizationStatus {
        case .notDetermined:
          self.logPushNotification("Status: Not Determined - Requesting permissions")
          center.requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if granted {
              self.logPushNotification("SUCCESS: Notification permissions granted", type: "SUCCESS")
              print("Notification permissions granted")
              DispatchQueue.main.async {
                self.logPushNotification("Registering for remote notifications")
                UIApplication.shared.registerForRemoteNotifications()
              }
            } else {
              self.logPushNotification("ERROR: Notification permissions denied - \(error?.localizedDescription ?? "Unknown error")", type: "ERROR")
              print("Notification permissions denied: \(error?.localizedDescription ?? "Unknown error")")
            }
          }
        case .denied:
          self.logPushNotification("Status: Denied - User previously denied permissions", type: "WARNING")
          print("Notification permissions previously denied")
        case .authorized:
          self.logPushNotification("Status: Authorized - Permissions already granted", type: "SUCCESS")
          print("Notification permissions already granted")
        case .provisional:
          print("Notification permissions provisionally granted")
        case .ephemeral:
          print("Notification permissions ephemerally granted")
        @unknown default:
          print("Unknown notification authorization status")
        }
      }
    }

    AsyncFunction("getLastDeviceToken") {
      return ExpoVibesSDKModule.lastDeviceToken
    }

    /// Get Vibes device info
    AsyncFunction("getVibesDeviceInfo") {
      logPushNotification("=== GET VIBES DEVICE INFO ===")
      
      let userDefaults = UserDefaults.standard
      let deviceInfo: [String: Any] = [
        "device_id": userDefaults.string(forKey: "vibesDeviceId") ?? "",
        "push_token": ExpoVibesSDKModule.lastDeviceToken ?? "",
        "latitude": "",
        "longitude": ""
      ]
      
      logPushNotification("Device info: \(deviceInfo)")
      return deviceInfo
    }

    /// Initialize Vibes SDK
    AsyncFunction("initializeVibes") {
      logPushNotification("=== INITIALIZE VIBES SDK ===")
      // Vibes is already initialized in VibesClient
      logPushNotification("Vibes SDK already initialized")
      return "Vibes SDK initialized"
    }

    /// Get SDK version
    AsyncFunction("getSDKVersion") {
      return "4.12.0"
    }

  }

  public func didRegisterDevice(deviceId: String?, error: Error?) {
    logPushNotification("=== VIBES DELEGATE: didRegisterDevice ===")
    
    if let error = error {
      logPushNotification("ERROR: Device registration failed - \(error.localizedDescription)", type: "ERROR")
      print(
        "There was an error registering the device: \(String(describing: error))"
      )
      return
    }
    
    if let deviceId = deviceId {
      UserDefaults.standard.set(deviceId, forKey: "vibesDeviceId")
      logPushNotification("SUCCESS: Device registered with ID: \(deviceId)", type: "SUCCESS")
      print("Device registered with ID: \(deviceId)")
    } else {
      logPushNotification("WARNING: Device registration completed but no device ID received", type: "WARNING")
    }
    logPushNotification("=== VIBES DELEGATE: didRegisterDevice END ===")
  }
}

// MARK: - APNs Device Token Logging
extension UIResponder {
  @objc
  open func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    let tokenParts = deviceToken.map { data in String(format: "%02.2hhx", data) }
    let token = tokenParts.joined()
    print("🔑 [PUSH_TOKEN] APNs Device Token: \(token)")
    ExpoVibesSDKModule.lastDeviceToken = token
  }

  @objc
  open func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    print("❌ [PUSH_TOKEN] Failed to register for remote notifications: \(error.localizedDescription)")
  }
}
