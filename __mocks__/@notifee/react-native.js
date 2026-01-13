/**
 * Mock for @notifee/react-native
 * Used in Jest tests to avoid native module issues
 */

module.exports = {
  displayNotification: jest.fn(() => Promise.resolve('notification-id')),
  cancelNotification: jest.fn(() => Promise.resolve()),
  cancelAllNotifications: jest.fn(() => Promise.resolve()),
  createChannel: jest.fn(() => Promise.resolve('channel-id')),
  deleteChannel: jest.fn(() => Promise.resolve()),
  getChannels: jest.fn(() => Promise.resolve([])),
  requestPermission: jest.fn(() =>
    Promise.resolve({
      authorizationStatus: 1,
    })
  ),
  getInitialNotification: jest.fn(() => Promise.resolve(null)),
  onForegroundEvent: jest.fn(() => () => {}),
  onBackgroundEvent: jest.fn(() => {}),
  setNotificationCategories: jest.fn(() => Promise.resolve()),
  getBadgeCount: jest.fn(() => Promise.resolve(0)),
  setBadgeCount: jest.fn(() => Promise.resolve()),
  incrementBadgeCount: jest.fn(() => Promise.resolve(1)),
  decrementBadgeCount: jest.fn(() => Promise.resolve(0)),
  getTriggerNotifications: jest.fn(() => Promise.resolve([])),
  getTriggerNotificationIds: jest.fn(() => Promise.resolve([])),
  cancelTriggerNotifications: jest.fn(() => Promise.resolve()),
  isChannelCreated: jest.fn(() => Promise.resolve(true)),
  isChannelBlocked: jest.fn(() => Promise.resolve(false)),
  getNotificationSettings: jest.fn(() =>
    Promise.resolve({
      authorizationStatus: 1,
    })
  ),
  EventType: {
    DISMISSED: 0,
    PRESS: 1,
    ACTION_PRESS: 2,
    DELIVERED: 3,
    APP_BLOCKED: 4,
    CHANNEL_BLOCKED: 5,
    CHANNEL_GROUP_BLOCKED: 6,
    TRIGGER_NOTIFICATION_CREATED: 7,
  },
  AuthorizationStatus: {
    NOT_DETERMINED: -1,
    DENIED: 0,
    AUTHORIZED: 1,
    PROVISIONAL: 2,
  },
  AndroidImportance: {
    DEFAULT: 3,
    HIGH: 4,
    LOW: 2,
    MIN: 1,
    NONE: 0,
  },
  AndroidStyle: {
    BIGPICTURE: 0,
    BIGTEXT: 1,
    INBOX: 2,
    MESSAGING: 3,
  },
  AndroidVisibility: {
    PRIVATE: 0,
    PUBLIC: 1,
    SECRET: -1,
  },
  AndroidCategory: {
    ALARM: 'alarm',
    CALL: 'call',
    EMAIL: 'email',
    ERROR: 'err',
    EVENT: 'event',
    MESSAGE: 'msg',
    NAVIGATION: 'navigation',
    PROGRESS: 'progress',
    PROMO: 'promo',
    RECOMMENDATION: 'recommendation',
    REMINDER: 'reminder',
    SERVICE: 'service',
    SOCIAL: 'social',
    STATUS: 'status',
    SYSTEM: 'sys',
    TRANSPORT: 'transport',
  },
};
