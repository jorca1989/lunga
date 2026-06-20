import AsyncStorage from '@react-native-async-storage/async-storage';

export interface OfflineReport {
  tempId: string;
  tenantId: string;
  userId: string;
  category: string;
  title: string;
  description: string;
  image: string; // base64 string
  images?: string[];
  videos?: string[];
  location: string;
  latitude: number;
  longitude: number;
  createdAt: number;
}

const OFFLINE_REPORTS_KEY = '@offline_reports_queue';

/**
 * Saves a report parameters to the local AsyncStorage queue.
 */
export async function saveReportOffline(
  report: Omit<OfflineReport, 'tempId' | 'createdAt'>
): Promise<OfflineReport> {
  const newReport: OfflineReport = {
    ...report,
    tempId: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    createdAt: Date.now(),
  };

  try {
    const existingStr = await AsyncStorage.getItem(OFFLINE_REPORTS_KEY);
    const existing: OfflineReport[] = existingStr ? JSON.parse(existingStr) : [];
    existing.push(newReport);
    await AsyncStorage.setItem(OFFLINE_REPORTS_KEY, JSON.stringify(existing));
    console.log('Saved offline report locally:', newReport.tempId);
    return newReport;
  } catch (error) {
    console.error('Failed to save offline report:', error);
    throw error;
  }
}

/**
 * Gets all offline reports stored in AsyncStorage.
 */
export async function getOfflineReports(): Promise<OfflineReport[]> {
  try {
    const existingStr = await AsyncStorage.getItem(OFFLINE_REPORTS_KEY);
    return existingStr ? JSON.parse(existingStr) : [];
  } catch (error) {
    console.error('Failed to get offline reports:', error);
    return [];
  }
}

/**
 * Removes a single report from the local AsyncStorage queue by its temporary ID.
 */
export async function removeOfflineReport(tempId: string): Promise<void> {
  try {
    const existingStr = await AsyncStorage.getItem(OFFLINE_REPORTS_KEY);
    if (!existingStr) return;
    const existing: OfflineReport[] = JSON.parse(existingStr);
    const filtered = existing.filter((r) => r.tempId !== tempId);
    await AsyncStorage.setItem(OFFLINE_REPORTS_KEY, JSON.stringify(filtered));
    console.log('Removed offline report from local queue:', tempId);
  } catch (error) {
    console.error('Failed to remove offline report:', error);
    throw error;
  }
}

/**
 * Clears the offline reports queue.
 */
export async function clearOfflineQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(OFFLINE_REPORTS_KEY);
    console.log('Cleared all offline reports from local queue.');
  } catch (error) {
    console.error('Failed to clear offline queue:', error);
    throw error;
  }
}
