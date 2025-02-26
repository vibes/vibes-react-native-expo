import { NativeModule, requireNativeModule } from 'expo';

import { VibesReactNativeExpoModuleEvents } from './VibesReactNativeExpo.types';

declare class VibesReactNativeExpoModule extends NativeModule<VibesReactNativeExpoModuleEvents> {
  SDKBuildVersion: string;
  registerDevice(): void;
  unregisterDevice(): void;
  registerPush(): void;
  unregisterPush(): void;
  associatePerson(externalPersonId: string): void;
  updateDevice(updateCredentials: boolean, lat: number, lon: number): void;
  getPerson(): Promise<string>;
  fetchInboxMessages(): [string];
  fetchInboxMessage(messageId: string): string;
  markInboxMessageAsRead(messageId: string): string;
  expireInboxMessage(messageId: string): string;
  onInboxMessageOpen(messageId: string): string;
  onInboxMessagesFetched(): string;
  setValueAsync(value: string): Promise<void>;
}

export default requireNativeModule<VibesReactNativeExpoModule>('VibesReactNativeExpo');
