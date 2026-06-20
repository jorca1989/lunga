import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable, TextInput, ScrollView, Modal, ActivityIndicator, Share, Linking, Platform, useColorScheme, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LeafletMobileMap from '@/components/LeafletMobileMap';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useMockUser } from '@/hooks/use-mock-user';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';


interface MapReport {
  _id?: string;
  id: string;
  category: string;
  title: string;
  description: string;
  location: string;
  status: 'Aberto' | 'Em Progresso' | 'Resolvido' | 'Em Análise';
  latitude: number;
  longitude: number;
  image?: string;
  likes: number;
  commentsCount: number;
  followed: boolean;
  liked: boolean;
  createdAt: any;
  user: {
    name: string;
    avatar: string;
    reputation: number;
  };
}

const MOCK_REPORTS: MapReport[] = [
  {
    id: '1',
    category: 'Lixo',
    title: 'Acumulação de Lixo na Via Pública',
    description: 'Contentores transbordando na berma da estrada principal do Cazenga. O lixo está a espalhar-se pela via impedindo a circulação de pedestres.',
    location: 'Avenida Hoji Ya Henda, Cazenga',
    status: 'Aberto',
    latitude: -8.8150,
    longitude: 13.2920,
    image: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop&q=80',
    likes: 45,
    commentsCount: 2,
    followed: false,
    liked: false,
    createdAt: 'Há 10 min',
    user: {
      name: 'Manuel Dos Santos',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      reputation: 120,
    }
  },
  {
    id: '2',
    category: 'Buracos',
    title: 'Buraco Crítico na Faixa Central',
    description: 'Um buraco enorme e profundo abriu-se mesmo no meio da estrada. Muito perigoso para viaturas ligeiras e motorizadas à noite.',
    location: 'Rua Direita da Samba, Samba',
    status: 'Em Progresso',
    latitude: -8.8550,
    longitude: 13.2210,
    image: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=600&auto=format&fit=crop&q=80',
    likes: 67,
    commentsCount: 1,
    followed: true,
    liked: true,
    createdAt: 'Há 2 horas',
    user: {
      name: 'Ana Bela Costa',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      reputation: 85,
    }
  },
  {
    id: '3',
    category: 'Água',
    title: 'Ruptura de Conduta de Água',
    description: 'Desperdício de grande quantidade de água limpa jorrando debaixo do passeio há mais de 24 horas. Risco de erosão da estrada.',
    location: 'Rua do Kero, Talatona',
    status: 'Resolvido',
    latitude: -8.9220,
    longitude: 13.1880,
    image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&auto=format&fit=crop&q=80',
    likes: 112,
    commentsCount: 0,
    followed: false,
    liked: false,
    createdAt: 'Há 1 dia',
    user: {
      name: 'João Francisco',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      reputation: 210,
    }
  },
  {
    id: '4',
    category: 'Energia',
    title: 'Cabo Elétrico Caído',
    description: 'Cabo de alta tensão caído no passeio próximo à escola secundária. Muito perigoso.',
    location: 'Viana, Luanda',
    status: 'Aberto',
    latitude: -8.8890,
    longitude: 13.3520,
    image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&auto=format&fit=crop&q=80',
    likes: 30,
    commentsCount: 1,
    followed: false,
    liked: false,
    createdAt: 'Há 3 horas',
    user: {
      name: 'Manuel Dos Santos',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      reputation: 120,
    }
  }
];

const CATEGORIES = ['Tudo', 'Lixo', 'Buracos', 'Água', 'Energia', 'Segurança', 'Causas Sociais'];

const formatTimeAgo = (timestamp: any) => {
  if (typeof timestamp === 'string') return timestamp;
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Agora';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Há ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Há ${days} dias`;
};

