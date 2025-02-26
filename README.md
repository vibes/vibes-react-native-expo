# vibes-react-native-expo

Push SDK for Expo

## Installation

```sh
npx expo install vibes-react-native-expo
```

## Usage
```js
import Vibes from 'vibes-react-native-expo';
```

## Setup

### Android
In your `expo-build-properties` plugin, add the following repository to your `gradle.properties`.

```json
"plugins": [
  [
    "expo-build-properties",
    {
      "android": {
        "repositories": {
            maven {
                url "https://maven.pkg.github.com/vibes/android-sdk-repository"
                credentials {
                    username = System.getenv("VIBES_GITHUB_USERNAME") ?: ""
                    password = System.getenv("VIBES_GITHUB_PASSWORD") ?: ""
                }
            }
        }
      }
    }
  ]
]
```

Also, set the required manifest placeholders in your `app.json`:

```json
"android": {
  "config": {
    "googleServicesFile": "./google-services.json"
  },
  "manifestPlaceholders": {
    "vibesAppId": "YOUR_VIBES_APPID",
    "vibesApiUrl": "VIBES_API_URL"
  }
}
```

### iOS
In your `app.json` or `app.config.js`, add the following to the `expo.plugins` section:

```json
"expo.plugins": [
  [
    "expo-build-properties",
    {
      "ios": {
        "infoPlist": {
          "VibesAppId": "YOUR_VIBES_APPID",
          "VibesApiURL": "VIBES_API_URL"
        }
      }
    }
  ]
]
```

## Push Notifications Usage
The SDK automatically registers the device and push token when the app starts.

### Registering and Unregistering
```js
await VibesReactNativeExpo.registerDevice();
await VibesReactNativeExpo.unregisterDevice();
await VibesReactNativeExpo.registerPush();
await VibesReactNativeExpo.unregisterPush();
```

### Get Device Info
```js
const deviceInfo = await VibesReactNativeExpo.getVibesDeviceInfo();
console.log(deviceInfo);
```

### Handling Push Notifications
Register event listeners to handle push notifications:

```js
import { addEventListener } from 'vibes-react-native-expo';

addEventListener('pushReceived', (event) => {
  console.log('Push received:', event.payload);
});

addEventListener('pushOpened', (event) => {
  console.log('Push opened:', event.payload);
});
```

### Associate a Person
```js
await VibesReactNativeExpo.associatePerson('user@example.com');
```

### Fetch Inbox Messages
```js
const messages = await VibesReactNativeExpo.fetchInboxMessages();
console.log(messages);
```

### Mark Inbox Message as Read
```js
await VibesReactNativeExpo.markInboxMessageAsRead('message_uid');
```

### Expire an Inbox Message
```js
await VibesReactNativeExpo.expireInboxMessage('message_uid');
```

## Rich Push Support
For Android, ensure your project includes the appropriate drawable icon and notification sound settings. For iOS, add a `Notification Service Extension` to support rich push notifications.

For more details, refer to the [Vibes documentation](https://developer.vibes.com/).

## License

MIT
