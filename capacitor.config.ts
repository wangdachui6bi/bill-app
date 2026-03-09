import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.billapp.notebook',
  appName: '记账小本',
  webDir: 'dist',
  android: {
    path: 'android',
  },
};

export default config;
