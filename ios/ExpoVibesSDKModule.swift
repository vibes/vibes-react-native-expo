import ExpoModulesCore
import VibesPush
import UserNotifications
import UIKit
import ObjectiveC.runtime

public class ExpoVibesSDKModule: Module, VibesAPIDelegate {
  
  public static var lastDeviceToken: String? = nil
  
  // Properties for promise handling
  private var associatePersonPromise: Promise?
  private var currentExternalPersonId: String?
  private var pendingRegisterDevicePromise: Promise?
  private var pendingRegisterPushPromise: Promise?
  

  
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
    
          self.logPushNotification("Device Info - Model: \(model), iOS: \(systemVersion), Name: \(name)")
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

    let vibes: Vibes = VibesClient.standard.vibes
    var vibesDeviceId: String = ""

    OnCreate {
      // Set delegate for vibes to receive callbacks
      print("=== ONCREATE: Setting vibes delegate ===")
      vibes.set(delegate: self)
      print("=== ONCREATE: Vibes delegate set: \(vibes.delegate != nil) ===")
    }

    Constants([
      "SDKBuildVersion": "0.3.16",
    ])

    let userDefaults = UserDefaults.standard

    Events("onChangeRegisterDevice")

    /// Register Device
    AsyncFunction("registerDevice") { (promise: Promise) in
      self.logPushNotification("=== DEVICE REGISTRATION START ===")
      
      logDeviceInfo()
      logNotificationSettings()
      
      if vibes.isDeviceRegistered(),
        let deviceId = userDefaults.string(forKey: "vibesDeviceId")
      {
        vibesDeviceId = deviceId
        self.logPushNotification("Device already registered with ID: \(deviceId)")
        promise.resolve(deviceId)
      } else {
        self.logPushNotification("Device not registered, proceeding with registration")
        
        self.logPushNotification("Calling vibes.registerDevice()")
        vibes.registerDevice()
        
        // Store the promise to resolve when didRegisterDevice delegate is called
        self.pendingRegisterDevicePromise = promise
      }
      self.logPushNotification("=== DEVICE REGISTRATION END ===")
    }

    /// Un-register Device
    AsyncFunction("unregisterDevice") { (promise: Promise) in
      vibes.unregisterDevice()
      // For unregisterDevice, we resolve immediately since it's a synchronous operation
      promise.resolve("Device unregistered")
    }

    /// Register Push
    AsyncFunction("registerPush") { (promise: Promise) in
      self.logPushNotification("=== PUSH REGISTRATION START ===")
      
      logNotificationSettings()
      
      if vibes.isDeviceRegistered() {
        self.logPushNotification("Device is registered, proceeding with push registration")
        
        vibes.registerPush()
        
        // Store the promise to resolve when didRegisterPush delegate is called
        self.pendingRegisterPushPromise = promise
      } else {
        self.logPushNotification("ERROR: Device Not Registered - \(VibesError.noCredentials)", type: "ERROR")
        print("REGISTER_PUSH_ERROR", "Device Not Registered: \(VibesError.noCredentials)")
        promise.reject("REGISTER_PUSH_ERROR", "Device Not Registered: \(VibesError.noCredentials)")
      }
      self.logPushNotification("=== PUSH REGISTRATION END ===")
    }

    /// Un-register Push
    AsyncFunction("unregisterPush") { (promise: Promise) in
      if vibes.isDevicePushRegistered() {
        vibes.unregisterPush()
        // For unregisterPush, we resolve immediately since it's a synchronous operation
        promise.resolve("Push unregistered")
      } else {
        self.logPushNotification("ERROR: Push Not Registered - \(VibesError.noPushToken)", type: "ERROR")
        print("UNREGISTER_PUSH_ERROR", "Push Not Registered: \(VibesError.noPushToken)")
        promise.reject("UNREGISTER_PUSH_ERROR", "Push Not Registered: \(VibesError.noPushToken)")
      }
    }

    Events("onGetPerson")

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

