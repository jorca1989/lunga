import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Image, Pressable, Switch, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMockUser } from '@/hooks/use-mock-user';
import { useMutation, useQuery } from 'convex/react';
import { useLocalSearchParams, router } from 'expo-router';
import { api } from '../../convex/_generated/api';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import * as ImagePicker from 'expo-image-picker';
import { useUser, useAuth } from '@clerk/expo';
import { LinearGradient } from 'expo-linear-gradient';


interface Badge {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const BADGES: Badge[] = [
  { id: '1', name: 'Primeiro Alerta', icon: 'flag', color: '#34C759' },
  { id: '2', name: 'Caçador de Lixo', icon: 'trash', color: '#FF9500' },
  { id: '3', name: 'Guardião da Via', icon: 'construct', color: '#FF3B30' },
  { id: '4', name: 'Vigilante Cívico', icon: 'eye', color: '#AF52DE' },
  { id: '5', name: 'Super Cidadão', icon: 'trophy', color: '#FFD700' },
];

const getLevelDetails = (reputation: number) => {
  if (reputation < 50) {
    return { level: 1, title: 'Iniciante Cívico', min: 0, max: 50 };
  } else if (reputation < 100) {
    return { level: 2, title: 'Observador Comunitário', min: 50, max: 100 };
  } else if (reputation < 200) {
    return { level: 3, title: 'Guardião da Via', min: 100, max: 200 };
  } else {
    return { level: 4, title: 'Super Cidadão', min: 200, max: 500 };
  }
};

const MOCK_USERS: Record<string, any> = {
  user1: {
    name: "Manuel Dos Santos",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    reputation: 120,
    badges: ["Primeiro Alerta", "Caçador de Lixo", "Guardião da Via"],
    role: "citizen",
  },
  user2: {
    name: "Ana Bela Costa",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    reputation: 85,
    badges: ["Primeiro Alerta"],
    role: "citizen",
  },
  user3: {
    name: "João Francisco",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    reputation: 210,
    badges: ["Vigilante Cívico", "Super Cidadão"],
    role: "operator",
  }
};

export default function ProfileScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams();
  const userId = params.userId as string;

  const [pushEnabled, setPushEnabled] = React.useState(true);
  const [anonymousReporting, setAnonymousReporting] = React.useState(false);