function MediaCarousel({ images = [], videos = [], fallbackImage }: { images?: string[]; videos?: string[]; fallbackImage: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  
  const mediaUrls = images && images.length > 0 ? images : (fallbackImage ? [fallbackImage] : []);
  const videoUrls = videos || [];
  const total = mediaUrls.length + videoUrls.length;

  if (total === 0) return null;

  if (total === 1) {
    if (videoUrls.length > 0) {
      return (
        <View style={styles.cardImageVerticalVideo}>
          <Ionicons name="play-circle" size={48} color="#FFF" />
          <ThemedText style={{ color: '#FFF', marginTop: 8, fontWeight: 'bold' }}>Vídeo Evidência</ThemedText>
        </View>
      );
    }
    return <Image source={{ uri: mediaUrls[0] }} style={styles.cardImageVertical} />;
  }

  const handleScroll = (event: any) => {
    if (containerWidth === 0) return;
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / containerWidth);
    setActiveIndex(index);
  };

  return (
    <View
      style={styles.carouselContainer}
      onLayout={(event) => {
        setContainerWidth(event.nativeEvent.layout.width);
      }}
    >
      {containerWidth > 0 && (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.carouselScroll}
        >
          {mediaUrls.map((url, index) => (
            <Image
              key={`img-${index}`}
              source={{ uri: url }}
              style={{ width: containerWidth, height: '100%', resizeMode: 'cover' }}
            />
          ))}
          {videoUrls.map((url, index) => (
            <View
              key={`vid-${index}`}
              style={{ width: containerWidth, height: '100%', backgroundColor: '#1E1E1E', justifyContent: 'center', alignItems: 'center' }}
            >
              <Ionicons name="play-circle" size={48} color="#FFF" />
              <ThemedText style={{ color: '#FFF', marginTop: 8, fontWeight: 'bold' }}>Vídeo Evidência</ThemedText>
            </View>
          ))}
        </ScrollView>
      )}
      <View style={styles.carouselIndicator}>
        <ThemedText type="code" style={styles.indicatorText}>
          {activeIndex + 1} / {total}
        </ThemedText>
      </View>
    </View>
  );
}

