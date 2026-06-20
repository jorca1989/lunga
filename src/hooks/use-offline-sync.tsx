import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import * as Network from 'expo-network';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { getOfflineReports, removeOfflineReport } from '../utils/offline-storage';

interface OfflineSyncContextType {
  isOffline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  triggerSync: () => Promise<void>;
  checkPendingCount: () => Promise<number>;
}

const OfflineSyncContext = createContext<OfflineSyncContextType | undefined>(undefined);

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const createReport = useMutation(api.reports.create);

  const checkPendingCount = useCallback(async () => {
    try {
      const reports = await getOfflineReports();
      setPendingCount(reports.length);
      return reports.length;
    } catch (e) {
      return 0;
    }
  }, []);

  const syncReports = useCallback(async () => {
    const reports = await getOfflineReports();
    if (reports.length === 0) {
      setIsSyncing(false);
      return;
    }

    // Double check network state
    const netState = await Network.getNetworkStateAsync();
    const online = !!netState.isConnected && netState.isInternetReachable !== false;
    if (!online) {
      console.log('Skipping sync: netState indicates offline');
      return;
    }

    setIsSyncing(true);
    console.log(`Starting synchronization of ${reports.length} offline report(s)...`);

    let successCount = 0;
    let failCount = 0;

    for (const report of reports) {
      try {
        await createReport({
          tenantId: report.tenantId,
          userId: report.userId,
          category: report.category,
          title: report.title,
          description: report.description,
          image: report.image,
          location: report.location,
          latitude: report.latitude,
          longitude: report.longitude,
        });

        await removeOfflineReport(report.tempId);
        successCount++;
      } catch (err) {
        console.error(`Failed to sync report ${report.tempId}:`, err);
        failCount++;
      }
    }

    await checkPendingCount();
    setIsSyncing(false);

    if (successCount > 0) {
      Alert.alert(
        'Sincronização Concluída',
        `Enviou com sucesso ${successCount} ocorrência(s) que estavam guardadas offline.${
          failCount > 0 ? ` (${failCount} falharam e serão reenviadas mais tarde)` : ''
        }`
      );
    }
  }, [createReport, checkPendingCount]);

  useEffect(() => {
    let isMounted = true;
    let subscription: { remove: () => void } | null = null;

    const setupNetworkListener = async () => {
      try {
        // Initial check
        const initialState = await Network.getNetworkStateAsync();
        const initialOnline = !!initialState.isConnected && initialState.isInternetReachable !== false;

        if (isMounted) {
          setIsOffline(!initialOnline);
          await checkPendingCount();
          if (initialOnline) {
            // Run initial sync on startup
            syncReports();
          }
        }

        // Subscribe to changes
        subscription = Network.addNetworkStateListener(async (state) => {
          const online = !!state.isConnected && state.isInternetReachable !== false;
          if (isMounted) {
            setIsOffline(!online);
            await checkPendingCount();
            if (online) {
              // Network became available, sync
              syncReports();
            }
          }
        });
      } catch (error) {
        console.error('Error setting up network listener:', error);
      }
    };

    setupNetworkListener();

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.remove();
      }
    };
  }, [checkPendingCount, syncReports]);

  return (
    <OfflineSyncContext.Provider
      value={{
        isOffline,
        isSyncing,
        pendingCount,
        triggerSync: syncReports,
        checkPendingCount,
      }}
    >
      {children}
    </OfflineSyncContext.Provider>
  );
}

export function useOfflineSync() {
  const context = useContext(OfflineSyncContext);
  if (context === undefined) {
    throw new Error('useOfflineSync must be used within an OfflineSyncProvider');
  }
  return context;
}
