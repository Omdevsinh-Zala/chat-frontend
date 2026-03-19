export const environment = {
  isProduction: false,
  recordingToken: '',
  socketUrl: '',
  apiUrl: '',
  imageUrl: '',
  VAPID_PUBLIC_KEY: '',
  backetName: '',
  get imageBaseUrl() {
    return ''
  },
  encryptKey: {
    salt: '0',
    iv: '0',
    iterations: 0,
  }
};
