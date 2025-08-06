import { Platform } from 'react-native';

let firebaseApp = null;
let firebaseMessaging = null;

if (Platform.OS === 'android') {
  try {
    const firebase = require('@react-native-firebase/app');
    const messaging = require('@react-native-firebase/messaging');
    
    firebaseApp = firebase.default;
    firebaseMessaging = messaging.default;
    
    console.log('✅ Firebase loaded successfully on Android');
  } catch (error) {
    console.warn('⚠️ Firebase not available on Android:', error.message);
  }
} else {
  console.log('ℹ️ Firebase disabled on iOS');
}

export { firebaseApp, firebaseMessaging }; 