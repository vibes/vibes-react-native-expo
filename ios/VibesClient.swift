//
//  VibesClient.swift
//  Vibes
//
//
import VibesPush
import UserNotifications

class VibesClient {
  static let standard = VibesClient()

  public let vibes: Vibes
  public var logger: VibesLogger? = VibesModuleLogger.shared
  


  private init() {
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
    print("🎯 [VIBES_INFO] [\(formatter.string(from: Date()))] === VIBES CLIENT INITIALIZATION START ===")
    
    // DEBUG: Check all keys in Info.plist
    print("🎯 [VIBES_DEBUG] [\(formatter.string(from: Date()))] === DEBUG INFO.PLIST KEYS ===")
    if let infoDict = Bundle.main.infoDictionary {
      print("🎯 [VIBES_DEBUG] [\(formatter.string(from: Date()))] Info.plist keys: \(infoDict.keys)")
      for (key, value) in infoDict {
        if key.contains("Vibes") || key.contains("vibes") {
          print("🎯 [VIBES_DEBUG] [\(formatter.string(from: Date()))] Vibes key '\(key)' = '\(value)'")
        }
      }
    } else {
      print("🎯 [VIBES_ERROR] [\(formatter.string(from: Date()))] ERROR: Cannot read Info.plist")
    }
    print("🎯 [VIBES_DEBUG] [\(formatter.string(from: Date()))] === END DEBUG INFO.PLIST KEYS ===")
    
    // ensure we have Vibes app url set in current build config's Info.plist
    guard let appUrl = Configuration.configValue(.vibesApiURL) else {
      print("🎯 [VIBES_ERROR] [\(formatter.string(from: Date()))] ERROR: Vibes API URL not found in Info.plist")
      print("🎯 [VIBES_ERROR] [\(formatter.string(from: Date()))] Looking for key: \(ConfigKey.vibesApiURL.value())")
      fatalError(
        "`\(ConfigKey.vibesApiURL.value())` must be set in plist file of current build configuration"
      )
    }
    print("🎯 [VIBES_INFO] [\(formatter.string(from: Date()))] Vibes API URL: \(appUrl)")
    
    // ensure we have Vibes app id set in current build config's Info.plist
    guard let appId = Configuration.configValue(.vibesAppId) else {
      print("🎯 [VIBES_ERROR] [\(formatter.string(from: Date()))] ERROR: Vibes App ID not found in Info.plist")
      print("🎯 [VIBES_ERROR] [\(formatter.string(from: Date()))] Looking for key: \(ConfigKey.vibesAppId.value())")
      fatalError(
        "`\(ConfigKey.vibesAppId.value())` must be set in plist file of current build configuration"
      )
    }
    print("🎯 [VIBES_INFO] [\(formatter.string(from: Date()))] Vibes App ID: \(appId)")
    
    // DEBUG: Check if appId is not empty
    if appId.isEmpty {
      print("🎯 [VIBES_ERROR] [\(formatter.string(from: Date()))] ERROR: Vibes App ID is empty string!")
      fatalError("Vibes App ID cannot be empty")
    }
    
    let config = VibesConfiguration(
      advertisingId: nil,
      apiUrl: appUrl,
      logger: logger,
      storageType: .USERDEFAULTS)

    print("🎯 [VIBES_INFO] [\(formatter.string(from: Date()))] Configuring Vibes SDK with appId: '\(appId)'")
    VibesPush.Vibes.configure(appId: appId, configuration: config)
    vibes = VibesPush.Vibes.shared
    print("🎯 [VIBES_INFO] [\(formatter.string(from: Date()))] Vibes SDK configured successfully")
    
    // Request notification permissions on app startup
    print("🎯 [VIBES_INFO] [\(formatter.string(from: Date()))] Requesting notification permissions on startup")
    requestNotificationPermissionsOnStartup()
    print("🎯 [VIBES_INFO] [\(formatter.string(from: Date()))] === VIBES CLIENT INITIALIZATION END ===")
  }
  
  private func requestNotificationPermissionsOnStartup() {
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
    print("🎯 [VIBES_INFO] [\(formatter.string(from: Date()))] === NOTIFICATION PERMISSIONS STARTUP START ===")
    let center = UNUserNotificationCenter.current()
    
    center.getNotificationSettings { settings in
      print("🎯 [VIBES_INFO] [\(formatter.string(from: Date()))] Startup - Authorization status: \(settings.authorizationStatus.rawValue)")
      print("🎯 [VIBES_INFO] [\(formatter.string(from: Date()))] Startup - Alert setting: \(settings.alertSetting.rawValue)")
      print("🎯 [VIBES_INFO] [\(formatter.string(from: Date()))] Startup - Sound setting: \(settings.soundSetting.rawValue)")
      print("🎯 [VIBES_INFO] [\(formatter.string(from: Date()))] Startup - Badge setting: \(settings.badgeSetting.rawValue)")
      
      switch settings.authorizationStatus {
      case .notDetermined:
        print("🎯 [VIBES_INFO] [\(formatter.string(from: Date()))] Startup - Status: Not Determined - Requesting permissions")
        center.requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
          if granted {
            print("🎯 [VIBES_SUCCESS] [\(formatter.string(from: Date()))] SUCCESS: Notification permissions granted on startup")
            print("Notification permissions granted on app startup")
            DispatchQueue.main.async {
              print("🎯 [VIBES_INFO] [\(formatter.string(from: Date()))] Startup - Registering for remote notifications")
              UIApplication.shared.registerForRemoteNotifications()
            }
          } else {
            print("🎯 [VIBES_ERROR] [\(formatter.string(from: Date()))] ERROR: Notification permissions denied on startup - \(error?.localizedDescription ?? "Unknown error")")
            print("Notification permissions denied on app startup: \(error?.localizedDescription ?? "Unknown error")")
          }
        }
      case .denied:
        print("🎯 [VIBES_WARNING] [\(formatter.string(from: Date()))] Startup - Status: Denied - User previously denied permissions")
        print("Notification permissions previously denied")
      case .authorized:
        print("🎯 [VIBES_SUCCESS] [\(formatter.string(from: Date()))] Startup - Status: Authorized - Permissions already granted")
        print("Notification permissions already granted")
      case .provisional:
        print("🎯 [VIBES_INFO] [\(formatter.string(from: Date()))] Startup - Status: Provisional - Permissions provisionally granted")
        print("Notification permissions provisionally granted")
      case .ephemeral:
        print("🎯 [VIBES_INFO] [\(formatter.string(from: Date()))] Startup - Status: Ephemeral - Permissions ephemerally granted")
        print("Notification permissions ephemerally granted")
      @unknown default:
        print("🎯 [VIBES_WARNING] [\(formatter.string(from: Date()))] Startup - Status: Unknown - \(settings.authorizationStatus.rawValue)")
        print("Unknown notification authorization status")
      }
      print("🎯 [VIBES_INFO] [\(formatter.string(from: Date()))] === NOTIFICATION PERMISSIONS STARTUP END ===")
    }
  }
}