export default function MapScreen() {
  const theme = useTheme();
  const [activeCategory, setActiveCategory] = useState('Tudo');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch current user and live reports from Convex
  const currentUser = useMockUser();
  const dbReports = useQuery(api.reports.list, { tenantId: 'cazenga' }) as any;

  const reportsList: MapReport[] = dbReports !== undefined ? dbReports : MOCK_REPORTS;

  // Track map selection
  const [selectedReportState, setSelectedReportState] = useState<MapReport | null>(null);

  const filteredReports = reportsList.filter((report) => {
    const matchesCategory = activeCategory === 'Tudo' || (report.category && report.category.split(',').map((c: string) => c.trim()).includes(activeCategory));
    const matchesSearch =
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Default selection if current is not in filtered list
  const selectedReport =
    selectedReportState && filteredReports.some(r => (r._id || r.id) === (selectedReportState._id || selectedReportState.id))
      ? selectedReportState
      : (filteredReports.length > 0 ? filteredReports[0] : null);

  // Modal details state
  const [selectedReportForComments, setSelectedReportForComments] = useState<any | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [modalTab, setModalTab] = useState<'comments' | 'history'>('comments');

  const editReportMutation = useMutation(api.reports.edit);
  const deleteReportMutation = useMutation(api.reports.remove);

  const [isEditing, setIsEditing] = useState(false);
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editLatitude, setEditLatitude] = useState(0);
  const [editLongitude, setEditLongitude] = useState(0);
  const [showEditMapPicker, setShowEditMapPicker] = useState(false);
  const [tempLatitude, setTempLatitude] = useState(0);
  const [tempLongitude, setTempLongitude] = useState(0);
  const [isGeocodingMap, setIsGeocodingMap] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const handleStartEdit = () => {
    if (!selectedReportForComments) return;
    setEditCategory(selectedReportForComments.category);
    setEditDescription(selectedReportForComments.description);
    setEditLocation(selectedReportForComments.location);
    setEditLatitude(selectedReportForComments.latitude);
    setEditLongitude(selectedReportForComments.longitude);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedReportForComments || !currentUser) return;
    if (!editDescription.trim()) { Alert.alert('Erro', 'Insira uma descrição.'); return; }
    if (!editLocation.trim()) { Alert.alert('Erro', 'Insira uma localização.'); return; }

    setSubmittingEdit(true);
    try {
      await editReportMutation({
        reportId: selectedReportForComments._id as any,
        userId: currentUser._id,
        category: editCategory,
        description: editDescription.trim(),
        location: editLocation.trim(),
        latitude: editLatitude,
        longitude: editLongitude,
      });
      
      setSelectedReportForComments({
        ...selectedReportForComments,
        category: editCategory,
        description: editDescription.trim(),
        location: editLocation.trim(),
        latitude: editLatitude,
        longitude: editLongitude,
      });
      setIsEditing(false);
      Alert.alert('Sucesso', 'Ocorrência editada com sucesso!');
    } catch (err: any) {
      console.error('Error saving edit:', err);
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleConfirmEditMapLocation = async () => {
    setIsGeocodingMap(true);
    try {
      const geocode = await Location.reverseGeocodeAsync({ latitude: tempLatitude, longitude: tempLongitude });
      let displayName = `${tempLatitude.toFixed(4)}, ${tempLongitude.toFixed(4)}`;
      if (geocode && geocode.length > 0) {
        const addr = geocode[0];
        const parts = [addr.street || addr.name, addr.subregion || addr.district, addr.city].filter(Boolean);
        displayName = parts.join(', ') || displayName;
      }
      setEditLatitude(tempLatitude);
      setEditLongitude(tempLongitude);
      setEditLocation(displayName);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeocodingMap(false);
      setShowEditMapPicker(false);
    }
  };

  const handleDeleteReport = () => {
    if (!selectedReportForComments || !currentUser) return;

    Alert.alert(
      'Eliminar Ocorrência',
      'Tem a certeza que deseja eliminar esta ocorrência definitivamente?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReportMutation({
                reportId: selectedReportForComments._id as any,
                userId: currentUser._id,
              });
              handleCloseComments();
              Alert.alert('Sucesso', 'Ocorrência eliminada com sucesso!');
            } catch (err: any) {
              console.error('Error deleting report:', err);
              Alert.alert('Erro', 'Não foi possível eliminar a ocorrência.');
            }
          },
        },
      ]
    );
  };

  // Fallback local mock comments for offline view
  const [mockComments, setMockComments] = useState<any[]>([
    {
      _id: 'c1',
      user: {
        name: 'Ana Bela Costa',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        role: 'citizen',
      },
      content: 'Eu também vi este problema esta manhã! É preciso muito cuidado.',
      createdAt: Date.now() - 3600000,
    }
  ]);

  const dbComments = useQuery(
    api.comments.list,
    selectedReportForComments?._id ? { reportId: selectedReportForComments._id } : 'skip'
  ) as any;

  const dbHistory = useQuery(
    api.reports.history,
    selectedReportForComments?._id ? { reportId: selectedReportForComments._id } : 'skip'
  ) as any;

  const postCommentMutation = useMutation(api.comments.add);

  const commentsList = dbComments !== undefined ? dbComments : mockComments;

  const MOCK_HISTORY_LOGS = [
    {
      _id: 'log1',
      action: 'Em Progresso',
      userName: 'João Francisco',
      userRole: 'operator',
      notes: 'Trabalho de limpeza aceite pelo operador João Francisco.',
      createdAt: Date.now() - 3600000,
    },
    {
      _id: 'log2',
      action: 'Em Análise',
      userName: 'Supervisor Cazenga',
      userRole: 'supervisor',
      notes: 'Ocorrência aprovada e adicionada ao mercado de limpeza.',
      createdAt: Date.now() - 7200000,
    },
    {
      _id: 'log3',
      action: 'Criado',
      userName: 'Manuel Dos Santos',
      userRole: 'citizen',
      notes: 'Ocorrência registada pelo cidadão.',
      createdAt: Date.now() - 10800000,
    }
  ];

  const historyList = dbHistory !== undefined ? dbHistory : MOCK_HISTORY_LOGS;

  const handleOpenComments = (report: any) => {
    setSelectedReportForComments(report);
    setModalTab('comments');
  };

  const handleCloseComments = () => {
    setSelectedReportForComments(null);
    setCommentText('');
    setModalTab('comments');
    setIsEditing(false);
  };

  const handlePostComment = async () => {
    if (!commentText.trim()) return;

    setIsPostingComment(true);
    try {
      if (selectedReportForComments?._id && currentUser?._id && currentUser._id !== 'dummy-user-id') {
        await postCommentMutation({
          reportId: selectedReportForComments._id,
          userId: currentUser._id,
          content: commentText,
        });
      } else {
        // Fallback for mock preview mode
        const newComment = {
          _id: Math.random().toString(),
          user: {
            name: currentUser.name,
            avatar: currentUser.avatar,
            role: currentUser.role,
          },
          content: commentText,
          createdAt: Date.now(),
        };
        setMockComments((prev) => [...prev, newComment]);
      }
      setCommentText('');
    } catch (err) {
      console.error('Erro ao postar comentário:', err);
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleNavigate = (latitude: number, longitude: number, title: string) => {
    const label = encodeURIComponent(title);
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${label})`
    });
    if (url) {
      Linking.openURL(url).catch((err) => console.error('Erro ao abrir mapas:', err));
    }
  };

  const getStatusColor = (status: MapReport['status']) => {
    switch (status) {
      case 'Aberto': return '#FF3B30';
      case 'Em Análise': return '#FF9500';
      case 'Em Progresso': return '#007AFF';
      case 'Resolvido': return '#34C759';
      default: return '#8E8E93';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Lixo': return 'trash';
      case 'Buracos': return 'construct';
      case 'Água': return 'water';
      case 'Energia': return 'flash';
      case 'Segurança': return 'shield-checkmark';
      case 'Causas Sociais': return 'heart';
      default: return 'alert';
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      {/* Map View Area */}
      <View style={styles.mapContainer}>
        <LeafletMobileMap
          reports={filteredReports}
          onMarkerClick={(report) => setSelectedReportState(report)}
        />
      </View>

      {/* Header Overlay */}
      <View style={styles.headerOverlay}>
        <ThemedView type="backgroundElement" style={styles.searchBar}>
          <Ionicons name="search" size={20} color={theme.textSecondary} />
          <TextInput
            placeholder="Pesquisar por localização..."
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInput, { color: theme.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Pressable style={styles.filterButton}>
            <Ionicons name="options-outline" size={20} color={theme.text} />
          </Pressable>
        </ThemedView>

        {/* Categories Horizontal List */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryList} contentContainerStyle={styles.categoryListContent}>
          {CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => {
                  setActiveCategory(cat);
                  setSelectedReportState(null); // Reset selection to default first filtered item
                }}
                style={styles.chipPressable}
              >
                {isSelected ? (
                  <LinearGradient
                    colors={['#CE1126', '#000000']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.chipGradient}
                  >
                    <ThemedText type="smallBold" style={{ color: '#FCD116' }}>
                      {cat}
                    </ThemedText>
                  </LinearGradient>
                ) : (
                  <View style={[styles.chip, { backgroundColor: theme.backgroundElement }]}>
                    <ThemedText type="smallBold" style={{ color: theme.textSecondary }}>
                      {cat}
                    </ThemedText>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Selected Marker Detail Card */}
      {selectedReport && (
        <ThemedView type="backgroundElement" style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View style={styles.titleWrapper}>
              <Ionicons name={getCategoryIcon(selectedReport.category) as any} size={18} color="#FCD116" />
              <ThemedText type="default" style={styles.detailTitle} numberOfLines={2}>
                {selectedReport.title}
              </ThemedText>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(selectedReport.status)}18`, flexShrink: 0 }]}>
              <ThemedText type="code" style={{ color: getStatusColor(selectedReport.status), fontWeight: 'bold', fontSize: 10 }}>
                {selectedReport.status}
              </ThemedText>
            </View>
          </View>

          <View style={styles.detailLocation}>
            <Ionicons name="location-outline" size={16} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary" style={styles.locationText} numberOfLines={1}>
              {selectedReport.location}
            </ThemedText>
          </View>

          <View style={styles.actionRow}>
            <Pressable style={styles.primaryButton} onPress={() => handleOpenComments(selectedReport)}>
              <ThemedText type="smallBold" style={styles.primaryButtonText}>
                Ver Detalhes
              </ThemedText>
              <Ionicons name="arrow-forward" size={16} color="#FFF" />
            </Pressable>
            <Pressable
              style={[styles.secondaryButton, { backgroundColor: theme.background }]}
              onPress={() => handleNavigate(selectedReport.latitude, selectedReport.longitude, selectedReport.title)}
            >
              <Ionicons name="navigate-outline" size={18} color={theme.text} />
              <ThemedText type="small" style={{ marginLeft: 4 }}>
                Navegar
              </ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      )}

      {/* Full Complaint Details Modal */}
      <Modal
        visible={selectedReportForComments !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseComments}
      >
        <View style={styles.modalOverlay}>
          <ThemedView type="backgroundElement" style={styles.modalContainer}>
            {/* Modal drag handle */}
            <View style={styles.dragHandle} />

            {/* Close button */}
            <Pressable onPress={handleCloseComments} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={theme.text} />
            </Pressable>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              {selectedReportForComments && (
                <>
                  {/* Author row */}
                  <View style={styles.modalAuthorRow}>
                    <Ionicons name="person-circle" size={44} color={theme.textSecondary} />
                    <View style={{ flex: 1 }}>
                      <ThemedText type="smallBold">{selectedReportForComments.user?.name || 'Cidadão'}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {formatTimeAgo(selectedReportForComments.createdAt)} • {selectedReportForComments.location}
                      </ThemedText>
                    </View>
                    <View style={styles.reputationBadge}>
                      <Ionicons name="star" size={10} color="#FFD700" />
                      <ThemedText type="code" style={styles.reputationText}>{selectedReportForComments.user?.reputation || 0}</ThemedText>
                    </View>
                  </View>

                  {/* Category + Title */}
                  <View style={styles.modalTitleRow}>
                    <View style={[styles.categoryChipSmall, { backgroundColor: `${getStatusColor(selectedReportForComments.status)}18` }]}>
                      <Ionicons name={getCategoryIcon(selectedReportForComments.category) as any} size={12} color={getStatusColor(selectedReportForComments.status)} />
                      <ThemedText type="code" style={[styles.categoryChipText, { color: getStatusColor(selectedReportForComments.status) }]}>
                        {selectedReportForComments.category}
                      </ThemedText>
                    </View>
                  </View>
                  
                  {isEditing ? (
                    <View style={styles.editFormContainer}>
                      <ThemedText type="smallBold" style={{ marginBottom: 4 }}>Categoria</ThemedText>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 40, marginBottom: Spacing.two }} contentContainerStyle={{ gap: 8 }}>
                        {['Lixo', 'Buracos', 'Água', 'Energia', 'Segurança', 'Causas Sociais', 'Outro'].map((cat) => {
                          const isSel = editCategory === cat;
                          return (
                            <Pressable
                              key={cat}
                              onPress={() => setEditCategory(cat)}
                              style={[styles.editCategoryChip, { backgroundColor: isSel ? '#FCD116' : theme.backgroundSelected }]}
                            >
                              <ThemedText type="code" style={{ color: isSel ? '#000' : theme.textSecondary, fontWeight: 'bold' }}>
                                {cat}
                              </ThemedText>
                            </Pressable>
                          );
                        })}
                      </ScrollView>

                      <ThemedText type="smallBold" style={{ marginBottom: 4 }}>Descrição Detalhada</ThemedText>
                      <TextInput
                        style={[styles.editInputDesc, { color: theme.text, borderColor: theme.backgroundSelected }]}
                        value={editDescription}
                        onChangeText={setEditDescription}
                        multiline
                        placeholder="Descrição da ocorrência"
                        placeholderTextColor={theme.textSecondary}
                      />

                      <ThemedText type="smallBold" style={{ marginBottom: 4 }}>Localização</ThemedText>
                      <View style={styles.editLocationWrapper}>
                        <ThemedText type="code" themeColor="textSecondary" style={{ flex: 1, marginRight: 8 }} numberOfLines={2}>
                          {editLocation}
                        </ThemedText>
                        <Pressable
                          onPress={() => {
                            setTempLatitude(editLatitude);
                            setTempLongitude(editLongitude);
                            setShowEditMapPicker(true);
                          }}
                          style={styles.editAdjustBtn}
                        >
                          <Ionicons name="map-outline" size={14} color="#FCD116" />
                          <ThemedText type="code" style={{ color: '#FCD116', fontSize: 10, marginLeft: 2 }}>Ajustar</ThemedText>
                        </Pressable>
                      </View>

                      <View style={styles.editButtonsRow}>
                        <Pressable onPress={handleSaveEdit} style={styles.saveBtn} disabled={submittingEdit}>
                          {submittingEdit ? (
                            <ActivityIndicator size="small" color="#FFF" />
                          ) : (
                            <ThemedText style={{ color: '#FFF', fontWeight: 'bold' }}>Guardar</ThemedText>
                          )}
                        </Pressable>
                        <Pressable onPress={() => setIsEditing(false)} style={styles.cancelBtn}>
                          <ThemedText style={{ color: theme.text }}>Cancelar</ThemedText>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <>
                      <ThemedText style={styles.modalTitle}>{selectedReportForComments.title}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary" style={styles.modalDescription}>
                        {selectedReportForComments.description}
                      </ThemedText>
                      
                      {selectedReportForComments.userId === currentUser?._id && (
                        <View style={styles.ownerActionsRow}>
                          <Pressable onPress={handleStartEdit} style={styles.editActionBtn}>
                            <Ionicons name="create-outline" size={14} color="#FCD116" />
                            <ThemedText type="smallBold" style={{ color: '#FCD116', marginLeft: 4 }}>Editar</ThemedText>
                          </Pressable>
                          <Pressable onPress={handleDeleteReport} style={styles.deleteActionBtn}>
                            <Ionicons name="trash-outline" size={14} color="#FF3B30" />
                            <ThemedText type="smallBold" style={{ color: '#FF3B30', marginLeft: 4 }}>Eliminar</ThemedText>
                          </Pressable>
                        </View>
                      )}
                    </>
                  )}

                  {/* Full image / Swipable Carousel */}
                  <MediaCarousel images={selectedReportForComments.images} videos={selectedReportForComments.videos} fallbackImage={selectedReportForComments.image} />

                  {/* Location */}
                  <View style={styles.modalLocationRow}>
                    <Ionicons name="location" size={16} color="#FF3B30" />
                    <ThemedText type="small" themeColor="textSecondary" style={{ marginLeft: 6 }}>
                      {selectedReportForComments.location}
                    </ThemedText>
                  </View>

                  {/* Status Progress Stepper */}
                  <View style={[styles.stepperContainer, { backgroundColor: theme.background }]}>
                    <ThemedText type="smallBold" style={styles.stepperLabel}>Estado da Ocorrência</ThemedText>
                    <View style={styles.stepperRow}>
                      {['Aberto', 'Em Análise', 'Em Progresso', 'Resolvido'].map((step, index) => {
                        const currentStep = ['Aberto', 'Em Análise', 'Em Progresso', 'Resolvido'].indexOf(selectedReportForComments.status);
                        const isCompleted = index <= currentStep;
                        const isActive = index === currentStep;
                        const color = isActive ? getStatusColor(selectedReportForComments.status as any) : isCompleted ? '#34C759' : theme.backgroundSelected as string;
                        return (
                          <React.Fragment key={step}>
                            <View style={styles.stepItem}>
                              <View style={[styles.stepCircle, { backgroundColor: isCompleted ? color : 'transparent', borderColor: color, borderWidth: 2 }]}>
                                {isCompleted && (
                                  <Ionicons name={isActive ? 'radio-button-on' : 'checkmark'} size={10} color="#FFF" />
                                )}
                              </View>
                              <ThemedText style={[styles.stepLabel, { color: isCompleted ? color : theme.textSecondary, fontSize: 9 }]} numberOfLines={2}>
                                {step}
                              </ThemedText>
                            </View>
                            {index < 3 && (
                              <View style={[styles.stepLine, { backgroundColor: index < currentStep ? '#34C759' : theme.backgroundSelected as string }]} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </View>
                  </View>

                  {/* Section tabs */}
                  <View style={styles.sectionTabsRow}>
                    <Pressable
                      onPress={() => setModalTab('history')}
                      style={[styles.sectionTab, modalTab === 'history' && styles.sectionTabActive]}>
                      <ThemedText style={[styles.sectionTabText, modalTab === 'history' && { color: '#FCD116' }]}>
                        Histórico
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => setModalTab('comments')}
                      style={[styles.sectionTab, modalTab === 'comments' && styles.sectionTabActive]}>
                      <ThemedText style={[styles.sectionTabText, modalTab === 'comments' && { color: '#FCD116' }]}>
                        Discussão ({commentsList.length})
                      </ThemedText>
                    </Pressable>
                  </View>

                  {modalTab === 'history' ? (
                    /* History timeline */
                    <View style={styles.historySection}>
                      {historyList.length === 0 ? (
                        <View style={styles.emptySection}>
                          <Ionicons name="git-branch-outline" size={32} color={theme.textSecondary} />
                          <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center', marginTop: 8 }}>
                            Nenhum histórico disponível.
                          </ThemedText>
                        </View>
                      ) : (
                        historyList.map((log: any, i: number) => {
                          let badgeColor = '#FF3B30';
                          if (log.action === 'Em Análise') badgeColor = '#FF9500';
                          if (log.action === 'Em Progresso') badgeColor = '#007AFF';
                          if (log.action === 'Resolvido') badgeColor = '#34C759';
                          if (log.action === 'Concluído') badgeColor = '#AF52DE';
                          return (
                            <View key={log._id} style={styles.historyItem}>
                              <View style={styles.timelineCol}>
                                <View style={[styles.timelineDot, { backgroundColor: badgeColor }]} />
                                {i < historyList.length - 1 && <View style={styles.timelineLine} />}
                              </View>
                              <View style={[styles.historyCard, { backgroundColor: theme.background }]}>
                                <View style={styles.historyCardHeader}>
                                  <View style={[styles.historyBadge, { backgroundColor: `${badgeColor}20` }]}>
                                    <ThemedText type="code" style={{ color: badgeColor, fontSize: 10 }}>{log.action}</ThemedText>
                                  </View>
                                  <ThemedText type="code" themeColor="textSecondary" style={{ fontSize: 10, marginLeft: 'auto' }}>
                                    {formatTimeAgo(log.createdAt)}
                                  </ThemedText>
                                </View>
                                <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 4, fontSize: 12 }}>
                                  {log.notes}
                                </ThemedText>
                                <ThemedText type="code" themeColor="textSecondary" style={{ fontSize: 10, marginTop: 4 }}>
                                  Por: {log.userName} ({log.userRole})
                                </ThemedText>
                              </View>
                            </View>
                          );
                        })
                      )}
                    </View>
                  ) : (
                    /* Comments section */
                    <View style={styles.commentsSection}>
                      {commentsList.length === 0 ? (
                        <View style={styles.emptySection}>
                          <Ionicons name="chatbubbles-outline" size={32} color={theme.textSecondary} />
                          <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center', marginTop: 8 }}>
                            Sem comentários. Seja o primeiro!
                          </ThemedText>
                        </View>
                      ) : (
                        commentsList.map((comment: any) => (
                          <View key={comment._id} style={styles.commentItem}>
                            <Ionicons name="person-circle" size={34} color={theme.textSecondary} />
                            <View style={[styles.commentBubble, { backgroundColor: theme.background }]}>
                              <View style={styles.commentUserRow}>
                                <ThemedText type="smallBold" style={{ fontSize: 13 }}>{comment.user.name}</ThemedText>
                                {comment.user.role !== 'citizen' && (
                                  <View style={[styles.staffTag, { backgroundColor: '#FCD11620' }]}>
                                    <ThemedText type="code" style={{ color: '#FCD116', fontSize: 8 }}>
                                      {comment.user.role.toUpperCase()}
                                    </ThemedText>
                                  </View>
                                )}
                                <ThemedText type="code" themeColor="textSecondary" style={{ fontSize: 10, marginLeft: 'auto' }}>
                                  {formatTimeAgo(comment.createdAt)}
                                </ThemedText>
                              </View>
                              <ThemedText type="small" style={{ fontSize: 13, marginTop: 2 }}>{comment.content}</ThemedText>
                            </View>
                          </View>
                        ))
                      )}
                    </View>
                  )}
                </>
              )}
            </ScrollView>

            {/* Comment input — always visible at bottom when in comments mode */}
            {modalTab === 'comments' && (
              <View style={[styles.commentInputRow, { borderTopColor: theme.backgroundSelected }]}>
                <TextInput
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="Escreva um comentário..."
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.commentInput, { color: theme.text, backgroundColor: theme.background }]}
                  multiline
                />
                <Pressable
                  onPress={handlePostComment}
                  disabled={isPostingComment || !commentText.trim()}
                  style={[styles.sendButton, { opacity: (isPostingComment || !commentText.trim()) ? 0.45 : 1 }]}>
                  {isPostingComment ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Ionicons name="send" size={16} color="#FFF" />
                  )}
                </Pressable>
              </View>
            )}
          </ThemedView>
        </View>
      </Modal>

      {/* Map Picker for Editing */}
      <Modal
        visible={showEditMapPicker}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowEditMapPicker(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
          <View style={styles.mapPickerHeader}>
            <Pressable onPress={() => setShowEditMapPicker(false)} style={styles.mapPickerClose}>
              <Ionicons name="close" size={24} color="#FFF" />
            </Pressable>
            <ThemedText style={{ color: '#FFF', fontWeight: '700', fontSize: 16 }}>
              Ajustar Localização
            </ThemedText>
            <Pressable
              onPress={handleConfirmEditMapLocation}
              disabled={isGeocodingMap}
              style={[styles.mapPickerConfirm, { opacity: isGeocodingMap ? 0.5 : 1 }]}
            >
              <ThemedText style={{ color: '#FCD116', fontWeight: '700' }}>
                {isGeocodingMap ? 'A confirmar...' : 'Confirmar'}
              </ThemedText>
            </Pressable>
          </View>

          <View style={{ flex: 1 }}>
            <LeafletMobileMap
              initialCenter={{ latitude: tempLatitude, longitude: tempLongitude }}
              pinCoordinates={{ latitude: tempLatitude, longitude: tempLongitude }}
              onMapClick={(coords) => {
                setTempLatitude(coords.latitude);
                setTempLongitude(coords.longitude);
              }}
              zoom={14}
            />
          </View>

          <View style={[styles.mapPickerFooter, { backgroundColor: 'rgba(0,0,0,0.85)' }]}>
            <Ionicons name="location" size={16} color="#FF3B30" />
            <ThemedText style={{ color: '#FFF', fontSize: 12, marginLeft: 6, flex: 1 }}>
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
  headerOverlay: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: 14,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: Spacing.two,
    padding: 0,
  },
  filterButton: {
    padding: Spacing.one,
  },
  categoryList: {
    maxHeight: 40,
  },
  categoryListContent: {
    gap: Spacing.one,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipPressable: {
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 6,
  },
  chipGradient: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    flex: 1,
  },
  markerPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  detailCard: {
    position: 'absolute',
    bottom: Spacing.four,
    left: Spacing.three,
    right: Spacing.three,
    borderRadius: 20,
    padding: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    flex: 1,
    marginRight: Spacing.two,
  },
  detailTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  detailLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  locationText: {
    marginLeft: Spacing.one,
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  primaryButton: {
    flex: 1,
    height: 40,
    backgroundColor: '#CE1126',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.one,
  },
  primaryButtonText: {
    color: '#FFF',
  },
  secondaryButton: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.2)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '75%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: Spacing.two,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.1)',
  },
  modalTabs: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  modalTabButton: {
    paddingVertical: Spacing.one,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  modalTabButtonActive: {
    borderBottomColor: '#FCD116',
  },
  modalTabText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: Spacing.one,
  },
  commentsListContainer: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  emptyCommentsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
  },
  commentItem: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  commentBubble: {
    flex: 1,
    backgroundColor: 'rgba(128,128,128,0.05)',
    borderRadius: 12,
    padding: Spacing.two,
  },
  commentUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  staffTag: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderTopWidth: 1,
    gap: Spacing.two,
  },
  commentInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 80,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#CE1126',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyListContainer: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
  historyItem: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  timelineConnectorCol: {
    alignItems: 'center',
    width: 16,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: 'rgba(128,128,128,0.15)',
    marginVertical: 4,
  },
  historyContent: {
    flex: 1,
    paddingBottom: Spacing.four,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dragHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(128,128,128,0.3)', alignSelf: 'center', marginBottom: 8 },
  closeBtn: {
    position: 'absolute', top: 16, right: 16,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(128,128,128,0.15)',
    justifyContent: 'center', alignItems: 'center', zIndex: 10,
  },
  modalScroll: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.five },
  modalAuthorRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    paddingBottom: Spacing.three, marginBottom: Spacing.two,
    borderBottomWidth: 1, borderBottomColor: 'rgba(128,128,128,0.1)',
  },
  modalAvatar: { width: 44, height: 44, borderRadius: 22 },
  reputationBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, gap: 2,
  },
  reputationText: { fontSize: 10, fontWeight: 'bold', color: '#D4AF37' },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginBottom: Spacing.two },
  categoryChipSmall: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  categoryChipText: { fontSize: 11, fontWeight: '700' },
  modalTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3, marginBottom: Spacing.two },
  modalDescription: { lineHeight: 22, marginBottom: Spacing.three },
  modalLocationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.three },
  stepperContainer: { borderRadius: 16, padding: Spacing.three, marginBottom: Spacing.three },
  stepperLabel: { fontSize: 12, marginBottom: Spacing.two },
  stepperRow: { flexDirection: 'row', alignItems: 'flex-start' },
  stepItem: { alignItems: 'center', width: 52 },
  stepCircle: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  stepLabel: { textAlign: 'center', lineHeight: 11 },
  stepLine: { flex: 1, height: 2, marginTop: 10, borderRadius: 1 },
  sectionTabsRow: {
    flexDirection: 'row', gap: Spacing.three,
    borderBottomWidth: 1, borderBottomColor: 'rgba(128,128,128,0.1)',
    marginBottom: Spacing.three,
  },
  sectionTab: { paddingVertical: 10, paddingHorizontal: 2, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  sectionTabActive: { borderBottomColor: '#FCD116' },
  sectionTabText: { fontSize: 14, fontWeight: '700' },
  historySection: { paddingBottom: Spacing.three },
  timelineCol: { alignItems: 'center', width: 16 },
  historyCard: { flex: 1, borderRadius: 12, padding: Spacing.two },
  historyCardHeader: { flexDirection: 'row', alignItems: 'center' },
  historyBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  commentsSection: { paddingBottom: Spacing.three },
  emptySection: { alignItems: 'center', paddingVertical: Spacing.four },
  ownerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
    marginBottom: Spacing.three,
  },
  editActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(252, 209, 22, 0.1)',
  },
  deleteActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  editFormContainer: {
    marginBottom: Spacing.three,
    gap: Spacing.two,
  },
  editInputDesc: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: Spacing.one,
  },
  editButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  saveBtn: {
    backgroundColor: '#CE1126',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ECECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImageVertical: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: 12,
    marginBottom: Spacing.two,
    resizeMode: 'cover',
  },
  cardImageVerticalVideo: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: 12,
    marginBottom: Spacing.two,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselContainer: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: Spacing.two,
    position: 'relative',
  },
  carouselScroll: {
    flex: 1,
  },
  carouselIndicator: {
    position: 'absolute',
    bottom: Spacing.two,
    right: Spacing.two,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  indicatorText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  editCategoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editLocationWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  editAdjustBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCD116',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
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
});