    /// Get Person Info
    AsyncFunction("getPerson") { (promise: Promise) in
      print("=== GET PERSON CALLED ===")
      vibes.getPerson { (person, error) in
        print("=== GET PERSON CALLBACK ===")
        print("Person: \(String(describing: person))")
        print("Error: \(String(describing: error))")
        
        if let error = error {
          self.logPushNotification("ERROR: Person retrieval failed - \(error.localizedDescription)", type: "ERROR")
          print("GET_PERSON_ERROR", error)
          promise.reject("GET_PERSON_ERROR", error.localizedDescription)
          return
        }
        
        if let person = person {
          let personInfo = [
            "personKey": person.personKey ?? "",
            "externalPersonId": person.externalPersonId ?? "",
            "mdn": person.mdn ?? ""
          ]
          self.logPushNotification("SUCCESS: Person retrieved successfully", type: "SUCCESS")
          print("Person info resolved: \(personInfo)")
          self.sendEvent("onGetPerson", ["person": personInfo])
          promise.resolve(personInfo)
        } else {
          self.logPushNotification("WARNING: No person data available", type: "WARNING")
          print("No person data available")
          promise.reject("GET_PERSON_ERROR", "No person data available")
        }
      }
    }

    Events("onFetchInboxMessages")

    /// Fetch Inbox Messages
    AsyncFunction("fetchInboxMessages") { (promise: Promise) in
      vibes.fetchInboxMessages { messages, error in
        if let error = error {
          print("There was an error fetching messages: \(error)")
          promise.reject("FETCH_INBOX_MESSAGES_ERROR", error.localizedDescription)
          return
        }
        
        // Map messages to the expected format
        let mappedMessages = messages.map { message in
          return [
            "id": message.messageUID ?? "",
            "title": message.subject ?? "",
            "body": message.content ?? "",
            "read": message.read,
            "expired": (message.expiresAt?.compare(Date()) == .orderedAscending) ?? false
          ]
        }
        
        self.sendEvent("onFetchInboxMessages", ["messages": mappedMessages])
        promise.resolve(mappedMessages)
      }
    }

    Events("onFetchInboxMessage")

    /// Fetch single Inbox Message
    ///
    /// - Parameters:
    ///   - messageUid: The Message ID
    AsyncFunction("fetchInboxMessage") { (messageUID: String, promise: Promise) in
      vibes.fetchInboxMessage(messageUID: messageUID) { message, error in
        guard error == nil, let message = message else {
          promise.reject("FETCH_INBOX_MESSAGE_ERROR", error?.localizedDescription ?? "Message not found")
          return
        }
        
        let mappedMessage = [
          "id": message.messageUID ?? "",
          "title": message.subject ?? "",
          "body": message.content ?? "",
          "read": message.read,
                      "expired": (message.expiresAt?.compare(Date()) == .orderedAscending) ?? false
        ]
        
        self.sendEvent("onFetchInboxMessage", ["message": mappedMessage])
        promise.resolve(mappedMessage)
      }
    }

    Events("onMarkInboxMessageAsRead")

    /// Mark Inbox Message as Read
    ///
    /// - Parameters:
    ///   - messageUid: The Message ID
    AsyncFunction("markInboxMessageAsRead") { (messageUID: String, promise: Promise) in
      vibes.markInboxMessageAsRead(messageUID: messageUID) { message, error in
        guard error == nil else {
          promise.reject("MARK_MESSAGE_AS_READ_ERROR", error?.localizedDescription ?? "Error marking message as read")
          return
        }
        self.sendEvent("onMarkInboxMessageAsRead", ["messages": 1])
        promise.resolve("Message marked as read")
      }
    }

    Events("onExpireInboxMessage")