  const { user: clerkUser } = useUser();
  const { signOut } = useAuth();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Terminar Sessão',
      'Tem a certeza que deseja terminar a sua sessão?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (err) {
              console.error('Logout error:', err);
              Alert.alert('Erro', 'Não foi possível terminar a sessão.');
            }
          },
        },
      ]
    );
  };

  const handleUpdateAvatar = async () => {
    if (!isOwnProfile || !clerkUser) return;

    Alert.alert(
      'Atualizar Foto de Perfil',
      'Escolha uma opção:',
      [
        {
          text: 'Tirar Foto',
          onPress: () => pickImage(true),
        },
        {
          text: 'Escolher da Galeria',
          onPress: () => pickImage(false),
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  const pickImage = async (useCamera: boolean) => {
    try {
      let permissionResult;
      if (useCamera) {
        permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      } else {
        permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }

      if (permissionResult.status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de permissão para aceder à câmara ou galeria.');
        return;
      }

      setUploadingAvatar(true);

      const pickerOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      };

      const result = useCamera
        ? await ImagePicker.launchCameraAsync(pickerOptions)
        : await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (!result.canceled && result.assets?.[0]?.base64) {
        const mimeType = result.assets[0].mimeType || 'image/jpeg';
        const base64Image = `data:${mimeType};base64,${result.assets[0].base64}`;

        // Upload to Clerk uploader
        if (clerkUser) {
          await clerkUser.setProfileImage({
            file: base64Image,
          });
        }

        Alert.alert('Sucesso', 'Foto de perfil atualizada com sucesso!');
      }
    } catch (err: any) {
      console.error('Error updating profile image:', err);
      Alert.alert('Erro', 'Não foi possível atualizar a foto de perfil.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Load current user from Convex / Fallback mock
  const currentUser = useMockUser();
  const dbUser = useQuery(
    api.users.getUser,
    userId && userId.length > 8 ? { userId: userId as any } : 'skip'
  ) as any;

  const updateRole = useMutation(api.users.updateRole);

  let profileUser = currentUser;
  let isOwnProfile = true;

  if (userId && userId !== currentUser._id && userId !== currentUser.clerkId) {
    if (dbUser && dbUser._id !== currentUser._id) {
      profileUser = dbUser;
      isOwnProfile = false;
    } else if (MOCK_USERS[userId]) {
      profileUser = MOCK_USERS[userId];
      isOwnProfile = false;
    } else {
      isOwnProfile = false;
    }
  }


  const lvl = getLevelDetails(profileUser.reputation);
  const progressPercent = `${Math.min(100, Math.max(0, ((profileUser.reputation - lvl.min) / (lvl.max - lvl.min)) * 100))}%`;

  const isBadgeUnlocked = (badgeName: string) => {
    return profileUser.badges ? profileUser.badges.includes(badgeName) : false;
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      {!isOwnProfile && (
        <View style={styles.backHeader}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
            <ThemedText style={{ marginLeft: 8, fontWeight: '600' }}>Voltar</ThemedText>
          </Pressable>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.container}>
        {/* User Card */}
        <View style={styles.profileHeader}>
          <Pressable onPress={handleUpdateAvatar} disabled={!isOwnProfile || uploadingAvatar}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: profileUser.avatar }}
                style={styles.avatar}
              />
              {isOwnProfile && (
                <View style={[styles.editAvatarOverlay, { borderColor: theme.background }]}>
                  {uploadingAvatar ? (
                    <ActivityIndicator size="small" color="#FFF" style={{ transform: [{ scale: 0.8 }] }} />
                  ) : (
                    <Ionicons name="camera" size={14} color="#FFF" />
                  )}
                </View>
              )}
            </View>
          </Pressable>
          <ThemedText style={styles.name}>{profileUser.name}</ThemedText>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary">
              Cazenga, Luanda, Angola
            </ThemedText>
          </View>
        </View>

        {/* Level & Reputation */}
        <ThemedView type="backgroundElement" style={styles.repCard}>
          <View style={styles.repHeader}>
            <View>
              <ThemedText type="smallBold" themeColor="textSecondary">
                NÍVEL DO CIDADÃO
              </ThemedText>
              <ThemedText type="default" style={styles.levelTitle}>
                Nível {lvl.level}: {lvl.title}
              </ThemedText>
            </View>
            <ThemedText type="subtitle" style={styles.points}>
              {profileUser.reputation} pts
            </ThemedText>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: theme.backgroundSelected }]}>
              <View style={[styles.progressFill, { width: progressPercent as any }]} />
            </View>
            <View style={styles.progressLabels}>
              <ThemedText type="code" themeColor="textSecondary">
                {lvl.min} pts
              </ThemedText>
              <ThemedText type="code" themeColor="textSecondary">
                Próximo Nível ({lvl.max} pts)
              </ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Badges Section */}
        <View style={styles.section}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            Emblemas Conquistados
          </ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeList}>
            {BADGES.map((badge) => {
              const unlocked = isBadgeUnlocked(badge.name);
              return (
                <ThemedView
                  key={badge.id}
                  type="backgroundElement"
                  style={[styles.badgeCard, { opacity: unlocked ? 1 : 0.4 }]}>
                  <View style={[styles.badgeIconBg, { backgroundColor: unlocked ? `${badge.color}20` : '#8E8E9320' }]}>
                    <Ionicons name={badge.icon as any} size={24} color={unlocked ? badge.color : '#8E8E93'} />
                  </View>
                  <ThemedText type="code" style={styles.badgeName}>
                    {badge.name}
                  </ThemedText>
                  {!unlocked && (
                    <View style={styles.lockBadge}>
                      <Ionicons name="lock-closed" size={10} color="#FFF" />
                    </View>
                  )}
                </ThemedView>
              );
            })}
          </ScrollView>
        </View>

        {isOwnProfile && (
          <>
            {/* Settings options */}
            <View style={styles.section}>
              <ThemedText type="smallBold" style={styles.sectionTitle}>
                Definições da Conta
              </ThemedText>

              <ThemedView type="backgroundElement" style={styles.settingsGroup}>
                {/* Push Notifications Toggle */}
                <View style={styles.settingsItem}>
                  <View style={styles.settingLabelWrapper}>
                    <Ionicons name="notifications" size={20} color="#FCD116" />
                    <ThemedText type="small" style={{ marginLeft: Spacing.two }}>
                      Notificações Push
                    </ThemedText>
                  </View>
                  <Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ true: '#FCD116' }} />
                </View>

                {/* Anonymous Toggle */}
                <View style={[styles.settingsItem, styles.borderTop]}>
                  <View style={styles.settingLabelWrapper}>
                    <Ionicons name="eye-off" size={20} color="#AF52DE" />
                    <ThemedText type="small" style={{ marginLeft: Spacing.two }}>
                      Denúncias Anónimas
                    </ThemedText>
                  </View>
                  <Switch value={anonymousReporting} onValueChange={setAnonymousReporting} trackColor={{ true: '#FCD116' }} />
                </View>
              </ThemedView>

              <ThemedView type="backgroundElement" style={[styles.settingsGroup, { marginTop: Spacing.three }]}>
                {/* Help / Support */}
                <Pressable style={styles.settingsItem}>
                  <View style={styles.settingLabelWrapper}>
                    <Ionicons name="help-circle" size={20} color="#34C759" />
                    <ThemedText type="small" style={{ marginLeft: Spacing.two }}>
                      Central de Ajuda
                    </ThemedText>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
                </Pressable>

                {/* Logout */}
                <Pressable onPress={handleLogout} style={[styles.settingsItem, styles.borderTop]}>
                  <View style={styles.settingLabelWrapper}>
                    <Ionicons name="log-out" size={20} color="#FF3B30" />
                    <ThemedText type="small" style={{ marginLeft: Spacing.two, color: '#FF3B30' }}>
                      Terminar Sessão
                    </ThemedText>
                  </View>
                </Pressable>
              </ThemedView>
            </View>


          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.five,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
    gap: Spacing.one,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.one,
  },
  editAvatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#CE1126',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  repCard: {
    padding: Spacing.three,
    borderRadius: 16,
    marginBottom: Spacing.four,
  },
  repHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  levelTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 2,
  },
  points: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FCD116',
  },
  progressContainer: {
    gap: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FCD116',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  section: {
    marginBottom: Spacing.four,
  },
  sectionTitle: {
    marginBottom: Spacing.two,
    fontSize: 16,
  },
  badgeList: {
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  badgeCard: {
    width: 90,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    padding: Spacing.two,
    position: 'relative',
    marginRight: 6,
  },
  badgeIconBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  badgeName: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
  },
  lockBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsGroup: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
    height: 54,
  },
  settingLabelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.1)',
  },
  roleContainer: {
    padding: Spacing.three,
    borderRadius: 16,
  },
  roleButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(32, 138, 239, 0.2)',
    gap: 6,
  },
  roleButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  backHeader: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingRight: 16,
  },
});
