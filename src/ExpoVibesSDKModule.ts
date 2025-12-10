import { NativeModule, requireNativeModule } from "expo";
import { ExpoVibesSDKModuleEvents, ExpoVibesSDKModuleInterface, Message } from "./ExpoVibesSDK.types";

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
  fetchInboxMessages(): Promise<Message[]>;
  fetchInboxMessage(messageId: string): Promise<Message>;
  markInboxMessageAsRead(messageId: string): Promise<string>;
  expireInboxMessage(messageId: string): Promise<string>;
  onInboxMessageOpen(messageId: string): Promise<string>;
  onInboxMessagesFetched(): Promise<string>;
  getVibesDeviceInfo(): Promise<any>;
  setValueAsync(value: string): Promise<void>;
  getSDKVersion(): Promise<string>;
}

export default requireNativeModule<ExpoVibesSDKModule>("ExpoVibesSDK");
