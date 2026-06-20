import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { Redirect, Slot, useSegments } from 'expo-router';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { OfflineSyncProvider } from '@/hooks/use-offline-sync';

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL!;
const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

const convex = new ConvexReactClient(convexUrl);

/** Inner component — can use Clerk hooks since it's inside ClerkProvider */
function AppShell() {
  const { isSignedIn, isLoaded } = useAuth();
  const segments = useSegments();
  const colorScheme = useColorScheme();

  const inAuthGroup = segments[0] === '(auth)';

  return (
    <ConvexProvider client={convex}>
      <OfflineSyncProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AnimatedSplashOverlay />
          {/* Route based on auth state */}
          {!isLoaded ? null : isSignedIn ? (
            inAuthGroup ? (
              <Redirect href="/" />
            ) : (
              <AppTabs />
            )
          ) : inAuthGroup ? (
            <Slot />
          ) : (
            <Redirect href="/(auth)/welcome" />
          )}
        </ThemeProvider>
      </OfflineSyncProvider>
    </ConvexProvider>
  );
}

export default function TabLayout() {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      <AppShell />
    </ClerkProvider>
  );
}
