import ExpoModulesCore
import VibesPush

public class ExpoVibesSDKModule: Module {
    
    let manager = VibesManager()
    
  public func definition() -> ModuleDefinition {
    Name("ExpoVibesSDK")

    AsyncFunction("getSDKVersion") { (promise: Promise) in
        promise.resolve(Vibes.SDK_VERSION)
    }
      
      AsyncFunction("registerDevice") { (promise: Promise) in
          manager.registerDevice()
          promise.resolve(true)
      }
      
      AsyncFunction("registerPush") { (promise: Promise) in
          manager.registerPush()
          promise.resolve(true)
      }
    
  }
}
