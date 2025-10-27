# TechLeet Mobile App

A clean React Native mobile application built with Expo and NativeWind.

## Features

- 📱 Cross-platform: iOS, Android, and Web support
- 🎨 Modern UI: NativeWind (Tailwind CSS) for styling
- 🏗️ Clean Architecture: Feature-driven folder structure
- 📦 State Management: Zustand
- 🌐 API Integration: Axios client
- 📱 Navigation: Expo Router with file-based routing
- 🎯 TypeScript: Full type safety
- 🔧 Development Tools: ESLint, Prettier, and Metro bundler
- ⚡ Performance: React Native New Architecture enabled

## Tech Stack

- **Core Framework**: Expo SDK 54, React 19, TypeScript
- **UI**: NativeWind, Expo Vector Icons, RN Reanimated, RN Gesture Handler
- **State Management**: Zustand, AsyncStorage
- **API**: Axios
- **Navigation**: Expo Router, React Navigation
- **Development**: ESLint, Prettier, Metro

## Project Structure

```
mobile/
├── app/                      # Expo Router pages
│   └── index.tsx            # Home screen
├── src/                      # Source code
│   ├── components/          # Reusable UI components
│   ├── screens/             # Screen components
│   ├── services/            # API services
│   ├── hooks/               # Custom hooks
│   ├── types/               # TypeScript types
│   ├── utils/               # Utility functions
│   ├── store/               # State management
│   └── core/                # Core functionality
├── assets/                   # Static assets (images, icons)
└── config files             # Expo, TypeScript, Tailwind, Metro, ESLint
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- yarn or npm
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Installation

1. **Install dependencies**

   ```bash
   yarn install
   ```

2. **Start the development server**

   ```bash
   yarn start
   ```

## Running the App

### Development Commands

```bash
# Start Expo development server
yarn start

# Run on Android device/emulator
yarn android

# Run on iOS device/simulator
yarn ios

# Run on web browser
yarn web

# Run linting
yarn lint

# Prebuild for native development
yarn prebuild
```

### Platform-Specific Setup

#### iOS Development

- Install Xcode from the App Store
- Open iOS Simulator: `yarn ios`

#### Android Development

- Install Android Studio
- Set up Android emulator or connect physical device
- Run: `yarn android`

#### Web Development

- Run: `yarn web`
- Opens in your default browser

## Development

### Adding New Features

1. Create components in `src/components/`
2. Add screens in `src/screens/`
3. Create API services in `src/services/`
4. Add custom hooks in `src/hooks/`
5. Define types in `src/types/`

### Styling with NativeWind

The project uses NativeWind (Tailwind CSS for React Native) for styling:

```typescript
import { View, Text } from "react-native"

export default function MyComponent() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-lg font-bold text-gray-800">
        Welcome
      </Text>
    </View>
  )
}
```

### State Management with Zustand

Example store:

```typescript
import { create } from 'zustand'

interface AppState {
  count: number
  increment: () => void
}

export const useAppStore = create<AppState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}))
```

## Building for Production

```bash
# Build for Android
yarn android:prod

# Build for iOS
yarn ios:prod
```

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [NativeWind Documentation](https://www.nativewind.dev/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Expo Router Documentation](https://expo.github.io/router/)
