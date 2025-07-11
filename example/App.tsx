import ExpoVibesSDK from "vibes-react-native-expo";
import { Button, SafeAreaView, ScrollView, Text, View, TextInput, Switch } from "react-native";
import { useState } from "react";
import React from "react";

export default function App() {
  const [deviceStatus, setDeviceStatus] = useState<string>("");
  const [pushStatus, setPushStatus] = useState<string>("");
  const [pushToken, setPushToken] = useState<string>("");
  const [sdkVersion, setSdkVersion] = useState<string>("");
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [isLoadingSdkVersion, setIsLoadingSdkVersion] = useState(false);
  const [isLoadingDeviceInfo, setIsLoadingDeviceInfo] = useState(false);
  const [isLoadingRegisterDevice, setIsLoadingRegisterDevice] = useState(false);
  const [isLoadingRegisterPush, setIsLoadingRegisterPush] = useState(false);
  const [isLoadingUnregisterDevice, setIsLoadingUnregisterDevice] = useState(false);
  const [isLoadingUnregisterPush, setIsLoadingUnregisterPush] = useState(false);
  const [isLoadingAssociatePerson, setIsLoadingAssociatePerson] = useState(false);
  const [isLoadingUpdateDevice, setIsLoadingUpdateDevice] = useState(false);
  const [isLoadingGetPerson, setIsLoadingGetPerson] = useState(false);
  const [isLoadingFetchInboxMessages, setIsLoadingFetchInboxMessages] = useState(false);
  const [isLoadingFetchInboxMessage, setIsLoadingFetchInboxMessage] = useState(false);
  const [isLoadingMarkInboxMessageAsRead, setIsLoadingMarkInboxMessageAsRead] = useState(false);
  const [isLoadingExpireInboxMessage, setIsLoadingExpireInboxMessage] = useState(false);
  const [isLoadingOnInboxMessageOpen, setIsLoadingOnInboxMessageOpen] = useState(false);
  const [isLoadingOnInboxMessagesFetched, setIsLoadingOnInboxMessagesFetched] = useState(false);
  const [isLoadingInitializeVibes, setIsLoadingInitializeVibes] = useState(false);

  const [unregisterDeviceStatus, setUnregisterDeviceStatus] = useState("");
  const [unregisterPushStatus, setUnregisterPushStatus] = useState("");
  const [associatePersonId, setAssociatePersonId] = useState("");
  const [associatePersonStatus, setAssociatePersonStatus] = useState("");
  const [updateDeviceLat, setUpdateDeviceLat] = useState("");
  const [updateDeviceLon, setUpdateDeviceLon] = useState("");
  const [updateDeviceCred, setUpdateDeviceCred] = useState(false);
  const [updateDeviceStatus, setUpdateDeviceStatus] = useState("");
  const [getPersonStatus, setGetPersonStatus] = useState("");
  const [fetchInboxMessagesStatus, setFetchInboxMessagesStatus] = useState("");
  const [fetchInboxMessagesResult, setFetchInboxMessagesResult] = useState<any[]>([]);
  const [fetchInboxMessageId, setFetchInboxMessageId] = useState("");
  const [fetchInboxMessageStatus, setFetchInboxMessageStatus] = useState("");
  const [fetchInboxMessageResult, setFetchInboxMessageResult] = useState<any>(null);
  const [markInboxMessageId, setMarkInboxMessageId] = useState("");
  const [markInboxMessageStatus, setMarkInboxMessageStatus] = useState("");
  const [expireInboxMessageId, setExpireInboxMessageId] = useState("");
  const [expireInboxMessageStatus, setExpireInboxMessageStatus] = useState("");
  const [onInboxMessageOpenId, setOnInboxMessageOpenId] = useState("");
  const [onInboxMessageOpenStatus, setOnInboxMessageOpenStatus] = useState("");
  const [onInboxMessagesFetchedStatus, setOnInboxMessagesFetchedStatus] = useState("");
  const [initializeVibesStatus, setInitializeVibesStatus] = useState("");

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

  const handleUnregisterDevice = async () => {
    try {
      setIsLoadingUnregisterDevice(true);
      const result = await ExpoVibesSDK.unregisterDevice();
      setUnregisterDeviceStatus("Device unregistered: " + result);
    } catch (e) {
      setUnregisterDeviceStatus("Unregister failed: " + String(e));
    } finally {
      setIsLoadingUnregisterDevice(false);
    }
  };
  const handleUnregisterPush = async () => {
    try {
      setIsLoadingUnregisterPush(true);
      const result = await ExpoVibesSDK.unregisterPush();
      setUnregisterPushStatus("Push unregistered: " + result);
    } catch (e) {
      setUnregisterPushStatus("Unregister push failed: " + String(e));
    } finally {
      setIsLoadingUnregisterPush(false);
    }
  };
  const handleAssociatePerson = async () => {
    try {
      setIsLoadingAssociatePerson(true);
      const result = await ExpoVibesSDK.associatePerson(associatePersonId);
      setAssociatePersonStatus("Associated: " + result);
    } catch (e) {
      setAssociatePersonStatus("Associate failed: " + String(e));
    } finally {
      setIsLoadingAssociatePerson(false);
    }
  };
  const handleUpdateDevice = async () => {
    try {
      setIsLoadingUpdateDevice(true);
      const lat = parseFloat(updateDeviceLat);
      const lon = parseFloat(updateDeviceLon);
      const result = await ExpoVibesSDK.updateDevice(updateDeviceCred, lat, lon);
      setUpdateDeviceStatus("Device updated: " + result);
    } catch (e) {
      setUpdateDeviceStatus("Update failed: " + String(e));
    } finally {
      setIsLoadingUpdateDevice(false);
    }
  };
  const handleGetPerson = async () => {
    try {
      setIsLoadingGetPerson(true);
      const result = await ExpoVibesSDK.getPerson();
      setGetPersonStatus("Person: " + JSON.stringify(result));
    } catch (e) {
      setGetPersonStatus("Get person failed: " + String(e));
    } finally {
      setIsLoadingGetPerson(false);
    }
  };
  const handleFetchInboxMessages = async () => {
    try {
      setIsLoadingFetchInboxMessages(true);
      const result = await ExpoVibesSDK.fetchInboxMessages();
      setFetchInboxMessagesResult(result);
      setFetchInboxMessagesStatus("Fetched " + result.length + " messages");
    } catch (e) {
      setFetchInboxMessagesStatus("Fetch failed: " + String(e));
      setFetchInboxMessagesResult([]);
    } finally {
      setIsLoadingFetchInboxMessages(false);
    }
  };
  const handleFetchInboxMessage = async () => {
    try {
      setIsLoadingFetchInboxMessage(true);
      const result = await ExpoVibesSDK.fetchInboxMessage(fetchInboxMessageId);
      setFetchInboxMessageResult(result);
      setFetchInboxMessageStatus("Fetched message: " + JSON.stringify(result));
    } catch (e) {
      setFetchInboxMessageStatus("Fetch failed: " + String(e));
      setFetchInboxMessageResult(null);
    } finally {
      setIsLoadingFetchInboxMessage(false);
    }
  };
  const handleMarkInboxMessageAsRead = async () => {
    try {
      setIsLoadingMarkInboxMessageAsRead(true);
      const result = await ExpoVibesSDK.markInboxMessageAsRead(markInboxMessageId);
      setMarkInboxMessageStatus("Marked as read: " + result);
    } catch (e) {
      setMarkInboxMessageStatus("Mark as read failed: " + String(e));
    } finally {
      setIsLoadingMarkInboxMessageAsRead(false);
    }
  };
  const handleExpireInboxMessage = async () => {
    try {
      setIsLoadingExpireInboxMessage(true);
      const result = await ExpoVibesSDK.expireInboxMessage(expireInboxMessageId);
      setExpireInboxMessageStatus("Expired: " + result);
    } catch (e) {
      setExpireInboxMessageStatus("Expire failed: " + String(e));
    } finally {
      setIsLoadingExpireInboxMessage(false);
    }
  };
  const handleOnInboxMessageOpen = async () => {
    try {
      setIsLoadingOnInboxMessageOpen(true);
      const result = await ExpoVibesSDK.onInboxMessageOpen(onInboxMessageOpenId);
      setOnInboxMessageOpenStatus("Opened: " + result);
    } catch (e) {
      setOnInboxMessageOpenStatus("Open failed: " + String(e));
    } finally {
      setIsLoadingOnInboxMessageOpen(false);
    }
  };
  const handleOnInboxMessagesFetched = async () => {
    try {
      setIsLoadingOnInboxMessagesFetched(true);
      const result = await ExpoVibesSDK.onInboxMessagesFetched();
      setOnInboxMessagesFetchedStatus("Fetched: " + result);
    } catch (e) {
      setOnInboxMessagesFetchedStatus("Fetch event failed: " + String(e));
    } finally {
      setIsLoadingOnInboxMessagesFetched(false);
    }
  };
  const handleInitializeVibes = async () => {
    try {
      setIsLoadingInitializeVibes(true);
      await ExpoVibesSDK.initializeVibes();
      setInitializeVibesStatus("Vibes initialized");
    } catch (e) {
      setInitializeVibesStatus("Initialize failed: " + String(e));
    } finally {
      setIsLoadingInitializeVibes(false);
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

        <Group name="Device Unregistration">
          <Button
            title={isLoadingUnregisterDevice ? "Loading..." : "Unregister Device"}
            onPress={handleUnregisterDevice}
            disabled={isLoadingUnregisterDevice}
          />
          <Text style={styles.statusText}>{unregisterDeviceStatus}</Text>
        </Group>
        <Group name="Push Unregistration">
          <Button
            title={isLoadingUnregisterPush ? "Loading..." : "Unregister Push"}
            onPress={handleUnregisterPush}
            disabled={isLoadingUnregisterPush}
          />
          <Text style={styles.statusText}>{unregisterPushStatus}</Text>
        </Group>
        <Group name="Associate Person">
          <TextInput
            style={styles.input}
            placeholder="External Person ID"
            value={associatePersonId}
            onChangeText={setAssociatePersonId}
          />
          <Button
            title={isLoadingAssociatePerson ? "Loading..." : "Associate Person"}
            onPress={handleAssociatePerson}
            disabled={isLoadingAssociatePerson || !associatePersonId}
          />
          <Text style={styles.statusText}>{associatePersonStatus}</Text>
        </Group>
        <Group name="Update Device">
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Text>Update Credentials</Text>
            <Switch value={updateDeviceCred} onValueChange={setUpdateDeviceCred} />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Latitude"
            value={updateDeviceLat}
            onChangeText={setUpdateDeviceLat}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Longitude"
            value={updateDeviceLon}
            onChangeText={setUpdateDeviceLon}
            keyboardType="numeric"
          />
          <Button
            title={isLoadingUpdateDevice ? "Loading..." : "Update Device"}
            onPress={handleUpdateDevice}
            disabled={isLoadingUpdateDevice || !updateDeviceLat || !updateDeviceLon}
          />
          <Text style={styles.statusText}>{updateDeviceStatus}</Text>
        </Group>
        <Group name="Get Person">
          <Button
            title={isLoadingGetPerson ? "Loading..." : "Get Person"}
            onPress={handleGetPerson}
            disabled={isLoadingGetPerson}
          />
          <Text style={styles.statusText}>{getPersonStatus}</Text>
        </Group>
        <Group name="Inbox Messages">
          <Button
            title={isLoadingFetchInboxMessages ? "Loading..." : "Fetch Inbox Messages"}
            onPress={handleFetchInboxMessages}
            disabled={isLoadingFetchInboxMessages}
          />
          <Text style={styles.statusText}>{fetchInboxMessagesStatus}</Text>
          {fetchInboxMessagesResult.length > 0 && (
            <View style={styles.infoContainer}>
              <Text style={styles.infoTitle}>Messages:</Text>
              {fetchInboxMessagesResult.map((msg, idx) => (
                <Text key={idx}>{JSON.stringify(msg)}</Text>
              ))}
            </View>
          )}
        </Group>
        <Group name="Fetch Inbox Message">
          <TextInput
            style={styles.input}
            placeholder="Message ID"
            value={fetchInboxMessageId}
            onChangeText={setFetchInboxMessageId}
          />
          <Button
            title={isLoadingFetchInboxMessage ? "Loading..." : "Fetch Inbox Message"}
            onPress={handleFetchInboxMessage}
            disabled={isLoadingFetchInboxMessage || !fetchInboxMessageId}
          />
          <Text style={styles.statusText}>{fetchInboxMessageStatus}</Text>
          {fetchInboxMessageResult && (
            <View style={styles.infoContainer}>
              <Text style={styles.infoTitle}>Message:</Text>
              <Text>{JSON.stringify(fetchInboxMessageResult)}</Text>
            </View>
          )}
        </Group>
        <Group name="Mark Inbox Message As Read">
          <TextInput
            style={styles.input}
            placeholder="Message ID"
            value={markInboxMessageId}
            onChangeText={setMarkInboxMessageId}
          />
          <Button
            title={isLoadingMarkInboxMessageAsRead ? "Loading..." : "Mark As Read"}
            onPress={handleMarkInboxMessageAsRead}
            disabled={isLoadingMarkInboxMessageAsRead || !markInboxMessageId}
          />
          <Text style={styles.statusText}>{markInboxMessageStatus}</Text>
        </Group>
        <Group name="Expire Inbox Message">
          <TextInput
            style={styles.input}
            placeholder="Message ID"
            value={expireInboxMessageId}
            onChangeText={setExpireInboxMessageId}
          />
          <Button
            title={isLoadingExpireInboxMessage ? "Loading..." : "Expire Message"}
            onPress={handleExpireInboxMessage}
            disabled={isLoadingExpireInboxMessage || !expireInboxMessageId}
          />
          <Text style={styles.statusText}>{expireInboxMessageStatus}</Text>
        </Group>
        <Group name="On Inbox Message Open">
          <TextInput
            style={styles.input}
            placeholder="Message ID"
            value={onInboxMessageOpenId}
            onChangeText={setOnInboxMessageOpenId}
          />
          <Button
            title={isLoadingOnInboxMessageOpen ? "Loading..." : "Open Message"}
            onPress={handleOnInboxMessageOpen}
            disabled={isLoadingOnInboxMessageOpen || !onInboxMessageOpenId}
          />
          <Text style={styles.statusText}>{onInboxMessageOpenStatus}</Text>
        </Group>
        <Group name="On Inbox Messages Fetched">
          <Button
            title={isLoadingOnInboxMessagesFetched ? "Loading..." : "Inbox Messages Fetched Event"}
            onPress={handleOnInboxMessagesFetched}
            disabled={isLoadingOnInboxMessagesFetched}
          />
          <Text style={styles.statusText}>{onInboxMessagesFetchedStatus}</Text>
        </Group>
        <Group name="Initialize Vibes">
          <Button
            title={isLoadingInitializeVibes ? "Loading..." : "Initialize Vibes"}
            onPress={handleInitializeVibes}
            disabled={isLoadingInitializeVibes}
          />
          <Text style={styles.statusText}>{initializeVibesStatus}</Text>
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
  view: {
    flex: 1,
    height: 200,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 8,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
};
