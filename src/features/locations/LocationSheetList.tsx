import type { JSX } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Button, Text, useTheme } from 'react-native-paper';
import {
  borderRadius,
  MIN_TOUCH_TARGET,
  spacing,
  typography,
} from '../../theme/tokens';
import { LOCATION_ROW_MIN_HEIGHT, LocationRow } from './LocationRow';
import type { DeviceLocationStatus } from './useDeviceLocation';
import type { Location } from '../../types/location';

/** Web 没有系统设置入口，只有原生端显示跳转按钮 */
const CAN_OPEN_SETTINGS = Platform.select({ web: false, default: true }) ?? false;

export interface LocationSheetListProps {
  /** 含 GPS 项的完整地点列表 */
  locations: readonly Location[];
  /** 当前选中地点 id */
  activeId: string | null;
  /** 设备定位状态，决定「使用当前位置」行的展示 */
  deviceStatus: DeviceLocationStatus;
  /** 申请定位；定位中会禁用该行 */
  onUseCurrent: () => void;
  /** 选中地点并关闭面板 */
  onSelect: (id: string) => void;
  /** 删除用户地点 */
  onRemove: (id: string) => void;
  /** 切换到搜索视图 */
  onAdd: () => void;
  /** 展示定位设置跳转失败的提示 */
  onMessage: (message: string) => void;
}

/**
 * 地点面板的列表视图：定位入口、权限提示、已保存地点与添加按钮。
 * GPS 项永远位于首位且没有删除按钮；删除用户地点立即生效，不弹二次确认。
 */
export function LocationSheetList({
  locations,
  activeId,
  deviceStatus,
  onUseCurrent,
  onSelect,
  onRemove,
  onAdd,
  onMessage,
}: LocationSheetListProps): JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const isLocating = deviceStatus === 'requesting';

  async function handleOpenSettings(): Promise<void> {
    try {
      const canOpen = await Linking.canOpenURL('app-settings:');
      if (!canOpen) {
        onMessage(t('location.permissionUnavailable'));
        return;
      }
      await Linking.openSettings();
    } catch {
      // 跳转失败不阻塞面板，用 Snackbar 明确告知
      onMessage(t('location.permissionUnavailable'));
    }
  }

  return (
    <>
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('location.useCurrent')}
          accessibilityState={{ busy: isLocating, disabled: isLocating }}
          disabled={isLocating}
          onPress={onUseCurrent}
          style={({ pressed }) => [
            styles.currentRow,
            pressed && { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          <MaterialCommunityIcons
            name="crosshairs-gps"
            size={typography.fontSize.xl}
            color={theme.colors.primary}
          />
          <View style={styles.currentText}>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
              {t('location.useCurrent')}
            </Text>
            {isLocating && (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('location.locating')}
              </Text>
            )}
          </View>
          {isLocating && (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          )}
        </Pressable>

        {deviceStatus === 'denied' && (
          <View style={styles.denied}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('location.permissionDenied')}
            </Text>
            {CAN_OPEN_SETTINGS && (
              <Button
                mode="text"
                onPress={() => void handleOpenSettings()}
                accessibilityLabel={t('location.openSettings')}
                style={styles.settingsButton}
              >
                {t('location.openSettings')}
              </Button>
            )}
          </View>
        )}

        {locations.map((location) => (
          <LocationRow
            key={location.id}
            location={location}
            selected={location.id === activeId}
            onPress={() => onSelect(location.id)}
            onRemove={location.source === 'gps' ? undefined : () => onRemove(location.id)}
          />
        ))}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('location.addLocation')}
        onPress={onAdd}
        style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons
          name="plus"
          size={typography.fontSize.lg}
          color={theme.colors.primary}
        />
        <Text variant="labelLarge" style={{ color: theme.colors.primary }}>
          {t('location.addLocation')}
        </Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  body: {
    flexShrink: 1,
    marginTop: spacing.sm,
  },
  content: {
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  currentRow: {
    minHeight: LOCATION_ROW_MIN_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  currentText: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  denied: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.xs,
  },
  settingsButton: {
    alignSelf: 'flex-start',
    minHeight: MIN_TOUCH_TARGET,
  },
  addButton: {
    minHeight: spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
  },
  pressed: {
    opacity: 0.6,
  },
});
