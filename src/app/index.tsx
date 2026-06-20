import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable, TextInput, Image, FlatList, Share, Modal, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { router } from 'expo-router';
import { api } from '../../convex/_generated/api';
import { useMockUser } from '@/hooks/use-mock-user';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useOfflineSync } from '@/hooks/use-offline-sync';
import * as Location from 'expo-location';
import LeafletMobileMap from '@/components/LeafletMobileMap';
import { LinearGradient } from 'expo-linear-gradient';


interface Report {
  _id?: string;
  id: string;
  userId?: string;
  user: {
    name: string;
    avatar: string;
    reputation: number;
  };
  category: string;
  title: string;
  description: string;
  image: string;
  location: string;
  municipality?: string;
  status: 'Aberto' | 'Em Análise' | 'Em Progresso' | 'Resolvido';
  likes: number;
  commentsCount: number;
  followed: boolean;
  liked: boolean;
  createdAt: any;
}

const INITIAL_REPORTS: Report[] = [
  {
    id: '1',
    userId: 'user1',
    user: {
      name: 'Manuel Dos Santos',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      reputation: 120,
    },
    category: 'Lixo',
    title: 'Acumulação de Lixo na Via Pública',
    description: 'Contentores transbordando na berma da estrada principal do Cazenga. O lixo está a espalhar-se pela via impedindo a circulação de pedestres.',
    image: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop&q=80',
    location: 'Avenida Hoji Ya Henda',
    municipality: 'Cazenga, Luanda',
    status: 'Em Análise',
    likes: 45,
    commentsCount: 2,
    followed: false,
    liked: false,
    createdAt: 'Há 10 min',
  },
  {
    id: '2',
    userId: 'user2',
    user: {
      name: 'Ana Bela Costa',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      reputation: 85,
    },
    category: 'Buracos',
    title: 'Buraco Crítico na Faixa Central',
    description: 'Um buraco enorme e profundo abriu-se mesmo no meio da estrada. Muito perigoso para viaturas ligeiras e motorizadas à noite.',
    image: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=600&auto=format&fit=crop&q=80',
    location: 'Rua Direita da Samba',
    municipality: 'Samba, Luanda',
    status: 'Em Progresso',
    likes: 67,
    commentsCount: 1,
    followed: true,
    liked: true,
    createdAt: 'Há 2 horas',
  },
  {
    id: '3',
    userId: 'user3',
    user: {
      name: 'João Francisco',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      reputation: 210,
    },
    category: 'Água',
    title: 'Ruptura de Conduta de Água',
    description: 'Desperdício de grande quantidade de água limpa jorrando debaixo do passeio há mais de 24 horas. Risco de erosão da estrada.',
    image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&auto=format&fit=crop&q=80',
    location: 'Rua do Kero',
    municipality: 'Talatona, Luanda',
    status: 'Resolvido',
    likes: 112,
    commentsCount: 0,
    followed: false,
    liked: false,
    createdAt: 'Há 1 dia',
  },
];

const CATEGORIES = ['Tudo', 'Lixo', 'Buracos', 'Água', 'Energia', 'Segurança', 'Causas Sociais'];

const STATUS_STEPS = ['Aberto', 'Em Análise', 'Em Progresso', 'Resolvido'];
const STATUS_COLORS: Record<string, string> = {
  'Aberto': '#FF3B30',
  'Em Análise': '#FF9500',
  'Em Progresso': '#007AFF',
  'Resolvido': '#34C759',
};

const CATEGORY_ICONS: Record<string, string> = {
  'Lixo': 'trash',
  'Buracos': 'construct',
  'Água': 'water',
  'Energia': 'flash',
  'Segurança': 'shield-checkmark',
  'Causas Sociais': 'heart',
};

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
    action: 'Aberto',
    userName: 'Manuel Dos Santos',
    userRole: 'citizen',
    notes: 'Ocorrência registada pelo cidadão.',
    createdAt: Date.now() - 10800000,
  },
];

const MOCK_COMMENTS = [
  {
    _id: 'c1',
    user: {
      name: 'Ana Bela Costa',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      role: 'citizen',
    },
    content: 'Eu também vi este problema esta manhã! É preciso muito cuidado.',
    createdAt: Date.now() - 3600000,
  },
];

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

