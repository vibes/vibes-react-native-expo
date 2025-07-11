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
  const [isLoadingRegisterPush, setIsLoadingRegisterPush] = useState(false);
  const [pushToken, setPushToken] = useState<string>("");

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
      const result = await ExpoVibesSDK.registerDevice();
      setDeviceStatus("Device registered successfully: " + result);
      console.log("Device registered successfully:", result);
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
      const result = await ExpoVibesSDK.registerPush();
      setPushStatus("Push registered successfully: " + result);
      console.log("registerPush result:", result);
      try {
        const deviceInfo = await ExpoVibesSDK.getVibesDeviceInfo();
        if (deviceInfo && deviceInfo.push_token) {
          setPushToken(deviceInfo.push_token);
        }
      } catch (deviceInfoError) {
        console.log("Error getting device info after push registration:", deviceInfoError);
      }
    } catch (e) {
      setPushStatus("Push registration failed: " + String(e));
      console.log("Push registration failed:", e);
    } finally {
      setIsLoadingRegisterPush(false);
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
};
