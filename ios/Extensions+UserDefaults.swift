//
//  Extensions+UserDefaults.swift
//  Vibes
//
//  Created by Clement  Wekesa on 2/26/25.
//

// MARK: - UserDefaults helpers
extension UserDefaults {
  
  /// The vibes device id, if stored in this UserDefaults, else nil
  public var vibesDeviceId: String? {
    return self.string(forKey: "vibesDeviceId")
  }
  
}
