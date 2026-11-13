import type { JSX } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "react-native-paper";
import {
  BOTTOM_CONTROL_HEIGHT,
  borderRadius,
  glass,
  spacing,
} from "../../theme/tokens";
import { getLocalizedText } from "../../lib/location";
import { useSettings } from "../../features/settings/SettingsContext";
import type { Location } from "../../types/location";

/** 单个圆点的视觉尺寸；整条底栏共用一块玻璃胶囊背景 */
const DOT_SIZE = 8;
/** GPS 图标尺寸，比圆点略大以便辨认 */
const GPS_ICON_SIZE = 12;
/** 单个地点的触控区；这是底部导航的次要控件，按设计约定取 24 而非 44 */
const DOT_TOUCH_SIZE = 24;

export interface LocationDotsProps {
  /** 含 GPS 项的完整地点列表 */
  locations: readonly Location[];
  /** 当前选中地点 id；未选中时为 null */
  activeId: string | null;
  /** 点击圆点时切换选中的地点 */
  onSelect: (id: string) => void;
}

/**
 * 主页底部地点圆点导航：整条底栏是一块与悬浮按钮同配色的玻璃胶囊，
 * 内部每个地点一个圆点，GPS 项使用定位图标。最大宽度为屏宽一半，
 * 地点过多时在胶囊内部横向滚动，避免与左右两个悬浮按钮重叠。
 */
export function LocationDots({
  locations,
  activeId,
  onSelect,
}: LocationDotsProps): JSX.Element {
  const { t } = useTranslation();
  const { lang } = useSettings();
  const theme = useTheme();
  // 与悬浮按钮共用玻璃配色，保证底部控件观感一致
  const palette = theme.dark ? glass.dark : glass.light;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[
        styles.scroll,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
        },
      ]}
      contentContainerStyle={styles.content}
    >
      {locations.map((location) => {
        const selected = location.id === activeId;
        const text = getLocalizedText(location, lang);
        const label =
          text.name === undefined || text.name === ""
            ? t("location.current")
            : text.name;

        return (
          <Pressable
            key={location.id}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected }}
            onPress={() => onSelect(location.id)}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
          >
            {location.source === "gps" ? (
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
    maxWidth: "50%",
    height: BOTTOM_CONTROL_HEIGHT,
    alignSelf: "center",
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  content: {
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  item: {
    width: DOT_TOUCH_SIZE,
    height: DOT_TOUCH_SIZE,
    alignItems: "center",
    justifyContent: "center",
    // 触控盒之间再收紧一点，圆点视觉间距才够紧凑
    marginHorizontal: -spacing.xxs,
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
    opacity: 0.4,
  },
});
