import { PermissionsAndroid, Platform } from 'react-native';
import { Camera } from 'react-native-vision-camera';


export async function getPushNotificationPermission() {
  const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;

  const hasPermission = await PermissionsAndroid.check(permission);
  if (hasPermission) {
    return true;
  }

  const status = await PermissionsAndroid.request(permission);
  return status === PermissionsAndroid.RESULTS.GRANTED;
}

export async function getWriteExtPermission() {
  if (Number(Platform.Version) >= 33) {
    return true;
  }
  const permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;

  const hasPermission = await PermissionsAndroid.check(permission);
  if (hasPermission) {
    return true;
  }

  const status = await PermissionsAndroid.request(permission);
  return status === PermissionsAndroid.RESULTS.GRANTED;
}

export async function getReadExtPermission() {
  if (Number(Platform.Version) >= 33) {
    return true;
  }
  const permission = PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

  const hasPermission = await PermissionsAndroid.check(permission);
  if (hasPermission) {
    return true;
  }

  const status = await PermissionsAndroid.request(permission);
  return status === PermissionsAndroid.RESULTS.GRANTED;
}

export async function getCameraAndMicrophonePermissions() {
  const cameraPermission = Camera.getCameraPermissionStatus();
  if (cameraPermission !== 'granted') {
    const newCameraPermission = await Camera.requestCameraPermission();
    if (newCameraPermission !== 'granted') {
      return false;
    }
  }
  const microphonePermission = Camera.getMicrophonePermissionStatus();
  if (microphonePermission !== 'granted') {
    const newMicrophonePermission = await Camera.requestMicrophonePermission();
    if (newMicrophonePermission !== 'granted') {
      return false;
    }
  }

  return true;
}
