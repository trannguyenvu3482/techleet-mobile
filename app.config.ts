module.exports = {
  expo: {
    name: "TechLeet",
    slug: "techleet",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    scheme: "techleet",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.techleet.app"
    },
    android: {
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.techleet.app"
    },
    web: {
      output: "static",
      favicon: "./assets/icon.png",
      bundler: "metro"
    },
    plugins: [
      "expo-router",
      [
        "expo-build-properties",
        {
          android: {
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            buildToolsVersion: "35.0.0",
            usesCleartextTraffic: true
          },
          ios: {
            deploymentTarget: "15.1"
          }
        }
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/icon.png",
          color: "#2563eb",
          sounds: [],
          mode: "production"
        }
      ],
      [
        "expo-calendar",
        {
          calendarPermission: "Allow TechLeet to access your calendar to add interview events."
        }
      ]
    ],
    notification: {
      icon: "./assets/icon.png",
      color: "#2563eb",
      iosDisplayInForeground: true,
      androidMode: "default"
    },
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },
    extra: {
      eas: {
        projectId: "4f7ecbdd-a1bc-44a6-87c3-bc5d2572071b"
      }
    }
  }
}
