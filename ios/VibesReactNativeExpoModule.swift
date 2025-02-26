import ExpoModulesCore
import VibesPush

public class VibesReactNativeExpoModule: Module, VibesAPIDelegate {
  public func definition() -> ModuleDefinition {
    Name("VibesReactNativeExpo")

    let vibes: Vibes = VibesClient.standard.vibes
    var vibesDeviceId: String = ""

    Constants([
      "SDKBuildVersion": Vibes.SDK_VERSION,
    ])

    let userDefaults = UserDefaults.standard

    Events("onChangeRegisterDevice")

    /// Register Device
    Function("registerDevice") {
      if vibes.isDeviceRegistered(),
        let deviceId = userDefaults.string(forKey: "vibesDeviceId")
      {
        vibesDeviceId = deviceId
      }
      vibes.registerDevice()
    }

    /// Un-register Device
    Function("unregisterDevice") {
      vibes.unregisterDevice()
    }

    /// Register Push
    Function("registerPush") {
      if vibes.isDeviceRegistered() {
        vibes.registerPush()
      } else {
        print(
          "REGISTER_PUSH_ERROR",
          "Device Not Registered: \(VibesError.noCredentials)")
      }
    }

    /// Un-register Push
    Function("unregisterPush") {
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
    Function("associatePerson") { (externalPersonId: String) in
      vibes.associatePerson(externalPersonId: externalPersonId)
    }

    /// Update device
    /// - Parameters:
    ///   - updateCredentials: a boolean indicating if it's a token update or device info update. Specify false if not certain
    ///   - lat: Latitude
    ///   - lon: Longitude
    Function("updateDevice") {
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
    AsyncFunction("onInboxMessageOpen") { message in
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

  }

  public func didRegisterDevice(deviceId: String?, error: Error?) {
    guard error != nil else {
      print(
        "There was an error registering the device: \(String(describing: error))"
      )
      return
    }
    if let deviceId = deviceId {
      UserDefaults.standard.set(deviceId, forKey: "vibesDeviceId")
      print("Device registered with ID: \(deviceId)")
    }
  }
}
