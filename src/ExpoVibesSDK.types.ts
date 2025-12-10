export type ExpoVibesSDKModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
  onGetPerson: (params: GetPersonEventPayload) => void;
  onFetchInboxMessages: (params: FetchInboxMessagesEventPayload) => void;
  onFetchInboxMessage: (params: FetchInboxMessageEventPayload) => void;
  onMarkInboxMessageAsRead: (params: MarkInboxMessageAsReadEventPayload) => void;
  onExpireInboxMessage: (params: ExpireInboxMessageEventPayload) => void;
  onInboxMessageOpenEvent: (params: InboxMessageOpenEventPayload) => void;
  onInboxMessagesFetchedEvent: (params: InboxMessagesFetchedEventPayload) => void;
};

export type Message = {
  id: string;
  title: string;
  body: string;
  mainImage: string;
  iconImage: string;
  read: boolean;
  expired: boolean;
};

export type ChangeEventPayload = {
  value: string;
};

export type GetPersonEventPayload = {
  person: string;
};

export type FetchInboxMessagesEventPayload = {
  messages: Message[];
};

export type FetchInboxMessageEventPayload = {
  message: Message;
};

export type MarkInboxMessageAsReadEventPayload = {
  messages: number;
};

export type ExpireInboxMessageEventPayload = {
  messages: number;
};

export type InboxMessageOpenEventPayload = {
  message: string;
};

export type InboxMessagesFetchedEventPayload = {
  message: string;
};

export interface ExpoVibesSDKModuleInterface {
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
