import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.harbordental.clinic',
  appName: 'Harbor Dental',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      iconColor: '#287f91',
    },
  },
};

export default config;