    /// Expire Inbox Message
    ///
    /// - Parameters:
    ///   - messageUid: The Message ID
    AsyncFunction("expireInboxMessage") { (messageUID: String, promise: Promise) in
      vibes.expireInboxMessage(messageUID: messageUID) { message, error in
        guard error == nil else {
          promise.reject("EXPIRE_MESSAGE_ERROR", error?.localizedDescription ?? "Error expiring message")
          return
        }
        self.sendEvent("onExpireInboxMessage", ["messages": 1])
        promise.resolve("Message expired")
      }
    }
    
    Events("onInboxMessageOpenEvent")

    ///  Inbox Message Opened
    ///
    /// - Parameters:
    ///   - messageId: The Message ID
    AsyncFunction("onInboxMessageOpen") { (messageId: String, promise: Promise) in
      vibes.fetchInboxMessage(messageUID: messageId) { message, error in
        guard error == nil, let message = message else {
          promise.reject("INBOX_MESSAGE_OPEN_ERROR", error?.localizedDescription ?? "Error tracking message open")
          return
        }
        vibes.onInboxMessageOpen(inboxMessage: message)
        self.sendEvent("onInboxMessageOpenEvent", ["message": "Success"])
        promise.resolve("Message open tracked")
      }
    }
    
    Events("onInboxMessagesFetchedEvent")
    
    ///  Inbox Messages Fetched
    AsyncFunction("onInboxMessagesFetched") { (promise: Promise) in
      vibes.onInboxMessagesFetched()
      self.sendEvent("onInboxMessagesFetchedEvent", ["message": "Success"])
      promise.resolve("Messages fetched event tracked")
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
      self.logPushNotification("=== PUSH TOKEN STATUS CHECK ===")
      
      // Check if device is registered for push
      let isPushRegistered = vibes.isDevicePushRegistered()
              self.logPushNotification("Device push registered: \(isPushRegistered)")
      
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
              self.logPushNotification("App registered for remote notifications: \(isRegisteredForRemoteNotifications)")
      
      // Return status object
      return [
        "isPushRegistered": isPushRegistered,
        "isRegisteredForRemoteNotifications": isRegisteredForRemoteNotifications
      ]
    }

    /// Request notification permissions
    AsyncFunction("requestNotificationPermissions") {
      self.logPushNotification("=== NOTIFICATION PERMISSIONS REQUEST START ===")
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
      self.logPushNotification("=== GET VIBES DEVICE INFO ===")
      
      let userDefaults = UserDefaults.standard
      let deviceId = userDefaults.string(forKey: "vibesDeviceId") ?? ""
      let isDeviceRegistered = vibes.isDeviceRegistered()
      let deviceInfo: [String: Any] = [
        "device_id": deviceId,
        "push_token": ExpoVibesSDKModule.lastDeviceToken ?? "",
        "is_registered": isDeviceRegistered,
        "is_push_registered": vibes.isDevicePushRegistered(),
        "latitude": "",
        "longitude": ""
      ]
      
      self.logPushNotification("Device info: \(deviceInfo)")
      return deviceInfo
    }

    /// Initialize Vibes SDK
    AsyncFunction("initializeVibes") {
      self.logPushNotification("=== INITIALIZE VIBES SDK ===")
      // Vibes is already initialized in VibesClient
              self.logPushNotification("Vibes SDK already initialized")
      return "Vibes SDK initialized"
    }

    /// Get SDK version
    AsyncFunction("getSDKVersion") {
      return "0.3.16"
    }

    Events("onAssociatePerson")

