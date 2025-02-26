//
//  VibesClient.swift
//  Vibes
//
//  Created by Clement Wekesa on 2/26/25.
//
import VibesPush

class VibesClient {
  static let standard = VibesClient()

  public let vibes: Vibes
  public var logger: VibesLogger? = VibesModuleLogger.shared

  private init() {
    // ensure we have Vibes app url set in current build config's Info.plist
    guard let appUrl = Configuration.configValue(.vibesApiURL) else {
      fatalError(
        "`\(ConfigKey.vibesApiURL.value())` must be set in plist file of current build configuration"
      )
    }
    // ensure we have Vibes app id set in current build config's Info.plist
    guard let appId = Configuration.configValue(.vibesAppId) else {
      fatalError(
        "`\(ConfigKey.vibesAppId.value())` must be set in plist file of current build configuration"
      )
    }
    let config = VibesConfiguration(
      advertisingId: nil,
      apiUrl: appUrl,
      logger: logger,
      storageType: .USERDEFAULTS)

    VibesPush.Vibes.configure(appId: appId, configuration: config)
    vibes = VibesPush.Vibes.shared
  }
}
