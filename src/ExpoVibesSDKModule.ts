import { NativeModule, requireNativeModule } from "expo";

import { ExpoVibesSDKModuleEvents, ExpoVibesSDKModuleInterface } from "./ExpoVibesSDK.types";

declare class ExpoVibesSDKModule extends NativeModule<ExpoVibesSDKModuleEvents> implements ExpoVibesSDKModuleInterface {
  SDKBuildVersion: string;
  
  initializeVibes(): Promise<void>;
  registerDevice(): Promise<string>;
  unregisterDevice(): Promise<string>;
  registerPush(): Promise<string>;
  unregisterPush(): Promise<string>;
  associatePerson(externalPersonId: string): Promise<string>;
  updateDevice(updateCredentials: boolean, lat: number, lon: number): Promise<string>;
  getPerson(): Promise<string>;
  fetchInboxMessages(): Promise<Array<{
    id: string;
    title: string;
    body: string;
    read: boolean;
    expired: boolean;
  }>>;
  fetchInboxMessage(messageId: string): Promise<{
    id: string;
    title: string;
    body: string;
    read: boolean;
    expired: boolean;
  }>;
  markInboxMessageAsRead(messageId: string): Promise<string>;
  expireInboxMessage(messageId: string): Promise<string>;
  onInboxMessageOpen(messageId: string): Promise<string>;
  onInboxMessagesFetched(): Promise<string>;
  getVibesDeviceInfo(): Promise<any>;
  setValueAsync(value: string): Promise<void>;
  getSDKVersion(): Promise<string>;
}

export default requireNativeModule<ExpoVibesSDKModule>("ExpoVibesSDK");
