import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, TextInput, Pressable, Image, Alert, Modal, Platform, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useAction } from 'convex/react';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import LeafletMobileMap from '@/components/LeafletMobileMap';
import * as Network from 'expo-network';
import { api } from '../../convex/_generated/api';
import { useMockUser } from '@/hooks/use-mock-user';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { saveReportOffline } from '../utils/offline-storage';
import { LinearGradient } from 'expo-linear-gradient';


const CATEGORIES = [
  { id: '1', name: 'Lixo', icon: 'trash-outline' },
  { id: '2', name: 'Buracos', icon: 'construct-outline' },
  { id: '3', name: 'Água', icon: 'water-outline' },
  { id: '4', name: 'Energia', icon: 'flash-outline' },
  { id: '5', name: 'Segurança', icon: 'shield-checkmark-outline' },
  { id: '6', name: 'Causas Sociais', icon: 'heart-outline' },
  { id: '7', name: 'Outro', icon: 'help-circle-outline' },
];

export default function ReportScreen() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const osmUrlTemplate = scheme === 'dark'
    ? "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
    : "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('Capturando GPS...');
  const [mediaList, setMediaList] = useState<{ uri: string; type: 'image' | 'video'; base64?: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latitude, setLatitude] = useState<number>(-8.8159);
  const [longitude, setLongitude] = useState<number>(13.2922);
  const [locationReady, setLocationReady] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [tempLatitude, setTempLatitude] = useState<number>(-8.8159);
  const [tempLongitude, setTempLongitude] = useState<number>(13.2922);
  const [isGeocodingMap, setIsGeocodingMap] = useState(false);
  const [tempAddress, setTempAddress] = useState('');
  const [tempReference, setTempReference] = useState('');
  const [locationReference, setLocationReference] = useState('');

  const currentUser = useMockUser();
  const createReport = useMutation(api.reports.create);
  const uploadMediaAction = useAction(api.uploads.uploadMedia);

  // Capture GPS coordinates automatically on mount
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationName('Cazenga, Luanda (Fallback)');
          setLocationReady(true);
          return;
        }

        let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const lat = location.coords.latitude;
        const lon = location.coords.longitude;
        setLatitude(lat);
        setLongitude(lon);
        setTempLatitude(lat);
        setTempLongitude(lon);

        const displayName = await reverseGeocode(lat, lon);
        setLocationName(displayName);
        setLocationReady(true);
      } catch (err) {
        console.error('GPS error:', err);
        setLocationName('Cazenga, Luanda (Fallback)');
        setLocationReady(true);
      }
    })();
  }, []);

  const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    try {
      const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      if (geocode && geocode.length > 0) {
        const addr = geocode[0];
        const parts = [addr.street || addr.name, addr.subregion || addr.district, addr.city].filter(Boolean);
        return parts.join(', ') || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      }
    } catch (_) {}
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  };

  const handlePhotoPress = () => {
    Alert.alert(
      'Adicionar Media',
      'Escolha como quer adicionar a evidência:',
      [
        {
          text: 'Tirar Foto',
          onPress: handleTakePhotoCamera,
        },
        {
          text: 'Gravar Vídeo',
          onPress: handleRecordVideoCamera,
        },
        {
          text: 'Escolher da Galeria',
          onPress: handlePickFromGallery,
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const handleRecordVideoCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à câmara para gravar vídeos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.length > 0) {
      const asset = result.assets[0];
      setMediaList(prev => [
        ...prev,
        {
          uri: asset.uri,
          type: 'video',
          base64: asset.uri,
        },
      ]);
    }
  };

  const handleTakePhotoCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à câmara para tirar fotos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets?.length > 0) {
      const asset = result.assets[0];
      const mimeType = asset.mimeType || 'image/jpeg';
      const base64Data = asset.base64 ? `data:${mimeType};base64,${asset.base64}` : undefined;
      setMediaList(prev => [
        ...prev,
        {
          uri: asset.uri,
          type: 'image',
          base64: base64Data || asset.uri,
        },
      ]);
    }
  };

  const handlePickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria para seleccionar fotos e vídeos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets?.length > 0) {
      const selectedMedia = result.assets.map(asset => {
        const type = asset.type === 'video' ? 'video' : 'image';
        const mimeType = asset.mimeType || (type === 'video' ? 'video/mp4' : 'image/jpeg');
        const base64Data = asset.base64 ? `data:${mimeType};base64,${asset.base64}` : undefined;
        return {
          uri: asset.uri,
          type: type as 'image' | 'video',
          base64: base64Data || asset.uri,
        };
      });
      setMediaList(prev => [...prev, ...selectedMedia]);
    }
  };

  const handleOpenMapPicker = () => {
    setTempLatitude(latitude);
    setTempLongitude(longitude);
    setTempAddress(locationName);
    setTempReference(locationReference);
    setShowMapPicker(true);
  };

  const handleConfirmMapLocation = async () => {
    setLatitude(tempLatitude);
    setLongitude(tempLongitude);
    setLocationName(tempAddress || `Lat: ${tempLatitude.toFixed(5)}, Lon: ${tempLongitude.toFixed(5)}`);
    setLocationReference(tempReference);
    setShowMapPicker(false);
  };

  const handleSubmit = async () => {
    if (selectedCategories.length === 0) {
      Alert.alert('Erro', 'Por favor, selecione pelo menos uma categoria.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Erro', 'Por favor, descreva a ocorrência.');
      return;
    }
    if (mediaList.length === 0) {
      Alert.alert('Erro', 'Por favor, adicione pelo menos uma foto ou vídeo como evidência.');
      return;
    }

    setIsSubmitting(true);
    try {
      const netState = await Network.getNetworkStateAsync();
      const online = !!netState.isConnected && netState.isInternetReachable !== false;

      const categoryString = selectedCategories.join(', ');
      const fullLocationString = locationReference 
        ? `${locationName} (Ref: ${locationReference})`
        : locationName;

      if (!online) {
        const offlineImages = mediaList.filter(m => m.type === 'image').map(m => m.base64 || m.uri);
        const offlineVideos = mediaList.filter(m => m.type === 'video').map(m => m.base64 || m.uri);
        const offlineFirstImage = offlineImages.length > 0 ? offlineImages[0] : (offlineVideos.length > 0 ? offlineVideos[0] : '');

        if (currentUser?._id && currentUser._id !== 'dummy-user-id') {
          await saveReportOffline({
            tenantId: 'cazenga',
            userId: currentUser._id,
            category: categoryString,
            title: `Ocorrência de ${categoryString}`,
            description,
            image: offlineFirstImage,
            images: offlineImages,
            videos: offlineVideos,
            location: fullLocationString,
            latitude,
            longitude,
          });
          setIsSubmitting(false);
          Alert.alert(
            'Sem Internet',
            'A sua ocorrência foi guardada offline e será enviada automaticamente assim que recuperar a ligação à Internet.',
            [{ text: 'OK', onPress: () => { setSelectedCategories([]); setDescription(''); setMediaList([]); setLocationReference(''); } }]
          );
        } else {
          setIsSubmitting(false);
          Alert.alert('Erro', 'Utilizador inválido. Inicie sessão para reportar.');
        }
        return;
      }

      // Online flow: upload images/videos to Cloudflare R2 first
      const uploadedImages: string[] = [];
      const uploadedVideos: string[] = [];

      for (const media of mediaList) {
        if (media.base64 && media.base64.startsWith('data:')) {
          const url = await uploadMediaAction({ base64Str: media.base64 });
          if (media.type === 'image') {
            uploadedImages.push(url);
          } else {
            uploadedVideos.push(url);
          }
        } else {
          if (media.type === 'image') {
            uploadedImages.push(media.uri);
          } else {
            uploadedVideos.push(media.uri);
          }
        }
      }

      const firstImage = uploadedImages.length > 0 ? uploadedImages[0] : (uploadedVideos.length > 0 ? uploadedVideos[0] : '');

      if (currentUser?._id && currentUser._id !== 'dummy-user-id') {
        await createReport({
          tenantId: 'cazenga',
          userId: currentUser._id,
          category: categoryString,
          title: `Ocorrência de ${categoryString}`,
          description,
          image: firstImage,
          images: uploadedImages,
          videos: uploadedVideos,
          location: fullLocationString,
          latitude,
          longitude,
        });
      } else {
        console.log('Mock Report Submitted:', { category: categoryString, description, latitude, longitude, location: fullLocationString });
      }
      setIsSubmitting(false);
      Alert.alert(
        'Sucesso',
        'Ocorrência registada com sucesso! Receberá notificações sobre o progresso.',
        [{ text: 'OK', onPress: () => { setSelectedCategories([]); setDescription(''); setMediaList([]); setLocationReference(''); } }]
      );
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      Alert.alert('Erro', 'Não foi possível enviar a ocorrência.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <ThemedText style={styles.title}>Reportar Ocorrência</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Submeta detalhes sobre o problema urbano
          </ThemedText>
        </View>

        {/* Photo/Video Upload Area */}
        <View style={[styles.photoBox, mediaList.length > 0 && styles.photoBoxActive, { backgroundColor: theme.backgroundElement }]}>
          {mediaList.length > 0 ? (
            <View style={styles.mediaPreviewContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediaPreviewScroll}>
                {mediaList.map((item, index) => (
                  <View key={index} style={styles.mediaPreviewCard}>
                    {item.type === 'video' ? (
                      <View style={styles.videoPlaceholderCard}>
                        <Ionicons name="videocam" size={28} color="#FFF" />
                        <ThemedText type="code" style={{ color: '#FFF', fontSize: 10, marginTop: 4 }}>Vídeo</ThemedText>
                      </View>
                    ) : (
                      <Image source={{ uri: item.uri }} style={styles.previewImage} />
                    )}
                    <Pressable
                      onPress={() => setMediaList(prev => prev.filter((_, i) => i !== index))}
                      style={styles.removeMediaBtn}
                    >
                      <Ionicons name="close-circle" size={20} color="#FF3B30" />
                    </Pressable>
                  </View>
                ))}
                {/* Plus button to add more */}
                <Pressable onPress={handlePhotoPress} style={styles.addMoreMediaCard}>
                  <Ionicons name="add" size={24} color={theme.textSecondary} />
                  <ThemedText type="code" themeColor="textSecondary" style={{ fontSize: 9 }}>Adicionar</ThemedText>
                </Pressable>
              </ScrollView>
            </View>
          ) : (
            <Pressable onPress={handlePhotoPress} style={styles.photoPlaceholder}>
              <Ionicons name="camera-outline" size={40} color={theme.textSecondary} />
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.photoText}>
                Adicionar Fotos/Vídeos de Evidência
              </ThemedText>
              <View style={styles.photoBadgesRow}>
                <View style={styles.photoBadge}>
                  <Ionicons name="camera" size={12} color="#FCD116" />
                  <ThemedText type="code" style={styles.photoBadgeText}>Câmara</ThemedText>
                </View>
                <View style={styles.photoBadge}>
                  <Ionicons name="images" size={12} color="#FCD116" />
                  <ThemedText type="code" style={styles.photoBadgeText}>Galeria</ThemedText>
                </View>
              </View>
            </Pressable>
          )}
        </View>

        {/* GPS Capture + Map Picker */}
        <ThemedView type="backgroundElement" style={styles.locationContainer}>
          <Ionicons
            name="location"
            size={20}
            color={locationReady ? '#FF3B30' : theme.textSecondary}
          />
          <View style={{ flex: 1 }}>
            <ThemedText type="smallBold">Localização GPS</ThemedText>
            <ThemedText type="code" themeColor="textSecondary" numberOfLines={2}>
              {locationReady ? locationName : 'Capturando GPS...'}
            </ThemedText>
            {!!locationReference && (
              <ThemedText type="code" themeColor="textSecondary" style={{ marginTop: 2, fontStyle: 'italic' }}>
                Ref: {locationReference}
              </ThemedText>
            )}
          </View>
          {locationReady ? (
            <Pressable onPress={handleOpenMapPicker} style={styles.adjustButton}>
              <Ionicons name="map-outline" size={16} color="#FCD116" />
              <ThemedText type="code" style={{ color: '#FCD116', fontSize: 11 }}>Ajustar</ThemedText>
            </Pressable>
          ) : (
            <Ionicons name="sync" size={16} color={theme.textSecondary} style={styles.spin} />
          )}
        </ThemedView>

        {/* Category Picker */}
        <View style={styles.section}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            Selecione a Categoria
          </ThemedText>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategories.includes(cat.name);
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => {
                    setSelectedCategories(prev =>
                      prev.includes(cat.name)
                        ? prev.filter(c => c !== cat.name)
                        : [...prev, cat.name]
                    );
                  }}
                  style={styles.categoryCardPressable}
                >
                  {isSelected ? (
                    <LinearGradient
                      colors={['#CE1126', '#000000']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.categoryCardGradient}
                    >
                      <Ionicons
                        name={cat.icon as any}
                        size={24}
                        color="#FCD116"
                      />
                      <ThemedText
                        type="code"
                        style={{
                          color: '#FFF',
                          marginTop: 4,
                          fontWeight: '700',
                        }}>
                        {cat.name}
                      </ThemedText>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.categoryCard, { backgroundColor: theme.backgroundElement }]}>
                      <Ionicons
                        name={cat.icon as any}
                        size={24}
                        color={theme.textSecondary}
                      />
                      <ThemedText
                        type="code"
                        style={{
                          color: theme.text,
                          marginTop: 4,
                          fontWeight: '600',
                        }}>
                        {cat.name}
                      </ThemedText>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Description Input */}
        <View style={styles.section}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            Descrição Detalhada
          </ThemedText>
          <TextInput
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            placeholder="Descreva o problema com o maior detalhe possível para ajudar os operadores..."
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.textArea,
              {
                backgroundColor: theme.backgroundElement,
                color: theme.text,
                borderColor: theme.backgroundSelected,
              },
            ]}
          />
        </View>

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={{ width: '100%', marginTop: Spacing.two }}
        >
          <LinearGradient
            colors={['#CE1126', '#000000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.submitButton, { marginTop: 0, opacity: isSubmitting ? 0.7 : 1 }]}
          >
            <Ionicons name="send" size={18} color="#FFF" style={{ marginRight: 8 }} />
            <ThemedText type="default" style={styles.submitButtonText}>
              {isSubmitting ? 'A submeter...' : 'Submeter Ocorrência'}
            </ThemedText>
          </LinearGradient>
        </Pressable>
      </ScrollView>

      {/* Map Picker Modal */}
      <Modal
        visible={showMapPicker}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowMapPicker(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
          <View style={styles.mapPickerHeader}>
            <Pressable onPress={() => setShowMapPicker(false)} style={styles.mapPickerClose}>
              <Ionicons name="close" size={24} color="#FFF" />
            </Pressable>
            <ThemedText style={{ color: '#FFF', fontWeight: '700', fontSize: 16 }}>
              Ajustar Localização
            </ThemedText>
            <Pressable
              onPress={handleConfirmMapLocation}
              disabled={isGeocodingMap}
              style={[styles.mapPickerConfirm, { opacity: isGeocodingMap ? 0.5 : 1 }]}
            >
              <ThemedText style={{ color: '#208AEF', fontWeight: '700' }}>
                {isGeocodingMap ? 'A confirmar...' : 'Confirmar'}
              </ThemedText>
            </Pressable>
          </View>

          <View style={{ flex: 1 }}>
            <LeafletMobileMap
              initialCenter={{ latitude: tempLatitude, longitude: tempLongitude }}
              pinCoordinates={{ latitude: tempLatitude, longitude: tempLongitude }}
              onMapClick={async (coords) => {
                setTempLatitude(coords.latitude);
                setTempLongitude(coords.longitude);
                try {
                  const name = await reverseGeocode(coords.latitude, coords.longitude);
                  setTempAddress(name);
                } catch (e) {
                  console.log("Map click geocode failed:", e);
                }
              }}
              zoom={14}
            />
          </View>

          {/* Manual Address and Reference Inputs */}
          <View style={[styles.mapPickerInputsContainer, { backgroundColor: '#111' }]}>
            <View style={{ marginBottom: 12 }}>
              <ThemedText style={{ color: '#FFF', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>
                Endereço Confirmado
              </ThemedText>
              <TextInput
                style={styles.mapPickerInput}
                value={tempAddress}
                onChangeText={setTempAddress}
                placeholder="Endereço da ocorrência..."
                placeholderTextColor="#666"
              />
            </View>

            <View style={{ marginBottom: 4 }}>
              <ThemedText style={{ color: '#FFF', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>
                Ponto de Referência
              </ThemedText>
              <TextInput
                style={styles.mapPickerInput}
                value={tempReference}
                onChangeText={setTempReference}
                placeholder="Ex: Perto do chafariz, ao lado da paragem..."
                placeholderTextColor="#666"
              />
            </View>
          </View>

          <View style={[styles.mapPickerFooter, { backgroundColor: 'rgba(0,0,0,0.95)' }]}>
            <Ionicons name="location" size={16} color="#FF3B30" />
            <ThemedText style={{ color: '#999', fontSize: 11, marginLeft: 6, flex: 1 }}>
              {`Lat: ${tempLatitude.toFixed(5)}, Lon: ${tempLongitude.toFixed(5)}`}
            </ThemedText>
          </View>
        </SafeAreaView>
      </Modal>
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
  header: {
    paddingVertical: Spacing.three,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  photoBox: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: Spacing.three,
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.one,
  },
  photoText: {
    fontSize: 15,
  },
  photoBadgesRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  photoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#FCD116',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  photoBadgeText: {
    color: '#FCD116',
    fontSize: 11,
  },
  photoContainer: {
    flex: 1,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  changePhotoBadge: {
    position: 'absolute',
    bottom: Spacing.two,
    right: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  changePhotoText: {
    color: '#FFF',
    fontSize: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 16,
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  adjustButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#FCD116',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  spin: {
    marginLeft: 'auto',
  },
  section: {
    marginBottom: Spacing.four,
  },
  sectionTitle: {
    marginBottom: Spacing.two,
    fontSize: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  categoryCard: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  categoryCardPressable: {
    width: '31%',
    height: 70,
    borderRadius: 12,
    overflow: 'hidden',
  },
  categoryCardGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  textArea: {
    borderRadius: 12,
    padding: Spacing.three,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
  },
  submitButton: {
    backgroundColor: '#CE1126',
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  submitButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  mapPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#111',
  },
  mapPickerClose: {
    padding: 4,
  },
  mapPickerConfirm: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCD116',
  },
  mapPickerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  photoBoxActive: {
    height: 180,
  },
  mediaPreviewContainer: {
    flex: 1,
    padding: 10,
  },
  mediaPreviewScroll: {
    alignItems: 'center',
    gap: 12,
  },
  mediaPreviewCard: {
    width: 100,
    height: 140,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  videoPlaceholderCard: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeMediaBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 10,
  },
  addMoreMediaCard: {
    width: 100,
    height: 140,
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(128,128,128,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  mapPickerInputsContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  mapPickerInput: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    backgroundColor: '#222',
    color: '#FFF',
    paddingHorizontal: 12,
    fontSize: 14,
    marginTop: 4,
  },
});
