import type { CapacitorConfig } from '@capacitor/cli'

// Mizan Android shell.
// webDir points at apps/web's production build output — this project holds
// no app UI of its own, only the native Android wrapper + config. Run
// `npm run sync:android` from the repo root (builds apps/web with the
// capacitor flag, then `cap sync android`) before opening Android Studio.
const config: CapacitorConfig = {
  appId: 'com.mikarsh.mizan',
  appName: 'Mizan',
  webDir: '../dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 400,
      backgroundColor: '#0F4D45', // Teal 900 — Brand primary
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0F4D45',
    },
  },
}

export default config
