//
//  VibesManager.swift
//  Pods
//
//  Created by Dawid Zawada on 01/07/2025.
//
import VibesPush

public class VibesManager: VibesAPIDelegate {
    
    public func registerDevice() {
        print("[VIBES] starting device registration")
        Vibes.shared.registerDevice()
    }
    
    public func registerPush() {

        print("[VIBES] starting push registrationzzzz", Vibes.shared.isDeviceRegistered())
        print("[VIBES] Was device registered? \(Vibes.shared.isDeviceRegistered())")
        Vibes.shared.registerPush()
    }
    
    public func didRegisterDevice(deviceId: String?, error: (any Error)?) {
        print("[VIBES] didRegisterDevice")
        if error != nil {
            print("[VIBES] Register device error")
            print(error)
        }else{
            print("[VIBES] Registered device, id: \(deviceId)")
        }
    }
    
    public func didRegisterPush(error: (any Error)?) {
        print("[VIBES] didRegisterPush")
        if error != nil {
            print("[VIBES] Register push error")
            print(error)
        } else {
            print("[VIBES] Registered push!")
        }
    }
}
