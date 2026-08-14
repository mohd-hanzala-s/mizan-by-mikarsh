import { BiometricAuth } from '@aparajita/capacitor-biometric-auth'

/** Thin wrapper around the native biometric plugin.
 *
 * On web / non-native targets the plugin's web shim reports
 * `isAvailable: false`, so callers can safely use these methods
 * everywhere and simply hide the biometric affordance when it
 * isn't available. */
export const BiometricService = {
  /** Whether the device supports AND has enrolled biometry. */
  async isAvailable(): Promise<boolean> {
    try {
      const result = await BiometricAuth.checkBiometry()
      return result.isAvailable
    } catch {
      return false
    }
  },

  /** Prompt the user to authenticate with their device biometry.
   * Returns true on success, false on cancel/failure/lockout. */
  async unlock(): Promise<boolean> {
    try {
      await BiometricAuth.authenticate({
        reason: 'Unlock Mizan',
        cancelTitle: 'Use PIN',
        allowDeviceCredential: true,
      })
      return true
    } catch {
      return false
    }
  },
}
