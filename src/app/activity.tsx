import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable, FlatList, Image, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useMockUser } from '@/hooks/use-mock-user';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import * as Location from 'expo-location';
import LeafletMobileMap from '@/components/LeafletMobileMap';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';


interface ActivityItem {
  _id?: string;
  id: string;
  category: string;
  title: string;
  location: string;
  status: 'Aberto' | 'Em Análise' | 'Em Progresso' | 'Resolvido';
  date?: string;
  createdAt?: number;
  image: string;
}

const MY_REPORTS: ActivityItem[] = [
  {
    id: '1',
    category: 'Lixo',
    title: 'Acumulação de Lixo na Via Pública',
    location: 'Avenida Hoji Ya Henda, Cazenga',
    status: 'Aberto',
    date: '16 Jun 2026',
    image: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '2',
    category: 'Água',
    title: 'Ruptura de Tubagem de Esgoto',
    location: 'Rua do Kero, Talatona',
    status: 'Resolvido',
    date: '10 Jun 2026',
    image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&auto=format&fit=crop&q=80',
  },
];

const FOLLOWED_REPORTS: ActivityItem[] = [
  {
    id: '3',
    category: 'Buracos',
    title: 'Buraco Crítico na Faixa Central',
    location: 'Rua Direita da Samba, Samba',
    status: 'Em Progresso',
    date: '14 Jun 2026',
    image: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=600&auto=format&fit=crop&q=80',
  },
];

// Fallback Mock Data for Marketplace & Operations
const MOCK_AVAILABLE_JOBS = [
  {
    _id: 'job1',
    status: 'Pendente',
    report: {
      _id: 'r1',
      category: 'Lixo',
      title: 'Acumulação de Lixo e Plásticos',
      location: 'Avenida Hoji Ya Henda, Cazenga',
      description: 'Grandes contentores de lixo transbordando há mais de 3 dias na via de circulação.',
      image: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600',
      createdAt: Date.now() - 3600000,
      reporterName: 'Manuel Dos Santos',
    }
  }
];

const MOCK_MY_JOBS = [
  {
    _id: 'job2',
    status: 'Aceito',
    beforeImage: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600',
    report: {
      _id: 'r2',
      category: 'Lixo',
      title: 'Lixo junto à Escola Secundária',
      location: 'Rua Direita da Samba',
      description: 'Resíduos perigosos e plásticos descartados nas imediações do estabelecimento escolar.',
      image: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600',
      createdAt: Date.now() - 7200000,
      reporterName: 'Ana Bela Costa',
    }
  }
];

const MOCK_VALIDATION_JOBS = [
  {
    _id: 'job3',
    status: 'Concluído',
    beforeImage: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600',
    afterImage: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600',
    report: {
      _id: 'r3',
      category: 'Lixo',
      title: 'Limpeza de Entulhos na Via Pública',
      location: 'Estrada de Catete, Luanda',
      description: 'Restos de obras deitados à face da estrada principal.',
      image: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600',
      createdAt: Date.now() - 86400000,
      reporterName: 'João Francisco',
    }
  }
];

