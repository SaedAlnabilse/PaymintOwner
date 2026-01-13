/**
 * Mock for react-native-image-picker
 * Used in Jest tests to avoid native module issues
 */

module.exports = {
  launchImageLibrary: jest.fn(() =>
    Promise.resolve({
      didCancel: false,
      assets: [
        {
          uri: 'file://mock-image.jpg',
          type: 'image/jpeg',
          fileName: 'mock-image.jpg',
          fileSize: 1000,
          width: 100,
          height: 100,
        },
      ],
    })
  ),
  launchCamera: jest.fn(() =>
    Promise.resolve({
      didCancel: false,
      assets: [
        {
          uri: 'file://mock-camera-image.jpg',
          type: 'image/jpeg',
          fileName: 'mock-camera-image.jpg',
          fileSize: 1000,
          width: 100,
          height: 100,
        },
      ],
    })
  ),
  Asset: {},
  ImagePickerResponse: {},
  MediaType: {
    photo: 'photo',
    video: 'video',
    mixed: 'mixed',
  },
  CameraOptions: {},
  ImageLibraryOptions: {},
};
