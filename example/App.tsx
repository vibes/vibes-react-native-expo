import ExpoVibesSDK from "vibes-react-native-expo";
import { Button, SafeAreaView, ScrollView, Text, View } from "react-native";
import { useState } from "react";
import React from "react";

export default function App() {
  const [sdkVersion, setSdkVersion] = useState<string>("");
  const [isLoadingSdkVersion, setIsLoadingSdkVersion] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [isLoadingDeviceInfo, setIsLoadingDeviceInfo] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState<string>("");
  const [isLoadingRegisterDevice, setIsLoadingRegisterDevice] = useState(false);
  const [pushStatus, setPushStatus] = useState<string>("");
  const [pushToken, setPushToken] = useState<string>("");
  const [isLoadingRegisterPush, setIsLoadingRegisterPush] = useState(false);
  const [isRegisteredForPush, setIsRegisteredForPush] = useState<boolean | null>(null);
  const [isDeviceRegistered, setIsDeviceRegistered] = useState<boolean | null>(null);
  const [isLoadingCheckStatus, setIsLoadingCheckStatus] = useState(false);
  const handleGetSDKVersion = async () => {
    try {
      setIsLoadingSdkVersion(true);
      const version = await ExpoVibesSDK.getSDKVersion();
      setSdkVersion(version);
      console.log("SDK Version:", version);
    } catch (e) {
      setSdkVersion("Error getting SDK version: " + String(e));
      console.log("Error getting SDK version:", e);
    } finally {
      setIsLoadingSdkVersion(false);
    }
  };

  const handleGetDeviceInfo = async () => {
    try {
      setIsLoadingDeviceInfo(true);
      const info = await ExpoVibesSDK.getVibesDeviceInfo();
      setDeviceInfo(info);
      console.log("Device Info:", info);
    } catch (e) {
      setDeviceInfo({ error: "Error getting device info: " + String(e) });
      console.log("Error getting device info:", e);
    } finally {
      setIsLoadingDeviceInfo(false);
    }
  };

  const handleRegisterDevice = async () => {
    try {
      setIsLoadingRegisterDevice(true);
      await ExpoVibesSDK.registerDevice();
      setDeviceStatus("Device registered successfully");
      console.log("Device registered successfully");
    } catch (e) {
      setDeviceStatus("Device registration failed: " + String(e));
      console.log("Device registration failed:", e);
    } finally {
      setIsLoadingRegisterDevice(false);
    }
  };

  const handleRegisterPush = async () => {
    try {
      setIsLoadingRegisterPush(true);
      await ExpoVibesSDK.registerPush();
      setPushStatus("Push registration successful");
      console.log("Push registration successful");
      
      // Get push token
      const deviceInfo = await ExpoVibesSDK.getVibesDeviceInfo();
      setPushToken(deviceInfo.push_token || "");
    } catch (e) {
      setPushStatus("Error registering push: " + String(e));
      console.log("Error registering push:", e);
    } finally {
      setIsLoadingRegisterPush(false);
    }
  };

  const handleCheckStatus = async () => {
    try {
      setIsLoadingCheckStatus(true);
      
      // Get device info which includes registration status
      const deviceInfo = await ExpoVibesSDK.getVibesDeviceInfo();
      
      // Use the actual registration status from Vibes SDK
      setIsDeviceRegistered(deviceInfo.is_registered);
      setIsRegisteredForPush(deviceInfo.is_push_registered);
      
      console.log("Status check completed", deviceInfo);
    } catch (e) {
      console.log("Error checking status:", e);
      setIsDeviceRegistered(false);
      setIsRegisteredForPush(false);
    } finally {
      setIsLoadingCheckStatus(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Vibes SDK Module API Example</Text>
        <Group name="SDK Information">
          <Button 
            title={isLoadingSdkVersion ? "Loading..." : "Get SDK Version"} 
            onPress={handleGetSDKVersion}
            disabled={isLoadingSdkVersion}
          />
          <Text style={styles.statusText}>SDK Version: {sdkVersion}</Text>
          <Button 
            title={isLoadingDeviceInfo ? "Loading..." : "Get Device Info"} 
            onPress={handleGetDeviceInfo}
            disabled={isLoadingDeviceInfo}
          />
          {deviceInfo && (
            <View style={styles.infoContainer}>
              <Text style={styles.infoTitle}>Device Info:</Text>
              <Text>Device ID: {deviceInfo.device_id || 'N/A'}</Text>
              <Text>Push Token: {deviceInfo.push_token || 'N/A'}</Text>
            </View>
          )}
        </Group>
        <Group name="Device Registration">
          <Button 
            title={isLoadingRegisterDevice ? "Loading..." : "Register Device"} 
            onPress={handleRegisterDevice}
            disabled={isLoadingRegisterDevice}
          />
          <Text style={styles.statusText}>Device Status: {deviceStatus}</Text>
        </Group>
        <Group name="Push Registration">
          <Button 
            title={isLoadingRegisterPush ? "Loading..." : "Register Push"} 
            onPress={handleRegisterPush}
            disabled={isLoadingRegisterPush}
          />
          <Text style={styles.statusText}>Push Status: {pushStatus}</Text>
          {pushToken && (
            <View style={styles.tokenContainer}>
              <Text style={styles.tokenTitle}>Push Token:</Text>
              <Text style={styles.tokenText}>{pushToken}</Text>
            </View>
          )}
        </Group>
        <Group name="Status Check">
          <Button 
            title={isLoadingCheckStatus ? "Loading..." : "Check Registration Status"} 
            onPress={handleCheckStatus}
            disabled={isLoadingCheckStatus}
          />
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Registration Status:</Text>
            <Text>Device Registered: {isDeviceRegistered === null ? "Unknown" : isDeviceRegistered ? "✅ Yes" : "❌ No"}</Text>
            <Text>Push Notifications: {isRegisteredForPush === null ? "Unknown" : isRegisteredForPush ? "✅ Yes" : "❌ No"}</Text>
          </View>
        </Group>

      </ScrollView>
    </SafeAreaView>
  );
}

function Group(props: { name: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupHeader}>{props.name}</Text>
      {React.Children.toArray(props.children)}
    </View>
  );
}

const styles = {
  header: {
    fontSize: 30,
    margin: 20,
    fontWeight: 'bold' as const,
  },
  groupHeader: {
    fontSize: 20,
    marginBottom: 20,
    fontWeight: 'bold' as const,
  },
  group: {
    margin: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  container: {
    flex: 1,
    backgroundColor: "#eee",
  },
  statusText: {
    marginTop: 10,
    marginBottom: 10,
    fontSize: 14,
    color: '#666',
  },
  infoContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  infoTitle: {
    fontWeight: 'bold' as const,
    marginBottom: 5,
  },
  tokenContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#e8f5e8',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  tokenTitle: {
    fontWeight: 'bold' as const,
    marginBottom: 5,
    color: '#2E7D32',
  },
  tokenText: {
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: '#f0f0f0',
    padding: 5,
    borderRadius: 3,
  },
  messageContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  messageTitle: {
    fontWeight: 'bold' as const,
    fontSize: 16,
    marginBottom: 5,
  },
  messageBody: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
  messageMeta: {
    fontSize: 12,
    color: '#999',
    marginBottom: 10,
  },
  messageActions: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    gap: 5,
  },
};