    /// Associate device to person
    /// - Parameters:
    ///   - externalPersonId: External person ID
    AsyncFunction("associatePerson") { (externalPersonId: String, promise: Promise) in
      print("=== ASSOCIATE PERSON CALLED ===")
      print("External Person ID: \(externalPersonId)")
      print("Vibes delegate set: \(vibes.delegate != nil)")
      

      
      // Store the promise to resolve later when delegate is called
      self.associatePersonPromise = promise
      self.currentExternalPersonId = externalPersonId
      
      print("Calling vibes.associatePerson...")
      vibes.associatePerson(externalPersonId: externalPersonId)
      print("vibes.associatePerson called")
    }

  }

  public func didRegisterDevice(deviceId: String?, error: Error?) {
    self.logPushNotification("=== VIBES DELEGATE: didRegisterDevice ===")
    
    if let error = error {
      self.logPushNotification("ERROR: Device registration failed - \(error.localizedDescription)", type: "ERROR")
      print(
        "There was an error registering the device: \(String(describing: error))"
      )
      

      
      pendingRegisterDevicePromise?.reject("DEVICE_REGISTRATION_ERROR", error.localizedDescription)
      pendingRegisterDevicePromise = nil
      return
    }
    
    if let deviceId = deviceId {
      UserDefaults.standard.set(deviceId, forKey: "vibesDeviceId")
      self.logPushNotification("SUCCESS: Device registered with ID: \(deviceId)", type: "SUCCESS")
      print("Device registered with ID: \(deviceId)")
      

      
      pendingRegisterDevicePromise?.resolve(deviceId)
      pendingRegisterDevicePromise = nil
    } else {
      self.logPushNotification("WARNING: Device registration completed but no device ID received", type: "WARNING")
      

      
      pendingRegisterDevicePromise?.reject("DEVICE_REGISTRATION_ERROR", "No device ID received")
      pendingRegisterDevicePromise = nil
    }
    self.logPushNotification("=== VIBES DELEGATE: didRegisterDevice END ===")
  }
  


  public func didAssociatePerson(error: Error?) {
    print("=== VIBES DELEGATE: didAssociatePerson CALLED ===")
    self.logPushNotification("=== VIBES DELEGATE: didAssociatePerson ===")
    
    if let error = error {
      print("ERROR: Person association failed - \(error.localizedDescription)")
      self.logPushNotification("ERROR: Person association failed - \(error.localizedDescription)", type: "ERROR")
      print("ASSOCIATE_PERSON_ERROR", error)
      associatePersonPromise?.reject("ASSOCIATE_PERSON_ERROR", error.localizedDescription)
    } else {
      let result = [
        "externalPersonId": currentExternalPersonId ?? "",
        "status": "success"
      ]
      print("SUCCESS: Person associated successfully")
      self.logPushNotification("SUCCESS: Person associated successfully", type: "SUCCESS")
      print("Person associated successfully: \(result)")
      sendEvent("onAssociatePerson", result)
      associatePersonPromise?.resolve(result)
    }
    
    // Clear the stored promise and person ID
    associatePersonPromise = nil
    currentExternalPersonId = nil
    
    print("=== VIBES DELEGATE: didAssociatePerson END ===")
    self.logPushNotification("=== VIBES DELEGATE: didAssociatePerson END ===")
  }
  
  public func didRegisterPush(error: Error?) {
    self.logPushNotification("=== VIBES DELEGATE: didRegisterPush ===")
    
    if let error = error {
      self.logPushNotification("ERROR: Push registration failed - \(error.localizedDescription)", type: "ERROR")
      print("ERROR: Push registration failed - \(error.localizedDescription)")
      // Resolve the pending promise with error
      pendingRegisterPushPromise?.reject("PUSH_REGISTRATION_ERROR", error.localizedDescription)
      pendingRegisterPushPromise = nil
    } else {
      self.logPushNotification("SUCCESS: Push registration successful", type: "SUCCESS")
      print("SUCCESS: Push registration successful")
      // Resolve the pending promise with success
      pendingRegisterPushPromise?.resolve("Push registration successful")
      pendingRegisterPushPromise = nil
    }
    
    self.logPushNotification("=== VIBES DELEGATE: didRegisterPush END ===")
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
    
    // Set device token in Vibes SDK
    Vibes.shared.setPushToken(fromData: deviceToken)
    print("🔑 [PUSH_TOKEN] Device token set in Vibes SDK")
  }

  @objc
  open func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    print("❌ [PUSH_TOKEN] Failed to register for remote notifications: \(error.localizedDescription)")
  }
}
