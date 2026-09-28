# Android Release Build Guide

## Prerequisites
- Java JDK installed (for keytool)
- Android SDK and build tools installed
- React Native project set up

## Step 1: Generate a Release Keystore

**IMPORTANT:** Keep this keystore file safe! You'll need it for all future updates.

Run this command in your terminal (from the project root):

```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias pulse-release-key -keyalg RSA -keysize 2048 -validity 10000
```

You'll be prompted to enter:
- **Keystore password**: Choose a strong password (remember this!)
- **Key password**: Use the same password (or different, but remember it)
- **Your name**: Your name or organization
- **Organizational Unit**: Your department/team
- **Organization**: Your company name
- **City**: Your city
- **State**: Your state/province
- **Country code**: Two-letter code (e.g., US, IN)

**Example:**
```
Enter keystore password: [your-password]
Re-enter new password: [your-password]
What is your first and last name?
  [Unknown]: Manish Kumar
What is the name of your organizational unit?
  [Unknown]: Development
What is the name of your organization?
  [Unknown]: Pulse
What is the name of your City or Locality?
  [Unknown]: Your City
What is the name of your State or Province?
  [Unknown]: Your State
What is the two-letter country code for this unit?
  [Unknown]: IN
```

## Step 2: Configure Keystore in build.gradle

1. Create a file `android/keystore.properties` (add this to `.gitignore`!):

```properties
PULSE_RELEASE_STORE_FILE=release.keystore
PULSE_RELEASE_KEY_ALIAS=pulse-release-key
PULSE_RELEASE_STORE_PASSWORD=your-keystore-password
PULSE_RELEASE_KEY_PASSWORD=your-key-password
```

2. Update `android/app/build.gradle` to use the release keystore:

```gradle
// Add this at the top of the file (after the plugins)
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

// Then update the signingConfigs section:
signingConfigs {
    debug {
        storeFile file('debug.keystore')
        storePassword 'android'
        keyAlias 'androiddebugkey'
        keyPassword 'android'
    }
    release {
        if (keystorePropertiesFile.exists()) {
            storeFile file(keystoreProperties['PULSE_RELEASE_STORE_FILE'])
            storePassword keystoreProperties['PULSE_RELEASE_STORE_PASSWORD']
            keyAlias keystoreProperties['PULSE_RELEASE_KEY_ALIAS']
            keyPassword keystoreProperties['PULSE_RELEASE_KEY_PASSWORD']
        }
    }
}

// Update buildTypes to use release signing:
buildTypes {
    debug {
        signingConfig signingConfigs.debug
    }
    release {
        signingConfig signingConfigs.release
        minifyEnabled enableProguardInReleaseBuilds
        proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
    }
}
```

## Step 3: Update Version Information

Before building, update your version in `android/app/build.gradle`:

```gradle
defaultConfig {
    applicationId "com.mk.pulse"
    minSdkVersion rootProject.ext.minSdkVersion
    targetSdkVersion rootProject.ext.targetSdkVersion
    versionCode 2  // Increment this for each release (1, 2, 3, ...)
    versionName "1.0.1"  // Update this to your app version
}
```

## Step 4: Build the Release APK

### Option A: Build APK (for direct installation)

```bash
cd android
./gradlew assembleRelease
```

The APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

### Option B: Build AAB (for Google Play Store - RECOMMENDED)

```bash
cd android
./gradlew bundleRelease
```

The AAB will be at: `android/app/build/outputs/bundle/release/app-release.aab`

## Step 5: Test the Release Build

Before publishing, test the release build:

```bash
# Install on connected device
cd android
./gradlew installRelease

# Or manually install the APK
adb install app/build/outputs/apk/release/app-release.apk
```

## Step 6: Verify the Build

Check that your app is properly signed:

```bash
# For APK
jarsigner -verify -verbose -certs android/app/build/outputs/apk/release/app-release.apk

# For AAB (use bundletool or check in Play Console)
```

## Important Notes

1. **Never commit `keystore.properties` or `release.keystore` to git!**
   - Add to `.gitignore`:
     ```
     android/keystore.properties
     android/app/release.keystore
     ```

2. **Backup your keystore** - Store it in a secure location. If you lose it, you cannot update your app on Google Play.

3. **Version Code** must increment with each release (1, 2, 3, ...)

4. **Version Name** is what users see (1.0.0, 1.0.1, etc.)

5. **For Google Play Store**, always use AAB (Android App Bundle) format, not APK.

## Troubleshooting

### Build fails with "keystore.properties not found"
- Make sure the file exists at `android/keystore.properties`
- Check file permissions

### "Keystore was tampered with, or password was incorrect"
- Double-check your passwords in `keystore.properties`
- Make sure there are no extra spaces or quotes

### Build is slow
- First build takes longer, subsequent builds are faster
- Close other applications to free up memory

## Next Steps

After building:
1. Test the release APK/AAB thoroughly
2. Upload AAB to Google Play Console (Internal Testing first)
3. Submit for review when ready




