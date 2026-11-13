import type { JSX, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, useTheme } from 'react-native-paper';
import {
  borderRadius,
  MIN_TOUCH_TARGET,
  spacing,
  typography,
} from '../../theme/tokens';
import { getLocalizedText } from '../../lib/location';
import { useSettings } from '../settings/SettingsContext';
import type { Location } from '../../types/location';

/** 地点行最小高度：容纳两行文本并满足触控面积 */
export const LOCATION_ROW_MIN_HEIGHT = 52;

export interface LocationRowProps {
  /** 要展示的地点；GPS 项名称为空时兜底为「当前位置」 */
  location: Location;
  /** 是否为当前选中地点，选中时显示勾选图标 */
  selected: boolean;
  /** 点击整行；列表用于切换地点，搜索用于添加 */
  onPress: () => void;
  /** 提供时显示右侧删除按钮；GPS 项不传 */
  onRemove?: () => void;
  /** 额外的右侧内容，例如搜索结果的加号 */
  trailing?: ReactNode;
}

/** 副标题只拼接实际存在的行政区与国家，避免出现多余分隔符 */
function getLocationSubtitle(
  admin1: string | undefined,
  country: string | undefined
): string {
  return [admin1, country]
    .filter((part): part is string => part !== undefined && part !== '')
    .join(' · ');
}

/**
 * 地点列表与搜索结果共用的一行：图标、名称、副标题与右侧操作。
 * 删除按钮独立于整行 Pressable，避免删除时误触选中。
 */
export function LocationRow({
  location,
  selected,
  onPress,
  onRemove,
  trailing,
}: LocationRowProps): JSX.Element {
  const { t } = useTranslation();
  const { lang } = useSettings();
  const theme = useTheme();
  const text = getLocalizedText(location, lang);
  // GPS 反查失败时名称为空，统一兜底为「当前位置」
  const name =
    text.name === undefined || text.name === ''
      ? t('location.current')
      : text.name;
  const subtitle = getLocationSubtitle(text.admin1, text.country);

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={name}
        accessibilityState={{ selected }}
        onPress={onPress}
        style={({ pressed }) => [
          styles.main,
          pressed && { backgroundColor: theme.colors.surfaceVariant },
        ]}
      >
        <MaterialCommunityIcons
          name={location.source === 'gps' ? 'crosshairs-gps' : 'map-marker-outline'}
          size={typography.fontSize.xl}
          color={theme.colors.onSurfaceVariant}
        />
        <View style={styles.text}>
          <Text
            variant="bodyLarge"
            numberOfLines={1}
            style={{ color: theme.colors.onSurface }}
          >
            {name}
          </Text>
          {subtitle !== '' && (
            <Text
              variant="bodySmall"
              numberOfLines={1}
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {subtitle}
            </Text>
          )}
        </View>
        {selected && (
          <MaterialCommunityIcons
            name="check"
            size={typography.fontSize.xl}
            color={theme.colors.primary}
          />
        )}
        {trailing}
      </Pressable>

      {onRemove !== undefined && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t('location.remove')} ${name}`}
          onPress={onRemove}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={typography.fontSize.lg}
            color={theme.colors.onSurfaceVariant}
          />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  main: {
    flex: 1,
    minHeight: LOCATION_ROW_MIN_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  text: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  action: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
