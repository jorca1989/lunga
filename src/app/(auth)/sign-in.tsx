import React, { useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSignIn, useClerk } from '@clerk/expo';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';


export default function SignInScreen() {
  const theme = useTheme();
  const clerk = useClerk();
  const { signIn } = useSignIn() as any;
  const isLoaded = clerk.loaded;
  const setActive = clerk.setActive;
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleSignIn = async () => {
    if (!isLoaded) return;
    setEmailError('');
    setPasswordError('');

    if (!email.trim()) { setEmailError('Insira o seu e-mail.'); return; }
    if (!password) { setPasswordError('Insira a sua senha.'); return; }

    setLoading(true);
    try {
      console.log("[SignIn] Attempting login for:", email.trim());
      const result = await signIn.create({
        identifier: email.trim(),
        password,
      });

      if (result.error) {
        throw result.error;
      }

      const signInResource = result.signIn || result;
      console.log("[SignIn] Resolved status:", signInResource?.status);

      if (signInResource && signInResource.status === 'complete') {
        console.log("[SignIn] Login complete. Activating session:", signInResource.createdSessionId);
        await setActive({ session: signInResource.createdSessionId });
        router.replace('/');
      } else {
        console.log("[SignIn] Login status not complete:", JSON.stringify(result, null, 2));
        Alert.alert('Erro', `Não foi possível fazer login (Estado: ${signInResource?.status || 'desconhecido'}). Tente novamente.`);
      }
    } catch (err: any) {
      console.error("[SignIn] Auth error caught:", err);
      const code = err?.errors?.[0]?.code;
      if (code === 'form_password_incorrect') {
        setPasswordError('Senha incorrecta. Tente novamente.');
      } else if (code === 'form_identifier_not_found') {
        setEmailError('Não encontrámos nenhuma conta com este e-mail.');
      } else {
        Alert.alert('Erro', err?.errors?.[0]?.message || 'Erro desconhecido.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <View style={{ height: Spacing.four }} />

          {/* Card */}
          <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText style={styles.cardTitle}>Entrar na conta</ThemedText>

            {/* Email field */}
            <View style={styles.fieldGroup}>
              <ThemedText type="smallBold" style={styles.label}>E-mail</ThemedText>
              <View style={[styles.inputWrapper, { borderColor: emailError ? '#FF3B30' : theme.backgroundSelected }]}>
                <Ionicons name="mail-outline" size={18} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="nome@exemplo.com"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>
              {!!emailError && <ThemedText style={styles.fieldError}>{emailError}</ThemedText>}
            </View>

            {/* Password field */}
            <View style={styles.fieldGroup}>
              <ThemedText type="smallBold" style={styles.label}>Senha</ThemedText>
              <View style={[styles.inputWrapper, { borderColor: passwordError ? '#FF3B30' : theme.backgroundSelected }]}>
                <Ionicons name="lock-closed-outline" size={18} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="A sua senha"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.textSecondary} />
                </Pressable>
              </View>
              {!!passwordError && <ThemedText style={styles.fieldError}>{passwordError}</ThemedText>}
            </View>

            {/* Sign in button */}
            <Pressable
              onPress={handleSignIn}
              disabled={loading}
              style={{ width: '100%', marginTop: Spacing.two }}
            >
              <LinearGradient
                colors={['#CE1126', '#000000']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.signInBtn, { marginTop: 0, opacity: loading ? 0.7 : 1 }]}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="log-in-outline" size={20} color="#FFF" />
                    <ThemedText style={styles.signInBtnText}>Entrar</ThemedText>
                  </>
                )}
              </LinearGradient>
            </Pressable>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />
              <ThemedText type="small" themeColor="textSecondary" style={styles.dividerText}>ou</ThemedText>
              <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />
            </View>

            {/* Register link */}
            <View style={styles.registerRow}>
              <ThemedText type="small" themeColor="textSecondary">Não tem conta? </ThemedText>
              <Link href="/(auth)/sign-up" asChild>
                <Pressable>
                  <ThemedText type="smallBold" style={{ color: '#FCD116' }}>Registar-se</ThemedText>
                </Pressable>
              </Link>
            </View>
          </View>

          {/* Footer note */}
          <ThemedText type="small" themeColor="textSecondary" style={styles.footerNote}>
            Ao entrar, aceita os Termos de Serviço e a Política de Privacidade da plataforma Minha Banda.
          </ThemedText>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.three, paddingBottom: Spacing.five },
  heroSection: { alignItems: 'center', paddingTop: Spacing.five, paddingBottom: Spacing.four },
  logoCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(32, 138, 239, 0.12)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.three,
  },
  appName: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5, marginBottom: 4 },
  tagline: { textAlign: 'center', lineHeight: 18 },
  card: { borderRadius: 24, padding: Spacing.four, marginBottom: Spacing.three },
  cardTitle: { fontSize: 20, fontWeight: '800', marginBottom: Spacing.four },
  fieldGroup: { marginBottom: Spacing.three },
  label: { fontSize: 13, marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 14, height: 50,
    paddingHorizontal: Spacing.three,
  },
  inputIcon: { marginRight: Spacing.two },
  input: { flex: 1, fontSize: 15 },
  eyeBtn: { padding: 4 },
  fieldError: { fontSize: 12, color: '#FF3B30', marginTop: 4 },
  signInBtn: {
    backgroundColor: '#CE1126', height: 52, borderRadius: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 8, marginTop: Spacing.two,
  },
  signInBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.three },
  divider: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: Spacing.two },
  registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerNote: { textAlign: 'center', lineHeight: 18, marginTop: Spacing.three, fontSize: 11 },
});
