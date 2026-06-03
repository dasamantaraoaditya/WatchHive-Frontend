import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.watchhive.app',
  appName: 'WatchHive',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      clientId: '357857516251-f4gpp8f1j70lu1dcnh405ac0t6lch9tf.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
