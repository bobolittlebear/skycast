import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocations } from './LocationsContext';
import { useDeviceLocation, type DeviceLocationStatus } from './useDeviceLocation';
import { GEOCODE_MIN_QUERY_LENGTH, useGeocodeSearch } from './useGeocodeSearch';
import type { Location } from '../../types/location';

export type LocationSheetView = 'list' | 'search';

export interface UseLocationSheetResult {
  /** 当前展示的视图：列表或搜索 */
  view: LocationSheetView;
  /** 搜索框输入值 */
  query: string;
  /** 当前需要展示的 Snackbar 文案；null 表示隐藏 */
  message: string | null;
  /** 含 GPS 项的完整地点列表 */
  locations: readonly Location[];
  /** 当前选中地点 id 与设备定位状态 */
  activeId: string | null;
  deviceStatus: DeviceLocationStatus;
  /** 搜索结果与对应的展示状态 */
  results: readonly Location[];
  isSearching: boolean;
  hasSearchError: boolean;
  showSearchHint: boolean;
  showSearchEmpty: boolean;
  // 视图与提示
  openSearch: () => void;
  backToList: () => void;
  dismiss: () => void;
  clearMessage: () => void;
  showMessage: (message: string) => void;
  setQuery: (query: string) => void;
  /** 申请权限并定位；成功后切换为 GPS 地点并关闭面板 */
  useCurrent: () => void;
  // 地点操作
  selectLocation: (id: string) => void;
  removeLocation: (id: string) => void;
  addResult: (location: Location) => void;
}

/**
 * 地点面板的状态与副作用：视图切换、搜索、定位、增删选与提示文案。
 * 定位结果写入 Context 后才出现在 locations 中，因此选中 GPS 项分两步完成。
 * 面板关闭时复位搜索词与之相关的提示，避免下次打开看到旧状态。
 */
export function useLocationSheet(
  onDismiss: () => void
): UseLocationSheetResult {
  const { t } = useTranslation();
  const { locations, activeId, addLocation, removeLocation, setActiveId, updateGps } =
    useLocations();
  const { status: deviceStatus, coords, error: deviceError, request } =
    useDeviceLocation();
  const [view, setView] = useState<LocationSheetView>('list');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const { results, isLoading, error: searchError, debouncedQuery } =
    useGeocodeSearch(query);
  const pendingRequest = useRef(false);
  const pendingGpsSelect = useRef(false);

  const dismiss = useCallback(() => {
    pendingRequest.current = false;
    pendingGpsSelect.current = false;
    setView('list');
    setQuery('');
    setMessage(null);
    onDismiss();
  }, [onDismiss]);

  // 定位结果要等 Context 写入 locations 后才能选中；两步都用 ref 标记，
  // 定时器回调里才更新状态，避免 effect 体内同步 setState。
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (pendingRequest.current) {
      if (deviceStatus === 'granted' && coords !== null) {
        const next = coords;
        timer = setTimeout(() => {
          // 面板可能已关闭，关闭后不再写回坐标
          if (!pendingRequest.current) {
            return;
          }
          pendingRequest.current = false;
          updateGps(next.lat, next.lon);
          pendingGpsSelect.current = true;
        }, 0);
      } else if (deviceStatus === 'denied') {
        pendingRequest.current = false;
      } else if (deviceStatus === 'unavailable' && deviceError !== null) {
        const error = deviceError;
        timer = setTimeout(() => {
          if (!pendingRequest.current) {
            return;
          }
          pendingRequest.current = false;
          setMessage(
            error.code === 'timeout'
              ? t('location.gpsFailed')
              : t('location.permissionUnavailable')
          );
        }, 0);
      }
    } else if (pendingGpsSelect.current) {
      const gps = locations.find((item) => item.source === 'gps');
      if (gps !== undefined) {
        timer = setTimeout(() => {
          if (!pendingGpsSelect.current) {
            return;
          }
          pendingGpsSelect.current = false;
          setActiveId(gps.id);
          dismiss();
        }, 0);
      }
    }

    return () => {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
    };
  }, [coords, deviceError, deviceStatus, dismiss, locations, setActiveId, t, updateGps]);

  function openSearch(): void {
    setQuery('');
    setMessage(null);
    setView('search');
  }

  function backToList(): void {
    setQuery('');
    setMessage(null);
    setView('list');
  }

  function useCurrent(): void {
    setMessage(null);
    pendingRequest.current = true;
    void request();
  }

  function selectLocation(id: string): void {
    setActiveId(id);
    dismiss();
  }

  function addResult(location: Location): void {
    const result = addLocation(location);
    if (result === 'added') {
      dismiss();
      return;
    }

    setMessage(
      result === 'exists'
        ? t('location.alreadyAdded')
        : t('location.limitReached')
    );
  }

  const showSearchHint = debouncedQuery.length < GEOCODE_MIN_QUERY_LENGTH;
  const showSearchEmpty =
    !showSearchHint && !isLoading && searchError === null && results.length === 0;

  return {
    view,
    query,
    message,
    locations,
    activeId,
    deviceStatus,
    results,
    isSearching: isLoading,
    hasSearchError: searchError !== null,
    showSearchHint,
    showSearchEmpty,
    openSearch,
    backToList,
    dismiss,
    clearMessage: () => setMessage(null),
    showMessage: setMessage,
    setQuery,
    useCurrent,
    selectLocation,
    removeLocation,
    addResult,
  };
}
