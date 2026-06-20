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
import { useSignUp, useClerk } from '@clerk/expo';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';


export default function SignUpScreen() {
  const theme = useTheme();
  const clerk = useClerk();
  const { signUp } = useSignUp() as any;
  const isLoaded = clerk.loaded;
  const setActive = clerk.setActive;
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset any active, stuck sign-up sessions on mount to pull the latest Clerk configurations
  React.useEffect(() => {
    if (isLoaded && signUp) {
      signUp.reset().catch((err: any) => {
        console.log('Error resetting signup on mount:', err);
      });
    }
  }, [isLoaded]);

  const handleSignUp = async () => {
    if (!isLoaded) return;
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Insira o seu nome.';
    if (!email.trim()) newErrors.email = 'Insira o seu e-mail.';
    if (!password || password.length < 8) newErrors.password = 'A senha deve ter pelo menos 8 caracteres.';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    setLoading(true);

    try {
      const createRes = await signUp.create({
        firstName: name.trim().split(' ')[0],
        lastName: name.trim().split(' ').slice(1).join(' ') || undefined,
        emailAddress: email.trim(),
        password,
      });
      if (createRes.error) throw createRes.error;

      const sendRes = await signUp.verifications.sendEmailCode();
      if (sendRes.error) throw sendRes.error;

      setPendingVerification(true);
    } catch (err: any) {
      const code = err?.errors?.[0]?.code;
      if (code === 'form_identifier_exists') {
        setErrors({ email: 'Já existe uma conta com este e-mail.' });
      } else {
        Alert.alert('Erro', err?.errors?.[0]?.message || 'Erro ao criar conta.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!isLoaded) return;
    if (!verificationCode.trim()) { setErrors({ code: 'Insira o código enviado para o seu e-mail.' }); return; }
    setErrors({});
    setLoading(true);

    try {
      // Use the correct method for SignUpFuture
      const result = await signUp.verifications.verifyEmailCode({
        code: verificationCode.trim(),
      });

      if (result.error) throw result.error;

      // Read state directly from the resolved hook instance to avoid stale closures
      if (signUp && signUp.status === 'complete') {
        await setActive({ session: signUp.createdSessionId });
        router.replace('/');
      } else {
        const statusStr = signUp?.status || 'desconhecido';
        const missingFields = signUp?.missingFields ? JSON.stringify(signUp.missingFields) : 'nenhum';
        const unverifiedFields = signUp?.unverifiedFields ? JSON.stringify(signUp.unverifiedFields) : 'nenhum';
        Alert.alert(
          'Erro de Registo',
          `Verificação incompleta.\nEstado: ${statusStr}\nCampos em falta: ${missingFields}\nCampos não verificados: ${unverifiedFields}`
        );
      }
    } catch (err: any) {
      const code = err?.errors?.[0]?.code;
      if (code === 'form_code_incorrect') {
        setErrors({ code: 'Código incorrecto. Verifique o seu e-mail.' });
      } else if (code === 'already_verified' || err?.message?.includes('already verified') || err?.errors?.[0]?.message?.includes('already verified')) {
        // If already verified, check the status on the signUp object
        const signUpResource = signUp;
        if (signUpResource && signUpResource.status === 'complete') {
          await setActive({ session: signUpResource.createdSessionId });
          router.replace('/');
        } else {
          const statusStr = signUpResource?.status || 'desconhecido';
          const missingFields = signUpResource?.missingFields ? JSON.stringify(signUpResource.missingFields) : 'nenhum';
          const unverifiedFields = signUpResource?.unverifiedFields ? JSON.stringify(signUpResource.unverifiedFields) : 'nenhum';
          Alert.alert(
            'Erro de Registo',
            `E-mail já verificado, mas o registo está incompleto.\nEstado: ${statusStr}\nCampos em falta: ${missingFields}\nCampos não verificados: ${unverifiedFields}`
          );
        }
      } else {
        Alert.alert('Erro', err?.errors?.[0]?.message || 'Erro ao verificar código.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.heroSection}>
              <View style={styles.logoCircle}>
                <Ionicons name="mail-open-outline" size={44} color="#FCD116" />
              </View>
              <ThemedText style={styles.appName}>Verifique o seu E-mail</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.tagline}>
                Enviámos um código de 6 dígitos para{'\n'}{email}
              </ThemedText>
            </View>

            <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.fieldGroup}>
                <ThemedText type="smallBold" style={styles.label}>Código de Verificação</ThemedText>
                <View style={[styles.inputWrapper, { borderColor: errors.code ? '#FF3B30' : theme.backgroundSelected }]}>
                  <Ionicons name="key-outline" size={18} color={theme.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    placeholder="123456"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
                {!!errors.code && <ThemedText style={styles.fieldError}>{errors.code}</ThemedText>}
              </View>

              <Pressable
                onPress={handleVerify}
                disabled={loading}
                style={{ width: '100%', marginTop: Spacing.two }}
              >
                <LinearGradient
                  colors={['#CE1126', '#000000']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.signInBtn, { marginTop: 0, opacity: loading ? 0.7 : 1 }]}
                >
                  {loading ? <ActivityIndicator color="#FFF" /> : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                      <ThemedText style={styles.signInBtnText}>Verificar Conta</ThemedText>
                    </>
                  )}
                </LinearGradient>
              </Pressable>

              <Pressable onPress={async () => {
                const res = await signUp.verifications.sendEmailCode();
                if (res.error) Alert.alert('Erro', res.error.message || 'Erro ao reenviar código.');
                else Alert.alert('Sucesso', 'Código de verificação reenviado.');
              }} style={styles.resendBtn}>
                <ThemedText type="small" themeColor="textSecondary">Não recebeu? </ThemedText>
                <ThemedText type="smallBold" style={{ color: '#FCD116' }}>Reenviar código</ThemedText>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={{ height: Spacing.four }} />

          <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
            {/* Name */}
            <View style={styles.fieldGroup}>
              <ThemedText type="smallBold" style={styles.label}>Nome Completo</ThemedText>
              <View style={[styles.inputWrapper, { borderColor: errors.name ? '#FF3B30' : theme.backgroundSelected }]}>
                <Ionicons name="person-outline" size={18} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Manuel Dos Santos"
                  placeholderTextColor={theme.textSecondary}
                  autoComplete="name"
                />
              </View>
              {!!errors.name && <ThemedText style={styles.fieldError}>{errors.name}</ThemedText>}
            </View>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <ThemedText type="smallBold" style={styles.label}>E-mail</ThemedText>
              <View style={[styles.inputWrapper, { borderColor: errors.email ? '#FF3B30' : theme.backgroundSelected }]}>
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
              {!!errors.email && <ThemedText style={styles.fieldError}>{errors.email}</ThemedText>}
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <ThemedText type="smallBold" style={styles.label}>Senha</ThemedText>
              <View style={[styles.inputWrapper, { borderColor: errors.password ? '#FF3B30' : theme.backgroundSelected }]}>
                <Ionicons name="lock-closed-outline" size={18} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Mínimo 8 caracteres"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry={!showPassword}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.textSecondary} />
                </Pressable>
              </View>
              {!!errors.password && <ThemedText style={styles.fieldError}>{errors.password}</ThemedText>}
            </View>

            <Pressable
              onPress={handleSignUp}
              disabled={loading}
              style={{ width: '100%', marginTop: Spacing.two }}
            >
              <LinearGradient
                colors={['#CE1126', '#000000']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.signInBtn, { marginTop: 0, opacity: loading ? 0.7 : 1 }]}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : (
                  <>
                    <Ionicons name="rocket-outline" size={20} color="#FFF" />
                    <ThemedText style={styles.signInBtnText}>Criar Conta</ThemedText>
                  </>
                )}
              </LinearGradient>
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />
              <ThemedText type="small" themeColor="textSecondary" style={styles.dividerText}>ou</ThemedText>
              <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />
            </View>

            <View style={styles.registerRow}>
              <ThemedText type="small" themeColor="textSecondary">Já tem conta? </ThemedText>
              <Link href="/(auth)/sign-in" asChild>
                <Pressable>
                  <ThemedText type="smallBold" style={{ color: '#FCD116' }}>Entrar</ThemedText>
                </Pressable>
              </Link>
            </View>
          </View>
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
    backgroundColor: 'rgba(252, 209, 22, 0.12)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.three,
  },
  appName: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5, marginBottom: 4 },
  tagline: { textAlign: 'center', lineHeight: 18 },
  card: { borderRadius: 24, padding: Spacing.four, marginBottom: Spacing.three },
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
  resendBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.three },
});
