import type { JSX } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'react-native-paper';
import { borderRadius, MIN_TOUCH_TARGET, spacing } from '../../theme/tokens';
import type { Location } from '../../types/location';

/** 圆点视觉尺寸；触控区由外层 Pressable 统一放大到 44 */
const DOT_SIZE = 8;
/** GPS 图标尺寸，比圆点略大以便辨认 */
const GPS_ICON_SIZE = 14;
/** 圆点之间的间距 */
const DOT_GAP = 6;
/** 满足最小触控面积的不可见热区 */
const DOT_TOUCH_SIZE = MIN_TOUCH_TARGET;

export interface LocationDotsProps {
  /** 含 GPS 项的完整地点列表 */
  locations: readonly Location[];
  /** 当前选中地点 id；未选中时为 null */
  activeId: string | null;
  /** 点击圆点时切换选中的地点 */
  onSelect: (id: string) => void;
}

/**
 * 主页底部地点圆点导航：每个地点一个圆点，GPS 项使用定位图标。
 * 横向滚动且最大宽度为屏宽一半，避免与左右两个悬浮按钮重叠。
 */
export function LocationDots({
  locations,
  activeId,
  onSelect,
}: LocationDotsProps): JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      {locations.map((location) => {
        const selected = location.id === activeId;
        const label =
          location.name === '' ? t('location.current') : location.name;

        return (
          <Pressable
            key={location.id}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected }}
            onPress={() => onSelect(location.id)}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
          >
            {location.source === 'gps' ? (
              <MaterialCommunityIcons
                name="crosshairs-gps"
                size={GPS_ICON_SIZE}
                color={theme.colors.onBackground}
                style={selected ? undefined : styles.inactive}
              />
            ) : (
              <View
                style={[
                  styles.dot,
                  { backgroundColor: theme.colors.onBackground },
                  selected ? undefined : styles.inactive,
                ]}
              />
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    maxWidth: '50%',
    alignSelf: 'center',
  },
  content: {
    alignItems: 'center',
    gap: DOT_GAP,
    paddingHorizontal: spacing.xs,
  },
  item: {
    width: DOT_TOUCH_SIZE,
    height: DOT_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: borderRadius.full,
  },
  inactive: {
    opacity: 0.3,
  },
});
