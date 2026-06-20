import {
  View,
  StyleSheet,
  Pressable,
  useColorScheme,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export default function WelcomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const colorScheme = useColorScheme();

  const backgroundGradient = colorScheme === 'dark' 
    ? ['#0F172A', '#020617'] as const // Sleek dark slate gradient
    : ['#FFFFFF', '#F1F5F9'] as const; // Elegant light slate gradient

  const accentGradient = ['#CE1126', '#000000'] as const; // Dynamic red-to-black gradient accent

  return (
    <LinearGradient colors={backgroundGradient} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          {/* Logo */}
          <Image
            source={{ uri: 'https://pub-2e19cd5eed3b430fbd424824137b6bde.r2.dev/Lunga%20Logo.png' }}
            style={{ width: 180, height: 180, resizeMode: 'contain' }}
          />

          {/* Tagline */}
          <ThemedText type="small" themeColor="textSecondary" style={styles.tagline}>
            Melhorando Angola, uma ocorrência de cada vez
          </ThemedText>

          {/* Actions Section */}
          <View style={styles.actions}>
            {/* Sign In Button with Linear Gradient */}
            <Pressable onPress={() => router.push('/(auth)/sign-in')} style={styles.primaryPressable}>
              <LinearGradient
                colors={accentGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryButton}
              >
                <ThemedText style={styles.primaryText}>Entrar na Conta</ThemedText>
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
              </LinearGradient>
            </Pressable>

            {/* Sign Up Button (Bordered Accent) */}
            <Pressable
              onPress={() => router.push('/(auth)/sign-up')}
              style={[styles.secondaryButton, { borderColor: '#FCD116' }]}
            >
              <ThemedText style={[styles.secondaryText, { color: '#FCD116' }]}>Criar Nova Conta</ThemedText>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.three,
  },
  heroSection: {
    alignItems: 'center',
    width: '100%',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.15)',
  },
  appName: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
    color: '#FCD116',
    marginBottom: Spacing.one,
  },
  tagline: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
    paddingHorizontal: Spacing.two,
  },
  descCard: {
    marginVertical: Spacing.four,
    paddingHorizontal: Spacing.two,
  },
  descText: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 22,
    color: '#64748B',
  },
  actions: {
    gap: Spacing.two,
    width: '100%',
    marginTop: Spacing.one,
  },
  primaryPressable: {
    width: '100%',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    elevation: 2,
    shadowColor: '#CE1126',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  primaryText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