export default function FeedScreen() {
  const theme = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('Tudo');
  const [searchQuery, setSearchQuery] = useState('');
  const { isOffline, isSyncing, pendingCount } = useOfflineSync();

  const currentUser = useMockUser();
  const dbReports = useQuery(
    api.reports.list,
    currentUser?._id !== 'dummy-user-id'
      ? { tenantId: 'cazenga', category: selectedCategory, userId: currentUser._id }
      : { tenantId: 'cazenga', category: selectedCategory }
  ) as any;

  const toggleLike = useMutation(api.likes.toggle);
  const toggleFollow = useMutation(api.follows.toggle);
  const postCommentMutation = useMutation(api.comments.add);

  const [reports, setReports] = useState<Report[]>(INITIAL_REPORTS);
  const reportsList = dbReports !== undefined ? dbReports : reports;

  // Details modal state
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [modalSection, setModalSection] = useState<'details' | 'comments'>('details');
  const [commentText, setCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [mockComments, setMockComments] = useState<any[]>(MOCK_COMMENTS);

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
    if (!selectedReport) return;
    setEditCategory(selectedReport.category);
    setEditDescription(selectedReport.description);
    setEditLocation(selectedReport.location);
    setEditLatitude(selectedReport.latitude);
    setEditLongitude(selectedReport.longitude);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedReport || !currentUser) return;
    if (!editDescription.trim()) { Alert.alert('Erro', 'Insira uma descrição.'); return; }
    if (!editLocation.trim()) { Alert.alert('Erro', 'Insira uma localização.'); return; }

    setSubmittingEdit(true);
    try {
      await editReportMutation({
        reportId: selectedReport._id as any,
        userId: currentUser._id,
        category: editCategory,
        description: editDescription.trim(),
        location: editLocation.trim(),
        latitude: editLatitude,
        longitude: editLongitude,
      });
      
      setSelectedReport({
        ...selectedReport,
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
    if (!selectedReport || !currentUser) return;

    Alert.alert(
      'Eliminar Ocorrência',
      'Tem a certeza que deseja eliminar esta ocorrência definitivamente?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReportMutation({
                reportId: selectedReport._id as any,
                userId: currentUser._id,
              });
              handleClose();
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

  const dbComments = useQuery(
    api.comments.list,
    selectedReport?._id ? { reportId: selectedReport._id } : 'skip'
  ) as any;

  const dbHistory = useQuery(
    api.reports.history,
    selectedReport?._id ? { reportId: selectedReport._id } : 'skip'
  ) as any;

  const commentsList = dbComments !== undefined ? dbComments : mockComments;
  const historyList = dbHistory !== undefined ? dbHistory : MOCK_HISTORY_LOGS;

  const handleOpenDetails = (report: any) => {
    setSelectedReport(report);
    setModalSection('details');
  };

  const handleOpenComments = (report: any) => {
    setSelectedReport(report);
    setModalSection('comments');
  };

  const handleClose = () => {
    setSelectedReport(null);
    setCommentText('');
    setModalSection('details');
    setIsEditing(false);
  };

  const handleNavigateToProfile = (userId: string) => {
    if (userId) {
      handleClose();
      setTimeout(() => {
        router.push({ pathname: '/profile', params: { userId } });
      }, 100);
    }
  };

  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    setIsPostingComment(true);
    try {
      if (selectedReport?._id && currentUser?._id && currentUser._id !== 'dummy-user-id') {
        await postCommentMutation({ reportId: selectedReport._id, userId: currentUser._id, content: commentText });
      } else {
        const newComment = {
          _id: Math.random().toString(),
          user: { name: currentUser.name, avatar: currentUser.avatar, role: currentUser.role },
          content: commentText,
          createdAt: Date.now(),
        };
        setMockComments((prev) => [...prev, newComment]);
        setReports((prev) =>
          prev.map((r) =>
            (r._id || r.id) === (selectedReport?._id || selectedReport?.id)
              ? { ...r, commentsCount: r.commentsCount + 1 }
              : r
          )
        );
      }
      setCommentText('');
    } catch (err) {
      console.error('Comment error:', err);
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleLike = async (id: string) => {
    if (dbReports !== undefined && currentUser?._id && currentUser._id !== 'dummy-user-id') {
      try { await toggleLike({ reportId: id as any, userId: currentUser._id }); }
      catch (err) { console.error(err); }
    } else {
      setReports((prev) =>
        prev.map((r) =>
          (r._id || r.id) === id
            ? { ...r, liked: !r.liked, likes: r.liked ? r.likes - 1 : r.likes + 1 }
            : r
        )
      );
    }
  };

  const handleFollow = async (id: string) => {
    if (dbReports !== undefined && currentUser?._id && currentUser._id !== 'dummy-user-id') {
      try { await toggleFollow({ reportId: id as any, userId: currentUser._id }); }
      catch (err) { console.error(err); }
    } else {
      setReports((prev) =>
        prev.map((r) =>
          (r._id || r.id) === id ? { ...r, followed: !r.followed } : r
        )
      );
    }
  };

  const handleShare = async (report: Report) => {
    try {
      await Share.share({ message: `Olha para este problema em ${report.municipality || 'Cazenga'}: "${report.title}" - relatado na nossa app.` });
    } catch (_) {}
  };

  const filteredReports = reportsList.filter((report: any) => {
    const matchesCategory = selectedCategory === 'Tudo' || (report.category && report.category.split(',').map((c: string) => c.trim()).includes(selectedCategory));
    const matchesSearch =
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getStatusColor = (status: string) => STATUS_COLORS[status] ?? theme.textSecondary;

  const getStatusStep = (status: string) => STATUS_STEPS.indexOf(status);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      {/* Offline Status Banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={16} color="#FFF" />
          <ThemedText style={styles.offlineText}>
            Modo Offline ativo. Ocorrências criadas serão salvas localmente.
          </ThemedText>
        </View>
      )}

      {/* Syncing Overlay Banner */}
      {isSyncing && (
        <View style={styles.syncingBanner}>
          <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 8 }} />
          <ThemedText style={styles.syncingText}>
            A enviar {pendingCount} ocorrência(s) guardada(s) offline...
          </ThemedText>
        </View>
      )}

      {/* Header */}
      <ThemedView style={styles.header}>
        <View>
          <ThemedText style={styles.titleText}>Minha Banda</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">Melhorando a comunidade de Angola</ThemedText>
        </View>
        <Pressable 
          onPress={() => router.push('/activity')}
          style={[styles.iconButton, { backgroundColor: theme.backgroundElement }]}
        >
          <Ionicons name="notifications-outline" size={24} color={theme.text} />
          <View style={styles.badge} />
        </Pressable>
      </ThemedView>

      {/* Search */}
      <View style={styles.searchContainer}>
        <ThemedView type="backgroundElement" style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
          <TextInput
            placeholder="Pesquisar ocorrências..."
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInput, { color: theme.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </ThemedView>
      </View>

      {/* Category chips */}
      <View style={styles.categoriesWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
          {CATEGORIES.map((cat) => {
            const isSelected = cat === selectedCategory;
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={styles.categoryChipPressable}
              >
                {isSelected ? (
                  <LinearGradient
                    colors={['#CE1126', '#000000']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.categoryChipGradient}
                  >
                    <ThemedText type="smallBold" style={{ color: '#FCD116' }}>
                      {cat}
                    </ThemedText>
                  </LinearGradient>
                ) : (
                  <View style={[styles.categoryChip, { backgroundColor: theme.backgroundElement }]}>
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

      {/* Feed */}
      <FlatList
        data={filteredReports}
        keyExtractor={(item) => item._id || item.id}
        contentContainerStyle={styles.feedContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={theme.textSecondary} />
            <ThemedText themeColor="textSecondary" style={styles.emptyText}>Nenhuma ocorrência encontrada.</ThemedText>
          </View>
        }
        renderItem={({ item }) => (
          <ThemedView type="backgroundElement" style={styles.card}>
            {/* Card Header — clicking avatar/name goes to profile */}
            <View style={styles.cardHeader}>
              <Pressable
                onPress={() => handleNavigateToProfile(item.userId || item.user?._id || '')}
                style={styles.headerUserPressable}>
                <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
                <View style={styles.headerInfo}>
                  <View style={styles.nameRow}>
                    <ThemedText type="smallBold">{item.user.name}</ThemedText>
                    <View style={styles.reputationBadge}>
                      <Ionicons name="star" size={10} color="#FFD700" />
                      <ThemedText type="code" style={styles.reputationText}>{item.user.reputation}</ThemedText>
                    </View>
                  </View>
                  <ThemedText type="small" themeColor="textSecondary">
                    {formatTimeAgo(item.createdAt)} • {item.tenantId ? (item.tenantId.charAt(0).toUpperCase() + item.tenantId.slice(1)) : (item.municipality || 'Luanda')}
                  </ThemedText>
                </View>
              </Pressable>
              <View style={[styles.statusTag, { backgroundColor: `${getStatusColor(item.status)}18` }]}>
                <ThemedText type="code" style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                  {item.status}
                </ThemedText>
              </View>
            </View>

            {/* Card Content — clicking opens the full details modal */}
            <Pressable onPress={() => handleOpenDetails(item)} style={styles.cardContent}>
              <ThemedText type="default" style={styles.cardTitle}>{item.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.cardDescription} numberOfLines={2}>
                {item.description}
              </ThemedText>
              <MediaCarousel images={item.images} videos={item.videos} fallbackImage={item.image} />
              <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color="#FF3B30" />
                <ThemedText type="small" themeColor="textSecondary" style={styles.locationText}>{item.location}</ThemedText>
              </View>
            </Pressable>

            {/* Card Actions */}
            <View style={styles.cardActions}>
              {/* Like — tap directly on icon */}
              <Pressable onPress={() => handleLike(item._id || item.id)} style={styles.actionButton}>
                <Ionicons name={item.liked ? 'heart' : 'heart-outline'} size={20} color={item.liked ? '#FF3B30' : theme.textSecondary} />
                <ThemedText type="small" themeColor={item.liked ? 'text' : 'textSecondary'}>{item.likes}</ThemedText>
              </Pressable>

              {/* Comment — tap to open modal on comments section */}
              <Pressable onPress={() => handleOpenComments(item)} style={styles.actionButton}>
                <Ionicons name="chatbubble-outline" size={18} color={theme.textSecondary} />
                <ThemedText type="small" themeColor="textSecondary">{item.commentsCount}</ThemedText>
              </Pressable>

              {/* Share */}
              <Pressable onPress={() => handleShare(item)} style={styles.actionButton}>
                <Ionicons name="share-social-outline" size={18} color={theme.textSecondary} />
              </Pressable>

              {/* Follow */}
              <Pressable
                onPress={() => handleFollow(item._id || item.id)}
                style={[styles.followButton, { borderColor: item.followed ? '#208AEF' : theme.textSecondary }]}>
                <ThemedText type="code" style={{ color: item.followed ? '#208AEF' : theme.textSecondary }}>
                  {item.followed ? 'Seguindo' : '+ Seguir'}
                </ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        )}
      />

      {/* Full Complaint Details Modal */}
      <Modal
        visible={selectedReport !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <ThemedView type="backgroundElement" style={styles.modalContainer}>
            {/* Modal drag handle */}
            <View style={styles.dragHandle} />

            {/* Close button */}
            <Pressable onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={theme.text} />
            </Pressable>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              {selectedReport && (
                <>
                  {/* Author row */}
                  <Pressable
                    style={styles.modalAuthorRow}
                    onPress={() => handleNavigateToProfile(selectedReport.userId || selectedReport.user?._id || '')}
                  >
                    <Image source={{ uri: selectedReport.user?.avatar }} style={styles.modalAvatar} />
                    <View style={{ flex: 1 }}>
                      <ThemedText type="smallBold">{selectedReport.user?.name}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {formatTimeAgo(selectedReport.createdAt)} • {selectedReport.municipality || selectedReport.location}
                      </ThemedText>
                    </View>
                    <View style={styles.reputationBadge}>
                      <Ionicons name="star" size={10} color="#FFD700" />
                      <ThemedText type="code" style={styles.reputationText}>{selectedReport.user?.reputation}</ThemedText>
                    </View>
                  </Pressable>

                  {/* Category + Title */}
                  <View style={styles.modalTitleRow}>
                    <View style={[styles.categoryChipSmall, { backgroundColor: `${getStatusColor(selectedReport.status)}18` }]}>
                      <Ionicons name={(CATEGORY_ICONS[selectedReport.category ? selectedReport.category.split(',')[0].trim() : ''] || 'alert') as any} size={12} color={getStatusColor(selectedReport.status)} />
                      <ThemedText type="code" style={[styles.categoryChipText, { color: getStatusColor(selectedReport.status) }]}>
                        {selectedReport.category}
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
                          <Ionicons name="map-outline" size={14} color="#208AEF" />
                          <ThemedText type="code" style={{ color: '#208AEF', fontSize: 10, marginLeft: 2 }}>Ajustar</ThemedText>
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
                      <ThemedText style={styles.modalTitle}>{selectedReport.title}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary" style={styles.modalDescription}>
                        {selectedReport.description}
                      </ThemedText>
                      
                      {selectedReport.userId === currentUser?._id && (
                        <View style={styles.ownerActionsRow}>
                          <Pressable onPress={handleStartEdit} style={styles.editActionBtn}>
                            <Ionicons name="create-outline" size={14} color="#208AEF" />
                            <ThemedText type="smallBold" style={{ color: '#208AEF', marginLeft: 4 }}>Editar</ThemedText>
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
                  <MediaCarousel images={selectedReport.images} videos={selectedReport.videos} fallbackImage={selectedReport.image} />

                  {/* Location */}
                  <View style={styles.modalLocationRow}>
                    <Ionicons name="location" size={16} color="#FF3B30" />
                    <ThemedText type="small" themeColor="textSecondary" style={{ marginLeft: 6 }}>
                      {selectedReport.location}
                    </ThemedText>
                  </View>

                  {/* Status Progress Stepper */}
                  <View style={[styles.stepperContainer, { backgroundColor: theme.background }]}>
                    <ThemedText type="smallBold" style={styles.stepperLabel}>Estado da Ocorrência</ThemedText>
                    <View style={styles.stepperRow}>
                      {STATUS_STEPS.map((step, index) => {
                        const currentStep = getStatusStep(selectedReport.status);
                        const isCompleted = index <= currentStep;
                        const isActive = index === currentStep;
                        const color = isActive ? getStatusColor(selectedReport.status) : isCompleted ? '#34C759' : theme.backgroundSelected as string;
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
                            {index < STATUS_STEPS.length - 1 && (
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
                      onPress={() => setModalSection('details')}
                      style={[styles.sectionTab, modalSection === 'details' && styles.sectionTabActive]}>
                      <ThemedText style={[styles.sectionTabText, modalSection === 'details' && { color: '#208AEF' }]}>
                        Histórico
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => setModalSection('comments')}
                      style={[styles.sectionTab, modalSection === 'comments' && styles.sectionTabActive]}>
                      <ThemedText style={[styles.sectionTabText, modalSection === 'comments' && { color: '#208AEF' }]}>
                        Discussão ({commentsList.length})
                      </ThemedText>
                    </Pressable>
                  </View>

                  {modalSection === 'details' ? (
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
                          const badgeColor = STATUS_COLORS[log.action] ?? '#8E8E93';
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
                            <Image source={{ uri: comment.user.avatar }} style={styles.commentAvatar} />
                            <View style={[styles.commentBubble, { backgroundColor: theme.background }]}>
                              <View style={styles.commentUserRow}>
                                <ThemedText type="smallBold" style={{ fontSize: 13 }}>{comment.user.name}</ThemedText>
                                {comment.user.role !== 'citizen' && (
                                  <View style={[styles.staffTag, { backgroundColor: '#208AEF20' }]}>
                                    <ThemedText type="code" style={{ color: '#208AEF', fontSize: 8 }}>
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
            {modalSection === 'comments' && (
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
              <ThemedText style={{ color: '#208AEF', fontWeight: '700' }}>
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
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  titleText: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  iconButton: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  badge: {
    position: 'absolute', top: 10, right: 10,
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30',
  },
  searchContainer: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.one },
  searchInputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.three, borderRadius: 12, height: 44,
  },
  searchIcon: { marginRight: Spacing.two },
  searchInput: { flex: 1, fontSize: 16, padding: 0 },
  categoriesWrapper: { paddingVertical: Spacing.two },
  categoriesContainer: { paddingHorizontal: Spacing.three, gap: Spacing.two },
  categoryChip: { paddingHorizontal: Spacing.three, paddingVertical: 8, borderRadius: 20 },
  categoryChipPressable: { borderRadius: 20, overflow: 'hidden' },
  categoryChipGradient: { paddingHorizontal: Spacing.three, paddingVertical: 8, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  feedContainer: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.five },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.six, gap: Spacing.two },
  emptyText: { textAlign: 'center' },
  card: { borderRadius: 16, padding: Spacing.three, marginBottom: Spacing.three },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.two },
  headerUserPressable: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: Spacing.two },
  headerInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  reputationBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, gap: 2,
  },
  reputationText: { fontSize: 10, fontWeight: 'bold', color: '#D4AF37' },
  statusTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  cardContent: { marginBottom: Spacing.three },
  cardTitle: { fontWeight: 'bold', fontSize: 17, marginBottom: Spacing.one },
  cardDescription: { lineHeight: 20, marginBottom: Spacing.two },
  cardImage: { width: '100%', height: 180, borderRadius: 12, marginBottom: Spacing.two },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationText: { marginLeft: 4, fontSize: 12 },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1, borderTopColor: 'rgba(128,128,128,0.1)',
    paddingTop: Spacing.two, alignItems: 'center', gap: Spacing.four,
  },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  followButton: { marginLeft: 'auto', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalContainer: { borderTopLeftRadius: 28, borderTopRightRadius: 28, height: '92%', paddingTop: 8 },
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
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginBottom: Spacing.two },
  categoryChipSmall: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  categoryChipText: { fontSize: 11, fontWeight: '700' },
  modalTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3, marginBottom: Spacing.two },
  modalDescription: { lineHeight: 22, marginBottom: Spacing.three },
  modalImage: { width: '100%', height: 220, borderRadius: 16, marginBottom: Spacing.three },
  modalLocationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.three },
  // Status Stepper
  stepperContainer: { borderRadius: 16, padding: Spacing.three, marginBottom: Spacing.three },
  stepperLabel: { fontSize: 12, marginBottom: Spacing.two },
  stepperRow: { flexDirection: 'row', alignItems: 'flex-start' },
  stepItem: { alignItems: 'center', width: 52 },
  stepCircle: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  stepLabel: { textAlign: 'center', lineHeight: 11 },
  stepLine: { flex: 1, height: 2, marginTop: 10, borderRadius: 1 },
  // Section tabs
  sectionTabsRow: {
    flexDirection: 'row', gap: Spacing.three,
    borderBottomWidth: 1, borderBottomColor: 'rgba(128,128,128,0.1)',
    marginBottom: Spacing.three,
  },
  sectionTab: { paddingVertical: 10, paddingHorizontal: 2, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  sectionTabActive: { borderBottomColor: '#208AEF' },
  sectionTabText: { fontSize: 14, fontWeight: '700' },
  // History
  historySection: { paddingBottom: Spacing.three },
  historyItem: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.three },
  timelineCol: { alignItems: 'center', width: 16 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  timelineLine: { width: 2, flex: 1, backgroundColor: 'rgba(128,128,128,0.15)', marginTop: 4, marginBottom: -8 },
  historyCard: { flex: 1, borderRadius: 12, padding: Spacing.two },
  historyCardHeader: { flexDirection: 'row', alignItems: 'center' },
  historyBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  // Comments
  commentsSection: { paddingBottom: Spacing.three },
  emptySection: { alignItems: 'center', paddingVertical: Spacing.four },
  commentItem: { flexDirection: 'row', marginBottom: Spacing.three, gap: Spacing.two },
  commentAvatar: { width: 34, height: 34, borderRadius: 17 },
  commentBubble: { flex: 1, borderRadius: 14, paddingHorizontal: Spacing.two, paddingVertical: 8 },
  commentUserRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  staffTag: { paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 },
  commentInputRow: {
    flexDirection: 'row', padding: Spacing.three,
    alignItems: 'center', borderTopWidth: 1, gap: Spacing.two,
  },
  commentInput: {
    flex: 1, borderRadius: 20, paddingHorizontal: Spacing.three, paddingVertical: 8, fontSize: 14, maxHeight: 80,
  },
  sendButton: {
    backgroundColor: '#208AEF', width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
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
    backgroundColor: 'rgba(32, 138, 239, 0.1)',
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
  editInputTitle: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: Spacing.one,
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
    borderColor: '#208AEF',
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
    borderColor: '#208AEF',
  },
  mapPickerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    backgroundColor: '#208AEF',
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
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E53935',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginHorizontal: Spacing.three,
    marginTop: Spacing.two,
    gap: 8,
  },
  offlineText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  syncingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#208AEF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginHorizontal: Spacing.three,
    marginTop: Spacing.two,
  },
  syncingText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
