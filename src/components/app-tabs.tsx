import { Tabs } from 'expo-router';
import { useColorScheme, Platform, View, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

function getTabIconName(name: string, focused: boolean): any {
  switch (name) {
    case 'index':
      return focused ? 'newspaper-variant' : 'newspaper-variant-outline';
    case 'map':
      return focused ? 'map-marker' : 'map-marker-outline';
    case 'activity':
      return focused ? 'bell' : 'bell-outline';
    case 'profile':
      return focused ? 'account-circle' : 'account-circle-outline';
    default:
      return 'help-circle-outline';
  }
}

const TAB_LABELS: Record<string, string> = {
  index:    'Feed',
  map:      'Mapa',
  activity: 'Atividade',
  profile:  'Perfil',
};

function CustomTabButton({ onPress }: any) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.fabContainer,
        pressed && { opacity: 0.9, transform: [{ scale: 0.95 }] }
      ]}
    >
      <LinearGradient
        colors={['#CE1126', '#000000']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fab}
      >
        <MaterialCommunityIcons name="camera-plus" size={28} color="#FCD116" />
      </LinearGradient>
    </Pressable>
  );
}

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();
  
  const ACTIVE_COLOR = '#FCD116'; // New gradient-matched yellow accent color
  const INACTIVE_COLOR = scheme === 'dark' ? '#999999' : '#777777';

  // Calculate bottom padding dynamically based on safe area insets on both Android & iOS
  // Added an extra 8dp of clearance as requested by the user to prevent cutoff by system bars/gestures
  const TAB_PADDING_BOTTOM = (insets.bottom > 0 ? insets.bottom : 12) + 8;
  const TAB_HEIGHT = 62 + TAB_PADDING_BOTTOM; // Height adjusts dynamically to clear gesture/navigation bars

  const screenOptions = (name: string): any => ({
    title: TAB_LABELS[name],
    tabBarActiveTintColor: ACTIVE_COLOR,
    tabBarInactiveTintColor: INACTIVE_COLOR,
    tabBarHideOnKeyboard: true, // Hide tab bar when keyboard is open
    tabBarStyle: {
      backgroundColor: colors.backgroundElement,
      borderTopColor: scheme === 'dark' ? 'rgba(255,255,255,0.08)' : '#ECECEC',
      borderTopWidth: 1,
      height: TAB_HEIGHT,
      paddingBottom: TAB_PADDING_BOTTOM,
      paddingTop: 8,
      elevation: 20,
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
    },
    tabBarLabelStyle: {
      fontSize: 11,
      fontWeight: '600' as const,
      marginTop: 4,
    },
    tabBarItemStyle: {
      justifyContent: 'center',
    },
    tabBarIcon: ({ color, focused }: { color: any; focused: boolean }) => (
      <MaterialCommunityIcons name={getTabIconName(name, focused)} size={24} color={color} />
    ),
    headerShown: false,
  });

  return (
    <Tabs>
      {/* Hide auth routes group from navigation bar and suppress headers/titles */}
      <Tabs.Screen 
        name="(auth)" 
        options={{ 
          href: null,
          headerShown: false,
          title: "",
        }} 
      />
      
      <Tabs.Screen name="index"    options={screenOptions('index')} />
      <Tabs.Screen name="map"      options={screenOptions('map')} />
      
      {/* Middle Tab: Floating Action Button (FAB) */}
      <Tabs.Screen 
        name="report"   
        options={{
          title: 'Reportar',
          tabBarButton: (props) => <CustomTabButton {...props} />,
          headerShown: false,
        }} 
      />
      
      <Tabs.Screen name="activity" options={screenOptions('activity')} />
      <Tabs.Screen name="profile"  options={screenOptions('profile')} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    height: 70,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});
