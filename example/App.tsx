import ExpoVibesSDK from "vibes-react-native-expo";
import { Button, SafeAreaView, ScrollView, Text, View, Alert } from "react-native";
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
  const [unregisterDeviceStatus, setUnregisterDeviceStatus] = useState<string>("");
  const [isLoadingUnregisterDevice, setIsLoadingUnregisterDevice] = useState(false);
  const [unregisterPushStatus, setUnregisterPushStatus] = useState<string>("");
  const [isLoadingUnregisterPush, setIsLoadingUnregisterPush] = useState(false);
  const [personInfo, setPersonInfo] = useState<any>(null);
  const [isLoadingPerson, setIsLoadingPerson] = useState(false);
  const [associatePersonStatus, setAssociatePersonStatus] = useState<string>("");
  const [isLoadingAssociatePerson, setIsLoadingAssociatePerson] = useState(false);
  const [apiDeviceInfo, setApiDeviceInfo] = useState<any>(null);
  const [isLoadingApiDeviceInfo, setIsLoadingApiDeviceInfo] = useState(false);
  const [externalPersonId, setExternalPersonId] = useState<string>("tedenwj");

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
      console.log("🔄 Fetching device info...");
      const info = await ExpoVibesSDK.getVibesDeviceInfo();
      setDeviceInfo(info);
      console.log("📱 Device Info:", info);
    } catch (e) {
      setDeviceInfo({ error: "Error getting device info: " + String(e) });
      console.log("❌ Error getting device info:", e);
    } finally {
      setIsLoadingDeviceInfo(false);
    }
  };

  const handleRegisterDevice = async () => {
    try {
      setIsLoadingRegisterDevice(true);
      console.log("🔄 Starting device registration...");
      await ExpoVibesSDK.registerDevice();
      setDeviceStatus("Device registered successfully");
      console.log("✅ Device registered successfully");
      
      // On iOS, registerPush() is called automatically in didRegisterDevice delegate
      // On Android, we need to call it manually
      // For now, we'll let the user call registerPush() separately
    } catch (e) {
      setDeviceStatus("Device registration failed: " + String(e));
      console.log("❌ Device registration failed:", e);
    } finally {
      setIsLoadingRegisterDevice(false);
    }
  };

  const handleRegisterPush = async () => {
    try {
      setIsLoadingRegisterPush(true);
      console.log("🔄 Starting push registration...");
      await ExpoVibesSDK.registerPush();
      setPushStatus("Push registration successful");
      console.log("✅ Push registration successful");
      
      // Get push token
      const deviceInfo = await ExpoVibesSDK.getVibesDeviceInfo();
      setPushToken(deviceInfo.push_token || "");
      console.log("📱 Push token obtained:", deviceInfo.push_token);
    } catch (e) {
      setPushStatus("Error registering push: " + String(e));
      console.log("❌ Error registering push:", e);
    } finally {
      setIsLoadingRegisterPush(false);
    }
  };

  const handleUnregisterDevice = async () => {
    try {
      setIsLoadingUnregisterDevice(true);
      console.log("🔄 Starting device unregistration...");
      const result = await ExpoVibesSDK.unregisterDevice();
      setUnregisterDeviceStatus("Device unregistered successfully");
      console.log("✅ Device unregistered successfully:", result);
      
      // Clear device info after unregistration
      setDeviceInfo(null);
      setDeviceStatus("");
    } catch (e) {
      setUnregisterDeviceStatus("Device unregistration failed: " + String(e));
      console.log("❌ Device unregistration failed:", e);
    } finally {
      setIsLoadingUnregisterDevice(false);
    }
  };

  const handleUnregisterPush = async () => {
    try {
      setIsLoadingUnregisterPush(true);
      console.log("🔄 Starting push unregistration...");
      const result = await ExpoVibesSDK.unregisterPush();
      setUnregisterPushStatus("Push unregistered successfully");
      console.log("✅ Push unregistered successfully:", result);
      
      // Clear push token after unregistration
      setPushToken("");
      setPushStatus("");
    } catch (e) {
      setUnregisterPushStatus("Push unregistration failed: " + String(e));
      console.log("❌ Push unregistration failed:", e);
    } finally {
      setIsLoadingUnregisterPush(false);
    }
  };

  const handleGetPerson = async () => {
    try {
      setIsLoadingPerson(true);
      console.log("🔄 Getting person info...");
      const result = await ExpoVibesSDK.getPerson();
      setPersonInfo(result);
      console.log("✅ Person info:", result);
    } catch (e) {
      setPersonInfo({ error: "Error getting person: " + String(e) });
      console.log("❌ Error getting person:", e);
    } finally {
      setIsLoadingPerson(false);
    }
  };

  const handleAssociatePerson = async () => {
    try {
      setIsLoadingAssociatePerson(true);
      console.log("🔄 Associating person with ID: " + externalPersonId + "...");
      const result = await ExpoVibesSDK.associatePerson(externalPersonId);
      setAssociatePersonStatus("Person associated successfully");
      console.log("✅ Person associated:", result);
    } catch (e) {
      setAssociatePersonStatus("Person association failed: " + String(e));
      console.log("❌ Person association failed:", e);
    } finally {
      setIsLoadingAssociatePerson(false);
    }
  };

  const handleCheckDeviceAssociations = async () => {
    try {
      setIsLoadingApiDeviceInfo(true);
      console.log("🔄 Checking device associations for:", externalPersonId);
      
      // Get device info from SDK first
      const localDeviceInfo = await ExpoVibesSDK.getVibesDeviceInfo();
      console.log("📱 Local device info:", localDeviceInfo);
      
      // Show alert with device info for manual API testing
      const deviceInfoText = `
Device ID: ${localDeviceInfo.device_id || 'N/A'}
Push Token: ${localDeviceInfo.push_token || 'N/A'}
External Person ID: ${externalPersonId}

API Call to test:
GET https://public-api-uatus0.vibescm.com/companies/wZVasTXH/people/external_person_id/${externalPersonId}/push-devices

Headers:
Authorization: Basic [base64(username:password)]
Content-Type: application/json
      `;
      
      Alert.alert(
        "Device Association Info",
        deviceInfoText,
        [
          {
            text: "Copy Device ID",
            onPress: () => {
              // You can add clipboard functionality here
              console.log("Device ID copied:", localDeviceInfo.device_id);
            }
          },
          {
            text: "Copy External Person ID",
            onPress: () => {
              console.log("External Person ID copied:", externalPersonId);
            }
          },
          {
            text: "OK",
            style: "default"
          }
        ]
      );
      
      setApiDeviceInfo({
        localDeviceInfo,
        externalPersonId,
        apiUrl: `https://public-api-uatus0.vibescm.com/companies/wZVasTXH/people/external_person_id/${externalPersonId}/push-devices`
      });
      
    } catch (e) {
      console.log("❌ Error checking device associations:", e);
      setApiDeviceInfo({ error: "Error checking device associations: " + String(e) });
    } finally {
      setIsLoadingApiDeviceInfo(false);
    }
  };

  const handleTestApiCall = async () => {
    try {
      setIsLoadingApiDeviceInfo(true);
      console.log("🔄 Testing API call...");
      
      // This is a mock API call - in real app you'd make actual HTTP request
      const mockApiResponse = {
        success: true,
        message: "API call would be made here",
        endpoint: `https://public-api-uatus0.vibescm.com/companies/wZVasTXH/people/external_person_id/${externalPersonId}/push-devices`,
        deviceInfo: await ExpoVibesSDK.getVibesDeviceInfo()
      };
      
      setApiDeviceInfo(mockApiResponse);
      console.log("✅ Mock API response:", mockApiResponse);
      
    } catch (e) {
      console.log("❌ Error testing API call:", e);
      setApiDeviceInfo({ error: "Error testing API call: " + String(e) });
    } finally {
      setIsLoadingApiDeviceInfo(false);
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
              <Text>Is Registered: {deviceInfo.is_registered ? 'Yes' : 'No'}</Text>
              <Text>Is Push Registered: {deviceInfo.is_push_registered ? 'Yes' : 'No'}</Text>
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
          <Button 
            title={isLoadingUnregisterDevice ? "Loading..." : "Unregister Device"} 
            onPress={handleUnregisterDevice}
            disabled={isLoadingUnregisterDevice}
            color="#FF6B6B"
          />
          <Text style={styles.statusText}>Unregister Status: {unregisterDeviceStatus}</Text>
        </Group>
        
        <Group name="Push Registration">
          <Button 
            title={isLoadingRegisterPush ? "Loading..." : "Register Push"} 
            onPress={handleRegisterPush}
            disabled={isLoadingRegisterPush}
          />
          <Text style={styles.statusText}>Push Status: {pushStatus}</Text>
          <Button 
            title={isLoadingUnregisterPush ? "Loading..." : "Unregister Push"} 
            onPress={handleUnregisterPush}
            disabled={isLoadingUnregisterPush}
            color="#FF6B6B"
          />
          <Text style={styles.statusText}>Unregister Push Status: {unregisterPushStatus}</Text>
          {pushToken && (
            <View style={styles.tokenContainer}>
              <Text style={styles.tokenTitle}>Push Token:</Text>
              <Text style={styles.tokenText}>{pushToken}</Text>
            </View>
          )}
        </Group>
        
        <Group name="Person Management">
          <Button 
            title={isLoadingAssociatePerson ? "Loading..." : "Associate Person"} 
            onPress={handleAssociatePerson}
            disabled={isLoadingAssociatePerson}
          />
          <Text style={styles.statusText}>Associate Status: {associatePersonStatus}</Text>
          <Button 
            title={isLoadingPerson ? "Loading..." : "Get Person Info"} 
            onPress={handleGetPerson}
            disabled={isLoadingPerson}
          />
          {personInfo && (
            <View style={styles.infoContainer}>
              <Text style={styles.infoTitle}>Person Info:</Text>
              <Text>Person Key: {personInfo.personKey || 'N/A'}</Text>
              <Text>External Person ID: {personInfo.externalPersonId || 'N/A'}</Text>
              <Text>MDN: {personInfo.mdn || 'N/A'}</Text>
            </View>
          )}
        </Group>

        <Group name="🔍 Device Association Checker">
          <Text style={styles.statusText}>External Person ID: {externalPersonId}</Text>
          <Button 
            title={isLoadingApiDeviceInfo ? "Loading..." : "Check Device Associations"} 
            onPress={handleCheckDeviceAssociations}
            disabled={isLoadingApiDeviceInfo}
            color="#4CAF50"
          />
          <Button 
            title="Test API Call (Mock)" 
            onPress={handleTestApiCall}
            disabled={isLoadingApiDeviceInfo}
            color="#2196F3"
          />
          {apiDeviceInfo && (
            <View style={styles.infoContainer}>
              <Text style={styles.infoTitle}>API Device Info:</Text>
              {apiDeviceInfo.error ? (
                <Text style={{color: 'red'}}>Error: {apiDeviceInfo.error}</Text>
              ) : (
                <>
                  {apiDeviceInfo.localDeviceInfo && (
                    <>
                      <Text style={styles.infoSubtitle}>Local Device Info:</Text>
                      <Text>Device ID: {apiDeviceInfo.localDeviceInfo.device_id || 'N/A'}</Text>
                      <Text>Push Token: {apiDeviceInfo.localDeviceInfo.push_token || 'N/A'}</Text>
                    </>
                  )}
                  {apiDeviceInfo.endpoint && (
                    <>
                      <Text style={styles.infoSubtitle}>API Endpoint:</Text>
                      <Text style={styles.apiUrl}>{apiDeviceInfo.endpoint}</Text>
                    </>
                  )}
                  {apiDeviceInfo.message && (
                    <Text style={styles.infoSubtitle}>Status: {apiDeviceInfo.message}</Text>
                  )}
                </>
              )}
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
  infoSubtitle: {
    fontWeight: 'bold' as const,
    marginTop: 10,
    marginBottom: 5,
  },
  apiUrl: {
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: '#f0f0f0',
    padding: 5,
    borderRadius: 3,
    color: '#007BFF',
  },
};