const formatDate = (timestamp: any) => {
  if (!timestamp) return 'Recente';
  if (typeof timestamp === 'string') return timestamp;
  return new Date(timestamp).toLocaleDateString('pt-AO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatTimeAgo = (timestamp: any) => {
  if (!timestamp) return 'Recente';
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

const STATUS_STEPS = ['Aberto', 'Em Análise', 'Em Progresso', 'Resolvido'];

const getStatusStep = (status: string) => {
  switch (status) {
    case 'Aberto': return 0;
    case 'Em Análise': return 1;
    case 'Em Progresso': return 2;
    case 'Resolvido': return 3;
    default: return 0;
  }
};

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
  'Segurança': 'shield',
  'Causas Sociais': 'heart',
  'Outro': 'alert',
};

const MOCK_COMMENTS = [
  { _id: 'c1', user: { name: 'Admin', role: 'supervisor' }, content: 'Entraremos em contacto com os operadores locais.', createdAt: Date.now() - 3600000 * 2 }
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

export default function ActivityScreen() {
  const theme = useTheme();
  const currentUser = useMockUser();
  const router = useRouter();
  
  // Tab states based on roles
  const [activeTab, setActiveTab] = useState<string>('my');
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  // Details modal state
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [modalSection, setModalSection] = useState<'details' | 'comments'>('details');
  const [commentText, setCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [mockComments, setMockComments] = useState<any[]>(MOCK_COMMENTS);

  const editReportMutation = useMutation(api.reports.edit);
  const deleteReportMutation = useMutation(api.reports.remove);
  const postCommentMutation = useMutation(api.comments.add);

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

  // Set default tab when user role changes
  React.useEffect(() => {
    if (currentUser.role === 'operator') {
      setActiveTab('available');
    } else if (currentUser.role === 'supervisor') {
      setActiveTab('validation');
    } else {
      setActiveTab('my');
    }
  }, [currentUser.role]);

  // --- Convex queries & mutations ---
  const dbReports = useQuery(
    api.reports.list,
    currentUser?._id !== 'dummy-user-id'
      ? { tenantId: 'cazenga', userId: currentUser._id }
      : { tenantId: 'cazenga' }
  ) as any;

  // Marketplace & Jobs queries
  const dbAvailableJobs = useQuery(
    api.jobs.list,
    currentUser.role === 'operator' ? { status: 'Pendente' } : 'skip'
  );
  
  const dbMyJobs = useQuery(
    api.jobs.list,
    currentUser.role === 'operator' && currentUser._id !== 'dummy-user-id'
      ? { operatorId: currentUser._id }
      : 'skip'
  );

  const dbValidationJobs = useQuery(
    api.jobs.list,
    currentUser.role === 'supervisor' ? { status: 'Concluído' } : 'skip'
  );

  // Mutations
  const acceptJob = useMutation(api.jobs.accept);
  const completeJob = useMutation(api.jobs.complete);
  const validateJob = useMutation(api.jobs.validate);

  // Fallbacks - prevent flashing mock data on load
  const isMock = currentUser?._id === 'dummy-user-id';

  const myReportsList = dbReports !== undefined
    ? dbReports.filter((r: any) => r.userId === currentUser._id)
    : (isMock ? MY_REPORTS : []);

  const followedReportsList = dbReports !== undefined
    ? dbReports.filter((r: any) => r.followed)
    : (isMock ? FOLLOWED_REPORTS : []);

  const availableJobsList = (dbAvailableJobs !== undefined && dbAvailableJobs !== null 
    ? dbAvailableJobs 
    : (isMock ? MOCK_AVAILABLE_JOBS : [])) as any[];

  const myJobsList = (dbMyJobs !== undefined && dbMyJobs !== null 
    ? dbMyJobs 
    : (isMock ? MOCK_MY_JOBS : [])) as any[];

  const validationJobsList = (dbValidationJobs !== undefined && dbValidationJobs !== null 
    ? dbValidationJobs 
    : (isMock ? MOCK_VALIDATION_JOBS : [])) as any[];


  const resolvedCount = myReportsList.filter((r: any) => r.status === 'Resolvido').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aberto': return '#FF3B30';
      case 'Em Análise': return '#FF9500';
      case 'Em Progresso': return '#007AFF';
      case 'Resolvido': return '#34C759';
      case 'Pendente': return '#FF9500';
      case 'Aceito': return '#007AFF';
      case 'Concluído': return '#AF52DE';
      case 'Validado': return '#34C759';
      default: return theme.textSecondary;
    }
  };

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
        { text: 'Cancelar', style: 'cancel' },
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
  const historyList = dbHistory !== undefined ? dbHistory : [];

  const handleOpenDetails = (report: any) => {
    setSelectedReport(report);
    setModalSection('details');
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
      }
      setCommentText('');
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Não foi possível postar o comentário.');
    } finally {
      setIsPostingComment(false);
    }
  };

  // --- Handlers ---
  const handleAcceptJob = async (jobId: string) => {
    if (currentUser._id === 'dummy-user-id') {
      Alert.alert('Simulação', 'Aceitou este trabalho com sucesso! (Modo Simulação local)');
      return;
    }
    setLoadingActionId(jobId);
    try {
      await acceptJob({ jobId: jobId as any, operatorId: currentUser._id });
      Alert.alert('Sucesso', 'Aceitou o trabalho. Por favor, desloque-se ao local e execute o serviço.');
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Não foi possível aceitar o trabalho.');
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleCompleteJob = async (jobId: string) => {
    if (currentUser._id === 'dummy-user-id') {
      Alert.alert('Simulação', 'Trabalho marcado como concluído! Evidência enviada para o supervisor. (Modo Simulação local)');
      return;
    }
    setLoadingActionId(jobId);
    try {
      await completeJob({
        jobId: jobId as any,
        operatorId: currentUser._id,
        afterImage: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&auto=format&fit=crop&q=80',
      });
      Alert.alert('Sucesso', 'Evidência enviada! O supervisor irá validar o trabalho em breve.');
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Não foi possível concluir o trabalho.');
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleValidateJob = async (jobId: string, approved: boolean) => {
    if (currentUser._id === 'dummy-user-id') {
      Alert.alert('Simulação', approved ? 'Trabalho validado e ocorrência fechada!' : 'Trabalho rejeitado e devolvido ao operador.');
      return;
    }
    setLoadingActionId(jobId);
    try {
      await validateJob({
        jobId: jobId as any,
        supervisorId: currentUser._id,
        approved,
        notes: approved ? 'Limpeza excelente, validada.' : 'Lixo não recolhido na sua totalidade.',
      });
      Alert.alert('Sucesso', approved ? 'Trabalho validado com sucesso!' : 'Trabalho devolvido ao operador.');
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Não foi possível validar o trabalho.');
    } finally {
      setLoadingActionId(null);
    }
  };

  if (currentUser.isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color="#FCD116" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.title}>
          {currentUser.role === 'operator' ? 'Painel do Operador' : currentUser.role === 'supervisor' ? 'Painel do Supervisor' : 'Minha Actividade'}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {currentUser.role === 'operator'
            ? 'Gerencie e recolha trabalhos de limpeza no mercado'
            : currentUser.role === 'supervisor'
            ? 'Valide os trabalhos executados pelos operadores'
            : 'Acompanhe os seus contributos e ocorrências'}
        </ThemedText>
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsContainer}>
        {currentUser.role === 'citizen' ? (
          <>
            <ThemedView type="backgroundElement" style={styles.metricBox}>
              <ThemedText type="subtitle" style={styles.metricNumber}>
                {myReportsList.length}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Reportados
              </ThemedText>
            </ThemedView>
            <ThemedView type="backgroundElement" style={styles.metricBox}>
              <ThemedText type="subtitle" style={[styles.metricNumber, { color: '#34C759' }]}>
                {resolvedCount}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Resolvido
              </ThemedText>
            </ThemedView>
            <ThemedView type="backgroundElement" style={styles.metricBox}>
              <ThemedText type="subtitle" style={[styles.metricNumber, { color: '#FCD116' }]}>
                {followedReportsList.length}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Seguidas
              </ThemedText>
            </ThemedView>
          </>
        ) : currentUser.role === 'operator' ? (
          <>
            <ThemedView type="backgroundElement" style={styles.metricBox}>
              <ThemedText type="subtitle" style={styles.metricNumber}>
                {availableJobsList.length}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Disponíveis
              </ThemedText>
            </ThemedView>
            <ThemedView type="backgroundElement" style={styles.metricBox}>
              <ThemedText type="subtitle" style={[styles.metricNumber, { color: '#007AFF' }]}>
                {myJobsList.filter((j: any) => j.status === 'Aceito').length}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Em Execução
              </ThemedText>
            </ThemedView>
            <ThemedView type="backgroundElement" style={styles.metricBox}>
              <ThemedText type="subtitle" style={[styles.metricNumber, { color: '#34C759' }]}>
                {myJobsList.filter((j: any) => j.status === 'Concluído' || j.status === 'Validado').length}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Concluídos
              </ThemedText>
            </ThemedView>
          </>
        ) : (
          <>
            <ThemedView type="backgroundElement" style={styles.metricBox}>
              <ThemedText type="subtitle" style={[styles.metricNumber, { color: '#FF9500' }]}>
                {validationJobsList.length}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Aguardando Validação
              </ThemedText>
            </ThemedView>
            <ThemedView type="backgroundElement" style={styles.metricBox}>
              <ThemedText type="subtitle" style={[styles.metricNumber, { color: '#34C759' }]}>
                {validationJobsList.filter((j: any) => j.status === 'Validado').length}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Validados
              </ThemedText>
            </ThemedView>
          </>
        )}
      </View>

      {/* Scrollable Tab Bar */}
      <View style={styles.tabBarWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarScroll}
        >
          {/* Validation Tab: Only for Supervisors */}
          {currentUser.role === 'supervisor' && (
            <Pressable
              onPress={() => setActiveTab('validation')}
              style={styles.tabButton}
            >
              <ThemedText type="smallBold" style={{ color: activeTab === 'validation' ? '#FCD116' : theme.textSecondary, paddingBottom: 4 }}>
                Fila de Validação ({validationJobsList.length})
              </ThemedText>
              {activeTab === 'validation' && (
                <LinearGradient
                  colors={['#CE1126', '#000000']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.tabUnderline}
                />
              )}
            </Pressable>
          )}

          {/* Operator Tabs: Only for Operators */}
          {currentUser.role === 'operator' && (
            <>
              <Pressable
                onPress={() => setActiveTab('available')}
                style={styles.tabButton}
              >
                <ThemedText type="smallBold" style={{ color: activeTab === 'available' ? '#FCD116' : theme.textSecondary, paddingBottom: 4 }}>
                  Mercado ({availableJobsList.length})
                </ThemedText>
                {activeTab === 'available' && (
                  <LinearGradient
                    colors={['#CE1126', '#000000']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.tabUnderline}
                  />
                )}
              </Pressable>
              <Pressable
                onPress={() => setActiveTab('my_jobs')}
                style={styles.tabButton}
              >
                <ThemedText type="smallBold" style={{ color: activeTab === 'my_jobs' ? '#FCD116' : theme.textSecondary, paddingBottom: 4 }}>
                  Meus Serviços ({myJobsList.length})
                </ThemedText>
                {activeTab === 'my_jobs' && (
                  <LinearGradient
                    colors={['#CE1126', '#000000']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.tabUnderline}
                  />
                )}
              </Pressable>
            </>
          )}

          {/* Citizen Tabs: Available for Everyone */}
          <Pressable
            onPress={() => setActiveTab('my')}
            style={styles.tabButton}
          >
            <ThemedText type="smallBold" style={{ color: activeTab === 'my' ? '#FCD116' : theme.textSecondary, paddingBottom: 4 }}>
              Minhas Ocorrências ({myReportsList.length})
            </ThemedText>
            {activeTab === 'my' && (
              <LinearGradient
                colors={['#CE1126', '#000000']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.tabUnderline}
              />
            )}
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('followed')}
            style={styles.tabButton}
          >
            <ThemedText type="smallBold" style={{ color: activeTab === 'followed' ? '#FCD116' : theme.textSecondary, paddingBottom: 4 }}>
              Seguidas ({followedReportsList.length})
            </ThemedText>
            {activeTab === 'followed' && (
              <LinearGradient
                colors={['#CE1126', '#000000']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.tabUnderline}
              />
            )}
          </Pressable>
        </ScrollView>
      </View>

      {/* List content */}
      <FlatList
        data={
          activeTab === 'my' ? myReportsList :
          activeTab === 'followed' ? followedReportsList :
          activeTab === 'available' ? availableJobsList :
          activeTab === 'my_jobs' ? myJobsList :
          validationJobsList
        }
        keyExtractor={(item: any) => item._id || item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={48} color={theme.textSecondary} />
            <ThemedText themeColor="textSecondary">Não existem itens nesta categoria.</ThemedText>
          </View>
        }
        renderItem={({ item }: { item: any }) => {
          const isJob = activeTab === 'available' || activeTab === 'my_jobs' || activeTab === 'validation';
          const report = isJob ? item.report : item;

          if (!report) return null;

          const CardComponent = (
            <ThemedView type="backgroundElement" style={styles.card}>
              <Image source={{ uri: isJob && item.status === 'Concluído' ? (item.afterImage || report.image) : (report.images?.[0] || report.image) }} style={styles.cardImage} />
              
              <View style={styles.cardInfo}>
                <View style={styles.cardHeader}>
                  <View style={styles.categoryWrapper}>
                    <Ionicons name={(CATEGORY_ICONS[report.category ? report.category.split(',')[0].trim() : ''] || 'alert') as any} size={14} color="#FCD116" />
                    <ThemedText type="code" style={styles.categoryText}>
                      {report.category}
                    </ThemedText>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(isJob ? item.status : report.status)}15` }]}>
                    <ThemedText type="code" style={[styles.statusText, { color: getStatusColor(isJob ? item.status : report.status) }]}>
                      {isJob ? item.status : report.status}
                    </ThemedText>
                  </View>
                </View>

                <ThemedText type="smallBold" style={styles.cardTitle} numberOfLines={1}>
                  {report.title}
                </ThemedText>

                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={12} color={theme.textSecondary} />
                  <ThemedText type="small" themeColor="textSecondary" style={styles.locationText} numberOfLines={1}>
                    {report.location}
                  </ThemedText>
                </View>

                <ThemedText type="code" themeColor="textSecondary" style={styles.dateText}>
                  Relatado por {report.reporterName || 'Cidadão'} • {formatDate(report.createdAt || report.date)}
                </ThemedText>

                {/* Operator Actions: Available Jobs */}
                {activeTab === 'available' && (
                  <Pressable
                    disabled={loadingActionId !== null}
                    onPress={() => handleAcceptJob(item._id)}
                    style={{ width: '100%', marginTop: 8 }}
                  >
                    <LinearGradient
                      colors={['#CE1126', '#000000']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.actionButton, { marginTop: 0 }]}
                    >
                      {loadingActionId === item._id ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle-outline" size={16} color="#FFF" />
                          <ThemedText style={styles.actionButtonText}>Aceitar Trabalho</ThemedText>
                        </>
                      )}
                    </LinearGradient>
                  </Pressable>
                )}

                {/* Operator Actions: Active Jobs */}
                {activeTab === 'my_jobs' && item.status === 'Aceito' && (
                  <Pressable
                    disabled={loadingActionId !== null}
                    onPress={() => handleCompleteJob(item._id)}
                    style={{ width: '100%', marginTop: 8 }}
                  >
                    <LinearGradient
                      colors={['#CE1126', '#000000']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.actionButton, { marginTop: 0 }]}
                    >
                      {loadingActionId === item._id ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <>
                          <Ionicons name="camera-outline" size={16} color="#FFF" />
                          <ThemedText style={styles.actionButtonText}>Concluir Limpeza (Evidência)</ThemedText>
                        </>
                      )}
                    </LinearGradient>
                  </Pressable>
                )}

                {/* Operator Actions: Completed Job awaiting validation */}
                {activeTab === 'my_jobs' && item.status === 'Concluído' && (
                  <View style={styles.waitingBanner}>
                    <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                    <ThemedText type="code" themeColor="textSecondary">Aguardando aprovação do supervisor</ThemedText>
                  </View>
                )}

                {/* Supervisor Actions: Validate Job */}
                {activeTab === 'validation' && (
                  <View style={styles.validationContainer}>
                    <ThemedText type="code" themeColor="textSecondary" style={{ marginBottom: 6 }}>
                      Comparação Antes vs Depois:
                    </ThemedText>
                    <View style={styles.compareRow}>
                      <View style={styles.compareBox}>
                        <Image source={{ uri: item.beforeImage || report.image }} style={styles.compareImage} />
                        <ThemedText type="code" style={styles.compareLabel}>Antes</ThemedText>
                      </View>
                      <View style={styles.compareBox}>
                        <Image source={{ uri: item.afterImage }} style={styles.compareImage} />
                        <ThemedText type="code" style={[styles.compareLabel, { color: '#34C759' }]}>Depois</ThemedText>
                      </View>
                    </View>

                    <View style={styles.validationButtons}>
                      <Pressable
                        disabled={loadingActionId !== null}
                        onPress={() => handleValidateJob(item._id, true)}
                        style={{ flex: 1 }}
                      >
                        <LinearGradient
                          colors={['#CE1126', '#000000']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={[styles.smallActionButton, { backgroundColor: 'transparent' }]}
                        >
                          <ThemedText style={styles.actionButtonText}>Aprovar</ThemedText>
                        </LinearGradient>
                      </Pressable>
                      <Pressable
                        disabled={loadingActionId !== null}
                        onPress={() => handleValidateJob(item._id, false)}
                        style={[styles.smallActionButton, { backgroundColor: '#FF3B30', flex: 1 }]}
                      >
                        <ThemedText style={styles.actionButtonText}>Rejeitar</ThemedText>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            </ThemedView>
          );

          if (isJob) {
            return CardComponent;
          }

          return (
            <Pressable onPress={() => handleOpenDetails(report)}>
              {CardComponent}
            </Pressable>
          );
        }}
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
                    <Image source={{ uri: selectedReport.user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' }} style={styles.modalAvatar} />
                    <View style={{ flex: 1 }}>
                      <ThemedText type="smallBold">{selectedReport.user?.name || 'Cidadão'}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {formatTimeAgo(selectedReport.createdAt)} • {selectedReport.municipality || selectedReport.location}
                      </ThemedText>
                    </View>
                    <View style={styles.reputationBadge}>
                      <Ionicons name="star" size={10} color="#FFD700" />
                      <ThemedText type="code" style={styles.reputationText}>{selectedReport.user?.reputation ?? 5}</ThemedText>
                    </View>
                  </Pressable>

                  {/* Category + Title */}
                  <View style={styles.modalTitleRow}>
                    <View style={[styles.categoryChipSmall, { backgroundColor: `${getStatusColor(selectedReport.status)}18` }]}>
                      <Ionicons name={(CATEGORY_ICONS[selectedReport.category] || 'alert') as any} size={12} color={getStatusColor(selectedReport.status)} />
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
                      <ThemedText style={styles.modalTitle}>{selectedReport.title}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary" style={styles.modalDescription}>
                        {selectedReport.description}
                      </ThemedText>
                      
                      {selectedReport.userId === currentUser?._id && (
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
                      <ThemedText style={[styles.sectionTabText, modalSection === 'details' && { color: '#FCD116' }]}>
                        Histórico
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => setModalSection('comments')}
                      style={[styles.sectionTab, modalSection === 'comments' && styles.sectionTabActive]}>
                      <ThemedText style={[styles.sectionTabText, modalSection === 'comments' && { color: '#FCD116' }]}>
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
                            <View key={log._id || i.toString()} style={styles.historyItem}>
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
                          <View key={comment._id} style={[styles.commentCard, { backgroundColor: theme.background }]}>
                            <Image source={{ uri: comment.user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' }} style={styles.commentAvatar} />
                            <View style={styles.commentContent}>
                              <View style={styles.commentHeader}>
                                <ThemedText type="smallBold">{comment.user?.name || 'Cidadão'}</ThemedText>
                                <ThemedText type="code" themeColor="textSecondary" style={{ fontSize: 9 }}>
                                  {formatTimeAgo(comment.createdAt)}
                                </ThemedText>
                              </View>
                              <ThemedText type="small" style={{ fontSize: 12 }}>{comment.content}</ThemedText>
                            </View>
                          </View>
                        ))
                      )}

                      {/* Comment Input */}
                      <View style={styles.commentInputContainer}>
                        <TextInput
                          style={[styles.commentInput, { color: theme.text, borderColor: theme.backgroundSelected, backgroundColor: theme.background }]}
                          value={commentText}
                          onChangeText={setCommentText}
                          placeholder="Escreva um comentário..."
                          placeholderTextColor={theme.textSecondary}
                          multiline
                        />
                        <Pressable
                          onPress={handlePostComment}
                          disabled={isPostingComment || !commentText.trim()}
                          style={[styles.sendCommentBtn, { opacity: commentText.trim() ? 1 : 0.5 }]}
                        >
                          {isPostingComment ? (
                            <ActivityIndicator size="small" color="#FFF" />
                          ) : (
                            <Ionicons name="send" size={16} color="#FFF" />
                          )}
                        </Pressable>
                      </View>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </ThemedView>
        </View>
      </Modal>

      {/* Edit Map Picker Modal */}
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
  header: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  metricsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
    marginVertical: Spacing.two,
  },
  metricBox: {
    flex: 1,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  tabBarWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
    marginVertical: Spacing.two,
  },
  tabBarScroll: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.three,
  },
  tabButton: {
    paddingVertical: Spacing.two,
    marginRight: Spacing.four,
    alignItems: 'center',
  },
  tabUnderline: {
    height: 3,
    width: '100%',
    borderRadius: 1.5,
    marginTop: 2,
  },
  listContainer: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.four,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.six,
    gap: Spacing.two,
  },
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: Spacing.two,
    paddingRight: Spacing.two,
  },
  cardImage: {
    width: 100,
    height: '100%',
    minHeight: 110,
  },
  cardInfo: {
    flex: 1,
    padding: Spacing.two,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryText: {
    fontWeight: 'bold',
    color: '#208AEF',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: 14,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    marginLeft: 2,
    fontSize: 11,
  },
  dateText: {
    fontSize: 9,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  waitingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(128,128,128,0.06)',
    padding: 6,
    borderRadius: 6,
    marginTop: 8,
    gap: 4,
  },
  validationContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.08)',
  },
  compareRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  compareBox: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  compareImage: {
    width: '100%',
    height: 70,
    borderRadius: 6,
  },
  compareLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 2,
  },
  validationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  smallActionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 6,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: Spacing.two,
    position: 'relative',
  },
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(128, 128, 128, 0.3)',
    alignSelf: 'center',
    marginBottom: Spacing.two,
  },
  closeBtn: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.three,
    zIndex: 10,
    padding: 6,
  },
  modalScroll: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
  },
  modalAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.two,
    gap: Spacing.two,
  },
  modalAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  reputationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  reputationText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  modalTitleRow: {
    flexDirection: 'row',
    marginBottom: Spacing.two,
  },
  categoryChipSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  categoryChipText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: Spacing.one,
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.three,
  },
  ownerActionsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
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
  modalLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.two,
  },
  stepperContainer: {
    padding: Spacing.two,
    borderRadius: 12,
    marginVertical: Spacing.two,
  },
  stepperLabel: {
    fontSize: 11,
    marginBottom: Spacing.two,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepLabel: {
    textAlign: 'center',
  },
  stepLine: {
    height: 2,
    flex: 1,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sectionTabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.1)',
    marginVertical: Spacing.two,
  },
  sectionTab: {
    paddingVertical: 10,
    marginRight: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  sectionTabActive: {
    borderBottomColor: '#FCD116',
  },
  sectionTabText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  historySection: {
    marginTop: Spacing.two,
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
  },
  historyItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timelineCol: {
    width: 20,
    alignItems: 'center',
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: 'rgba(128,128,128,0.15)',
    marginVertical: 4,
  },
  historyCard: {
    flex: 1,
    borderRadius: 10,
    padding: Spacing.two,
    marginLeft: 4,
  },
  historyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  commentsSection: {
    marginTop: Spacing.two,
    gap: 12,
  },
  commentCard: {
    flexDirection: 'row',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: 10,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.three,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.1)',
    gap: 8,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 80,
  },
  sendCommentBtn: {
    backgroundColor: '#CE1126',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editFormContainer: {
    marginBottom: Spacing.three,
    gap: Spacing.two,
  },
  editCategoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
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
