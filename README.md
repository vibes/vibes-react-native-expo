# Vibes SDK - Android Installation Guide (Managed Workflow + Custom Development Build)


This guide provides step-by-step instructions for installing and configuring the Vibes SDK in your Android React Native/Expo application using **managed workflow** with **custom development build** and Expo 51.


The Vibes SDK for Android is distributed as an **AAR (Android Archive)** file, which is a binary library format that contains compiled Android code, resources, and manifest entries. AAR files are automatically included in your app during the build process through the Expo plugin system.


**Why AAR files don't require credentials:**
- AAR files are **pre-compiled libraries** that contain the Vibes SDK's native Android code
- They are **stateless** - they don't store any credentials or sensitive information
- Authentication and configuration are handled at **runtime** through your app's configuration (via `androidAppId` and `appUrl` parameters)
- The AAR file only provides the **native interface** - actual API calls and authentication happen when your app runs and connects to Vibes servers using your configured credentials




##  Prerequisites


Before you begin, ensure you have the following:


- **Expo CLI** installed globally: `npm install -g @expo/cli`
- **EAS CLI** installed: `npm install -g eas-cli`
- **React Native** `npm install react-native@0.74.5`
- **Firebase** `npm install @react-native-firebase/app @react-native-firebase/messaging`
- **Expo account** (free or paid tier at [expo.dev](https://expo.dev))
- **Node.js** and **npm** or **yarn**
- **Java Development Kit (JDK)** 11 or higher
- **Android SDK** with API level 21+ (Android 5.0+)


## Installation Steps


### 1. Install the Package


Add the Vibes SDK package to your project dependencies:


```bash
npm install vibes-react-native-expo
# or
yarn add vibes-react-native-expo
```

If you continue to encounter errors while installing the Vibes SDK, you can install it using the --legacy-peer-deps flag to ensure the Expo dependencies compatibility and the SDK is installed correctly


```bash
npm install --legacy-peer-deps
```

### 2. Configure the Plugin


Add the Vibes plugin configuration to your `app.config.ts`  file:


```typescript
import { ExpoConfig } from "expo/config";


export default {
 expo: {
   // ... other expo config
   plugins: [
     [
       "vibes-react-native-expo",
       {
         androidAppId: process.env.ANDROID_APP_ID, 
         appUrl: process.env.APP_URL,
         iosAppId: process.env.IOS_APP_ID,
         vibesAppEnv: process.env.VIBES_APP_ENV || "UAT",
       },
     ],
   ],
   ios: {
     bundleIdentifier: "com.yourcompany.yourapp",
     entitlements: {
       "aps-environment": "development"
     }
   },
   android: {
     package: "com.yourcompany.yourapp",
     // ... other android config
   },
 },
};
```


### 3. Environment Variables 

In `app.config.ts`, you can reference environment variables directly using `process.env.ANDROID_APP_ID`, `process.env.APP_URL`, `process.env.IOS_APP_ID`, and `process.env.VIBES_APP_ENV` (no `EXPO_PUBLIC_` prefix needed), because the config is loaded at build time, not at runtime.
Create a `.env` file in your project root and add your Vibes credentials:


```env
ANDROID_APP_ID=your-android-app-id-here
IOS_APP_ID=your-ios-app-id-here
APP_URL=https://your-vibes-api-url.com/mobile_apps
VIBES_APP_ENV=UAT
```


Then update your `app.config.ts`:


```typescript
export default {
 expo: {
   plugins: [
     [
       "vibes-react-native-expo",
       {
         androidAppId: process.env.ANDROID_APP_ID,
         appUrl: process.env.APP_URL,
         iosAppId: process.env.IOS_APP_ID,
         vibesAppEnv: process.env.VIBES_APP_ENV || "UAT"
       },
     ],
   ],
 },
};
```

## Setting Environment Variables for EAS Cloud Build
**For EAS Cloud Build:**
- Set environment variables in the `env` section of your `eas.json` file, referencing secrets using `$ANDROID_APP_ID`, `$IOS_APP_ID`, `$APP_URL`, and `$VIBES_APP_ENV` (recommended and most secure).
- Set secrets using the `eas secret:create` command.
- Do **not** rely on local `.env` files for cloud builds – they are ignored by EAS Cloud Build.

### Setting EAS Secrets
Set secrets in Expo/EAS Cloud:

```sh
eas secret:create --name ANDROID_APP_ID --value your-android-app-id
eas secret:create --name IOS_APP_ID --value your-ios-app-id
eas secret:create --name APP_URL --value https://your-api-url.com/mobile_apps
eas secret:create --name VIBES_APP_ENV --value UAT # or PROD
```

**Best practice:** Always test your cloud build to ensure variables are passed correctly to your plugin and app config.


### 4. Configure EAS Build


Create or update your `eas.json` file to include development builds:


```json
{
 "cli": {
   "version": ">= 5.9.1"
 },
 "build": {
   "development": {
     "developmentClient": true,
     "distribution": "internal",
     "android": {
       "gradleCommand": ":app:assembleDebug"
     },
     "ios": {
       "buildConfiguration": "Debug",
       //In case you're having eas build cache issue - add these two
        "credentialsSource": "remote",
        "cache": {
          "key": "pods-ios-{{ hash }}"
        }
     },
     "env": {
       "ANDROID_APP_ID": "$ANDROID_APP_ID",
       "IOS_APP_ID": "$IOS_APP_ID",
       "APP_URL": "$APP_URL",
       "VIBES_APP_ENV": "$VIBES_APP_ENV"
     }
   },
   "preview": {
     "distribution": "internal",
     "android": { 
       "buildType": "apk"
     },
     "ios": {
       "buildConfiguration": "Release"
     },
     "env": {
       "ANDROID_APP_ID": "$ANDROID_APP_ID",
       "IOS_APP_ID": "$IOS_APP_ID",
       "APP_URL": "$APP_URL",
       "VIBES_APP_ENV": "$VIBES_APP_ENV"
     }
   },
   "production": {
     "android": {
       "buildType": "aab"
     },
     "ios": {
       "buildConfiguration": "Release"
     },
     "env": {
       "ANDROID_APP_ID": "$ANDROID_APP_ID",
       "IOS_APP_ID": "$IOS_APP_ID",
       "APP_URL": "$APP_URL",
       "VIBES_APP_ENV": "$VIBES_APP_ENV"
     }
   }
 },
 "submit": {
   "production": {}
 }
}
```


### 5. Create Development Build


Build a custom development client that includes the Vibes SDK:


```bash


# For cloud build (recommended)
eas build --profile development --platform android
# For iOS development build
eas build --profile development --platform ios
```


This will:
- Create a custom development client with Vibes SDK included
- Apply the plugin configuration automatically
- Generate an APK file (Android) or IPA file (iOS) you can install on your device


## Android Configuration Details


### Automatic Configuration


The plugin automatically configures the native Android files during the EAS build process. You don't need to manually edit these files:


#### AndroidManifest.xml
The plugin automatically adds these permissions and metadata:


```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.VIBRATE"/>
<!-- ... other permissions -->


<application>
 <meta-data android:name="vibes_app_id" android:value="${vibesAppId}"/>
 <meta-data android:name="vibes_api_url" android:value="${vibesAppUrl}"/>
 <!-- ... other metadata -->
</application>
```


#### build.gradle
The plugin automatically adds manifest placeholders:


```gradle
android {
 defaultConfig {
   manifestPlaceholders = [
     vibesAppId: "your-app-id",
     vibesAppUrl: "your-api-url"
   ]
 }
}
```


## iOS Configuration Details

### Automatic Configuration

The plugin automatically configures the native iOS files during the EAS build process:

#### Info.plist
The plugin automatically adds these keys:
```xml
<key>VibesAppId</key>
<string>$(VIBES_APP_ID)</string>
<key>VibesApiURL</key>
<string>$(VIBES_API_URL)</string>
<key>VibesAppEnv</key>
<string>$(VIBES_APP_ENV)</string>

<key>NSPushNotificationsUsageDescription</key>
<string>This app uses push notifications to keep you updated.</string>
<key>UIBackgroundModes</key>
<array>
  <string>remote-notification</string>
</array>
```

#### AppDelegate.mm
The plugin automatically creates and configures AppDelegate.mm with Vibes SDK initialization and push notification handling.

#### VibesBridge Files
The plugin automatically creates:
- `VibesBridge.h` - Header file for native bridge
- `VibesBridge.m` - Implementation file for native bridge with push notification setup

#### Push Notifications
The plugin automatically adds:
- Push notification permissions (`NSPushNotificationsUsageDescription`)
- Background modes for remote notifications (`UIBackgroundModes`)
- Entitlements for push notifications (`aps-environment`)
- Automatic push token handling in AppDelegate.mm


### Development Workflow


1. **Install the development build** on your device using QR code
2. **Start the development server**: `npx expo start --dev-client`
3. **Open the app** on your device - it will connect to your development server


## Minimum Requirements

### Android
- **Android API Level**: 21+ (Android 5.0 Lollipop)
- **Target SDK**: 34 (Android 14)
- **Compile SDK**: 34
- **Gradle Version**: 7.0+

### iOS
- **iOS Version**: 13.0+
- **Xcode Version**: 15.0+
- **Swift Version**: 5.0+
- **Push Notifications**: Must be configured in Apple Developer Portal
- **Entitlements**: `aps-environment` must be set to `development` or `production`


## Verification


After installation, verify the setup by checking:


1. **Plugin Configuration**: Ensure the plugin is listed in your `app.config.ts`
2. **Development Build**: Successfully create and install the development build
3. **App Connection**: Verify the app connects to your development server
4. **Vibes Integration**: Test that Vibes SDK functions work in your app


## Warnings

**These warnings are not blockers for a successful build.** But you're seeing signs that:

- Packages listed below used by Expo and its dependencies are **old or unmaintained**.
- You may want to **watch them** in the future if any updates are released.

### Grouped by Package

#### Legacy or Abandoned Packages

| Package | Reason |
|---------|--------|
| inflight@1.0.6 | Leaks memory; no longer supported |
| osenv@0.1.5 | Deprecated, no active support |
| sudo-prompt@9.2.1 | Deprecated tool for elevated permissions |
| @babel/plugin-proposal-* | These were used when the JS features were still experimental. Since the features are now part of the ECMAScript standard, transform plugins are preferred. |
| @xmldom/xmldom@0.7.13 | Often used indirectly via tooling (e.g., XML parsers in PDF generators or bundlers) |
| rimraf@2.x/3.x | Old version |
| glob@7.x | Old version |
| querystring@0.2.1 | Old version |

### Why This Happens

Those packages are pulled in by Expo and it's dependencies during the standard build process.

### Common Warnings

<details>
<summary>APP BUILD LOGS</summary>

```
npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
npm warn deprecated sudo-prompt@9.2.1: Package no longer supported. Contact Support at https://www.npmjs.com/support for more info.
npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
npm warn deprecated querystring@0.2.1: The querystring API is considered Legacy. new code should use the URLSearchParams API instead.
npm warn deprecated osenv@0.1.5: This package is no longer supported.
npm warn deprecated @xmldom/xmldom@0.7.13: this version is no longer supported, please update to at least 0.8.*
npm warn deprecated @babel/plugin-proposal-optional-catch-binding@7.18.6: This proposal has been merged to the ECMAScript standard and thus this plugin is no longer maintained. Please use @babel/plugin-transform-optional-catch-binding instead.
npm warn deprecated @babel/plugin-proposal-optional-chaining@7.21.0: This proposal has been merged to the ECMAScript standard and thus this plugin is no longer maintained. Please use @babel/plugin-transform-optional-chaining instead.
npm warn deprecated @babel/plugin-proposal-numeric-separator@7.18.6: This proposal has been merged to the ECMAScript standard and thus this plugin is no longer maintained. Please use @babel/plugin-transform-numeric-separator instead.
npm warn deprecated @babel/plugin-proposal-nullish-coalescing-operator@7.18.6: This proposal has been merged to the ECMAScript standard and thus this plugin is no longer maintained. Please use @babel/plugin-transform-nullish-coalescing-operator instead.
npm warn deprecated @babel/plugin-proposal-logical-assignment-operators@7.20.7: This proposal has been merged to the ECMAScript standard and thus this plugin is no longer maintained. Please use @babel/plugin-transform-logical-assignment-operators instead.
npm warn deprecated @babel/plugin-proposal-class-properties@7.18.6: This proposal has been merged to the ECMAScript standard and thus this plugin is no longer maintained. Please use @babel/plugin-transform-class-properties instead.
npm warn deprecated @babel/plugin-proposal-object-rest-spread@7.20.7: This proposal has been merged to the ECMAScript standard and thus this plugin is no longer maintained. Please use @babel/plugin-transform-object-rest-spread instead.
npm warn deprecated @babel/plugin-proposal-async-generator-functions@7.20.7: This proposal has been merged to the ECMAScript standard and thus this plugin is no longer maintained. Please use @babel/plugin-transform-async-generator-functions instead.
npm warn deprecated rimraf@2.6.3: Rimraf versions prior to v4 are no longer supported
npm warn deprecated glob@7.1.6: Glob versions prior to v9 are no longer supported
npm warn deprecated glob@7.1.6: Glob versions prior to v9 are no longer supported
npm warn deprecated glob@7.1.6: Glob versions prior to v9 are no longer supported
```

</details>

## Troubleshooting


### Common Issues


#### 1. Build Errors
If you encounter EAS build errors:
```bash
# Check build logs
eas build:list


# Retry the build
eas build --profile development --platform android --clear-cache
# For iOS
eas build --profile development --platform ios --clear-cache


#### 2. Development Client Issues
If the development client doesn't work:
```bash
# Rebuild the development client
eas build --profile development --platform android


# Clear Expo cache
npx expo start --clear


# Check device connection
npx expo start --dev-client --tunnel
```


#### 3. Plugin Not Applied
If the Vibes plugin isn't working:
```bash
# Verify plugin configuration in app.config.ts
# Rebuild the development client
eas build --profile development --platform android --clear-cache
# For iOS
eas build --profile development --platform ios --clear-cache
```

#### 4. iOS Push Notification Issues
If push notifications aren't working on iOS:
```bash
# Verify entitlements are set correctly
# Check that aps-environment is set to "development" or "production"
# Ensure push notifications are enabled in Apple Developer Portal
# Verify APNs certificate/key is configured correctly
```


### Debug Steps


1. **Check EAS build logs** for any configuration errors
2. **Verify plugin configuration** in your `app.config.ts`
3. **Ensure environment variables** are properly set
4. **Test development client** connection to your development server
5. **Check Vibes SDK initialization** in your app code


## Next Steps


After successful installation:
1. **Test the development build** - Install the APK on your device and verify it connects to your development server
2. **Initialize Vibes SDK** in your app code using the examples in the Usage Guide below
3. **Configure your Vibes dashboard** - Set up your app in the Vibes platform and get your credentials
4. **Configure iOS Push Notifications** - Set up push notifications in Apple Developer Portal:
   - Create an APNs certificate or key
   - Configure your app's bundle identifier
   - Enable push notifications capability
5. **Test basic functionality** - Register device, associate user, and test push notifications
6. **Create production build** when ready to deploy: `eas build --profile production --platform android` or `eas build --profile production --platform ios`




## Usage Guide
The Vibes SDK provides a simple interface for integrating push notifications and messaging features into your React Native app. After installation, you can import the required functions and start using the SDK immediately.


The main functions you'll use are:
- `registerDevice()` - Register the device with Vibes
- `registerPush()` - Enable push notifications
- `associatePerson()` - Link a user to the device
- `getPerson()` - Get current user information
- `fetchInboxMessages()` - Retrieve inbox messages




### Importing the SDK


```typescript
// Import the entire module
import ExpoVibesSDK from 'vibes-react-native-expo';
```


### Basic Setup and Initialization


**Important:** You should **not** call `registerDevice()` and then immediately call `registerPush()` without waiting for confirmation that the device registration is complete. The promise returned by `registerDevice()` only means the native registration function was called, not that the device is actually registered. You should wait for a confirmation event or callback (such as `didRegisterDevice` or `didRegisterPush`) before proceeding to the next step.


A correct implementation should be based on events/callbacks. For example:

```typescript
import { useEffect } from 'react';
import ExpoVibesSDK from 'vibes-react-native-expo';

useEffect(() => {
  // Example: listening to onChange event
  const subscription = ExpoVibesSDK.addListener('onChange', (event) => {
    console.log('Value changed:', event.value);
  });

  // Example: registering device and handling event
  ExpoVibesSDK.registerDevice().then((deviceId) => {
    console.log('Device registered:', deviceId);
  });

  // Example: registering push and handling event
  ExpoVibesSDK.registerPush().then((result) => {
    console.log('Push registered:', result);
  });

  // Example: listening to onGetPerson event
  const personSub = ExpoVibesSDK.addListener('onGetPerson', (event) => {
    console.log('Person event:', event.person);
  });

  // Example: listening to onFetchInboxMessages event
  const inboxSub = ExpoVibesSDK.addListener('onFetchInboxMessages', (event) => {
    console.log('Inbox messages event:', event.messages);
  });

  // Cleaning up subscriptions on unmount
  return () => {
    subscription.remove();
    personSub.remove();
    inboxSub.remove();
  };
}, []);
```


### User Management


```typescript
import ExpoVibesSDK from 'vibes-react-native-expo';


// Associate a user with the device
const associateUser = async (userId: string) => {
 try {
   await ExpoVibesSDK.associatePerson(userId);
   console.log('User associated successfully');
 } catch (error) {
   console.error('Failed to associate user:', error);
 }
};


// Get current user information
const getCurrentUser = async () => {
 try {
   const person = await ExpoVibesSDK.getPerson();
   console.log('Current user:', person);
   return person;
 } catch (error) {
   console.error('Failed to get user:', error);
   return null;
 }
};
```


### Inbox Messages


```typescript
import ExpoVibesSDK from 'vibes-react-native-expo';


// Fetch all inbox messages
const loadInboxMessages = async () => {
 try {
   const messages = await ExpoVibesSDK.fetchInboxMessages();
   console.log('Inbox messages:', messages);
   return messages;
 } catch (error) {
   console.error('Failed to fetch messages:', error);
   return [];
 }
};


// Fetch specific message
const loadMessage = async (messageId: string) => {
 try {
   const message = await ExpoVibesSDK.fetchInboxMessage(messageId);
   console.log('Message details:', message);
   return message;
 } catch (error) {
   console.error('Failed to fetch message:', error);
   return null;
 }
};


// Mark message as read
const markAsRead = async (messageId: string) => {
 try {
   await ExpoVibesSDK.markInboxMessageAsRead(messageId);
   console.log('Message marked as read');
 } catch (error) {
   console.error('Failed to mark message as read:', error);
 }
};


// Expire message
const expireMessage = async (messageId: string) => {
 try {
   await ExpoVibesSDK.expireInboxMessage(messageId);
   console.log('Message expired');
 } catch (error) {
   console.error('Failed to expire message:', error);
 }
};
```


### Device Updates


```typescript
import ExpoVibesSDK from 'vibes-react-native-expo';


// Update device location and credentials
const updateDeviceInfo = async (latitude: number, longitude: number) => {
 try {
   await ExpoVibesSDK.updateDevice(true, latitude, longitude);
   console.log('Device updated successfully');
 } catch (error) {
   console.error('Failed to update device:', error);
 }
};
```


### Complete Example App


```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, ScrollView } from 'react-native';
import ExpoVibesSDK from 'vibes-react-native-expo';


export default function VibesExampleApp() {
 const [user, setUser] = useState<string | null>(null);
 const [messages, setMessages] = useState<any[]>([]);


 useEffect(() => {
   initializeVibes();
 }, []);


 const initializeVibes = async () => {
   try {
     await ExpoVibesSDK.registerDevice();
     await ExpoVibesSDK.registerPush();
     Alert.alert('Success', 'Vibes SDK initialized!');
   } catch (error) {
     Alert.alert('Error', 'Failed to initialize Vibes SDK');
   }
 };


 const handleLogin = async () => {
   try {
     await ExpoVibesSDK.associatePerson('user123');
     const currentUser = await ExpoVibesSDK.getPerson();
     setUser(currentUser);
     Alert.alert('Success', 'User logged in!');
   } catch (error) {
     Alert.alert('Error', 'Login failed');
   }
 };


 const loadMessages = async () => {
   try {
     const inboxMessages = await ExpoVibesSDK.fetchInboxMessages();
     setMessages(inboxMessages);
   } catch (error) {
     Alert.alert('Error', 'Failed to load messages');
   }
 };


 const markMessageRead = async (messageId: string) => {
   try {
     await ExpoVibesSDK.markInboxMessageAsRead(messageId);
     Alert.alert('Success', 'Message marked as read');
     loadMessages(); // Refresh messages
   } catch (error) {
     Alert.alert('Error', 'Failed to mark message as read');
   }
 };


 return (
   <ScrollView style={{ flex: 1, padding: 20 }}>
     <Text style={{ fontSize: 24, marginBottom: 20 }}>Vibes SDK Example</Text>
    
     <Button title="Login User" onPress={handleLogin} />
    
     {user && (
       <Text style={{ marginVertical: 10 }}>Logged in as: {user}</Text>
     )}
    
     <Button title="Load Messages" onPress={loadMessages} />
    
     {messages.map((message, index) => (
       <View key={index} style={{ marginVertical: 10, padding: 10, backgroundColor: '#f0f0f0' }}>
         <Text>{message.title || 'No title'}</Text>
         <Button
           title="Mark as Read"
           onPress={() => markMessageRead(message.id)}
         />
       </View>
     ))}
   </ScrollView>
 );
}
```


### Available Functions


| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `getSDKVersion()` | Get Vibes SDK version | None | Promise<string> |
| `registerDevice()` | Register device with Vibes | None | Promise<string> |
| `unregisterDevice()` | Unregister device | None | Promise<string> |
| `registerPush()` | Register for push notifications | None | Promise<string> |
| `unregisterPush()` | Unregister from push notifications | None | Promise<string> |
| `associatePerson(externalPersonId)` | Associate user with device | `string` | void |
| `updateDevice(updateCredentials, lat, lon)` | Update device info | `boolean, number, number` | void |
| `getPerson()` | Get current user information | None | Promise<string> |
| `fetchInboxMessages()` | Get all inbox messages | None | Promise<Array> |
| `fetchInboxMessage(messageId)` | Get specific message | `string` | Promise<Object> |
| `markInboxMessageAsRead(messageId)` | Mark message as read | `string` | Promise<string> |
| `expireInboxMessage(messageId)` | Expire message | `string` | Promise<string> |
| `onInboxMessageOpen(messageId)` | Track message open | `string` | Promise<string> |
| `onInboxMessagesFetched()` | Track messages fetched | None | Promise<string> |
| `getVibesDeviceInfo()` | Get device information | None | Promise<any> |
| `setValueAsync(value)` | Set value and trigger onChange event | `string` | Promise<void> |


## Full SDK API Usage Examples

Below are examples for all additional SDK functions available in the demo app:

```typescript
// Get device info
const getDeviceInfo = async () => {
  try {
    const info = await ExpoVibesSDK.getVibesDeviceInfo();
    console.log('Device info:', info);
    return info;
  } catch (error) {
    console.error('Failed to get device info:', error);
    return null;
  }
};

// Unregister device
const unregisterDevice = async () => {
  try {
    const result = await ExpoVibesSDK.unregisterDevice();
    console.log('Device unregistered:', result);
  } catch (error) {
    console.error('Failed to unregister device:', error);
  }
};

// Unregister push
const unregisterPush = async () => {
  try {
    const result = await ExpoVibesSDK.unregisterPush();
    console.log('Push unregistered:', result);
  } catch (error) {
    console.error('Failed to unregister push:', error);
  }
};

// Open inbox message (track open event)
const openInboxMessage = async (messageId: string) => {
  try {
    const result = await ExpoVibesSDK.onInboxMessageOpen(messageId);
    console.log('Inbox message opened:', result);
  } catch (error) {
    console.error('Failed to open inbox message:', error);
  }
};

// Track inbox messages fetched event
const trackInboxMessagesFetched = async () => {
  try {
    const result = await ExpoVibesSDK.onInboxMessagesFetched();
    console.log('Inbox messages fetched event:', result);
  } catch (error) {
    console.error('Failed to track inbox messages fetched:', error);
  }
};

// Set value async (test event)
const setValue = async (value: string) => {
  try {
    await ExpoVibesSDK.setValueAsync(value);
    console.log('Value set:', value);
  } catch (error) {
    console.error('Failed to set value:', error);
  }
};

// Initialize Vibes SDK manually
const initializeVibes = async () => {
  try {
    await ExpoVibesSDK.initializeVibes();
    console.log('Vibes SDK initialized');
  } catch (error) {
    console.error('Failed to initialize Vibes SDK:', error);
  }
};

// Get SDK version
const getSdkVersion = async () => {
  try {
    const version = await ExpoVibesSDK.getSDKVersion();
    console.log('SDK Version:', version);
    return version;
  } catch (error) {
    console.error('Failed to get SDK version:', error);
    return null;
  }
};
```

## Additional Resources


- [Vibes SDK Documentation](https://docs.vibes.com)
- [Expo Documentation](https://docs.expo.dev)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Development Builds Guide](https://docs.expo.dev/develop/development-builds/introduction/)
- [Expo Managed Workflow](https://docs.expo.dev/introduction/managed-vs-bare/)


##  Support


If you encounter issues during installation:
1. Check the [troubleshooting section](#-troubleshooting) above
2. Review the [example project](./example) for reference
3. Contact Vibes support or create an issue in the repository


---


**Note**: This guide is specifically for **Expo Managed Workflow** with **Custom Development Build** for Expo 51. This approach allows you to use native modules like Vibes SDK while maintaining the benefits of managed workflow. For bare React Native projects, see the [bare workflow documentation](https://docs.expo.dev/introduction/managed-vs-bare/).



## Change log:

0.3.11 (7.11.2025)
changes:
- cleaned up the SDK by removing unused Expo dependencies that were causing the version conflicts.




| Part | Change (added element) |
|------|----------------------|
| ### 1. Install the Package | If you continue to encounter errors while installing the Vibes SDK, you can install it using the --legacy-peer-deps flag to ensure the Expo dependencies compatibility and the SDK is installed correctly<br><br>npm install --legacy-peer-deps |
| ### 2. Configure the Plugin | iosAppId: process.env.IOS_APP_ID<br>vibesAppEnv: process.env.VIBES_APP_ENV || "UAT" |
| ### 3. Environment Variables | iosAppId: process.env.IOS_APP_ID<br>vibesAppEnv: process.env.VIBES_APP_ENV || "UAT"<br><br>## Setting Environment Variables for EAS Cloud Build<br>eas secret:create --name IOS_APP_ID --value your-ios-app-id<br>eas secret:create --name VIBES_APP_ENV --value UAT<br><br>### Setting EAS Secrets<br>eas secret:create --name IOS_APP_ID --value your-ios-app-id<br>eas secret:create --name VIBES_APP_ENV --value UAT |
| ### 4. Configure EAS Build | (1) "development": {<br>      "ios": { "buildConfiguration": "Debug" }<br>      "env": {<br>        "IOS_APP_ID": "$IOS_APP_ID",<br>        "VIBES_APP_ENV": "$VIBES_APP_ENV"<br>      }<br>    },<br>(2) "preview": {<br>      "ios": { "buildConfiguration": "Release" }<br>      "env": {<br>        "IOS_APP_ID": "$IOS_APP_ID",<br>        "VIBES_APP_ENV": "$VIBES_APP_ENV"<br>      }<br>    },<br>(3) "production": {<br>      "ios": { "buildConfiguration": "Release" }<br>      "env": {<br>        "IOS_APP_ID": "$IOS_APP_ID",<br>        "VIBES_APP_ENV": "$VIBES_APP_ENV"<br>      }<br>    } |
| ### 5. Create Development Build | # For iOS development build<br>eas build --profile development --platform ios |
| ## iOS Configuration Details | ### Automatic Configuration<br><br>The plugin automatically configures the native iOS files during the EAS build process. You don't need to manually edit these files:<br><br>#### Info.plist<br>The plugin automatically adds these keys:<br><br><key>VibesAppId</key><br><string>$(VIBES_APP_ID)</string><br><key>VibesApiUrl</key><br><string>$(VIBES_API_URL)</string><br><key>VibesAppEnv</key><br><string>$(VIBES_APP_ENV)</string><br><br>#### AppDelegate.swift<br>The plugin automatically initializes the Vibes SDK:<br><br>import VibesSDK<br><br>// In your AppDelegate.swift<br>func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {<br>   // Vibes SDK is automatically initialized<br>   return true<br>} |
| ## Minimum Requirements | ### iOS<br>- iOS Version: 13.0+<br>- Xcode Version: 15.0+<br>- Swift Version: 5.0+ |
| ## Troubleshooting -> ### Common Issues -> #### 1. Build Errors | 4. iOS Production Deployment Issues<br>eas build --profile development --platform ios --clear-cache<br>eas build --profile development --platform ios |
| ## Troubleshooting -> ### Common Issues -> #### 4. iOS Production Deployment Issues | Before submitting to App Store:<br>1. Test with Production Certificate: Use production push notification certificate<br>2. Check Certificates and Provisioning Profiles: Verify all certificates and provisioning profiles are valid and properly configured<br>3. Test Push Notifications: Verify notifications work with production configuration |
| ## Troubleshooting -> ### Common Issues -> #### 3. Plugin Not Applied | eas build --profile development --platform ios --clear-cache |
| ## Debug Steps | 5. Create production build when ready to deploy: eas build --profile production --platform android or eas build --profile production --platform ios |


