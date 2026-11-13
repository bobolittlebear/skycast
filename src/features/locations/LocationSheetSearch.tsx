import { useEffect, useRef, useState, type JSX } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Searchbar, Text, useTheme } from 'react-native-paper';
import { spacing, typography } from '../../theme/tokens';
import { LocationRow } from './LocationRow';
import type { Location } from '../../types/location';

export interface LocationSheetSearchProps {
  /** 搜索框初始值；仅作为挂载时的初值，后续输入不再回写 */
  query: string;
  /** 输入停顿后上报的查询词，由上层触发搜索 */
  onChangeQuery: (query: string) => void;
  /** 地理编码结果 */
  results: readonly Location[];
  /** 是否正在请求 */
  isLoading: boolean;
  /** 请求是否失败 */
  hasError: boolean;
  /** 查询词不足最小长度，展示输入提示 */
  showHint: boolean;
  /** 查询完成且没有结果 */
  showEmpty: boolean;
  /** 点击结果添加地点 */
  onAdd: (location: Location) => void;
}

/**
 * 输入停顿多久后上报给上层。这是整条链路唯一的防抖点，
 * useGeocodeSearch 收到查询词就立即请求。
 */
const INPUT_DEBOUNCE_MS = 250;

/**
 * 地点面板的搜索视图：自动聚焦的搜索框与结果列表。
 * 提示、加载、失败与空结果互斥展示；点击结果由上层决定添加或提示。
 *
 * 输入值保存在组件内部，停顿后才通过 onChangeQuery 上报：
 * 每次按键只重渲染搜索框本身，不会带着整个 Modal 一起重渲染，
 * 避免打断 iOS 中文输入法的拼音组合状态。
 */
export function LocationSheetSearch({
  query,
  onChangeQuery,
  results,
  isLoading,
  hasError,
  showHint,
  showEmpty,
  onAdd,
}: LocationSheetSearchProps): JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const [input, setInput] = useState(query);
  // 用 ref 持有最新回调，避免把 onChangeQuery 放进防抖 effect 的依赖里
  const onChangeQueryRef = useRef(onChangeQuery);

  useEffect(() => {
    onChangeQueryRef.current = onChangeQuery;
  }, [onChangeQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onChangeQueryRef.current(input);
    }, INPUT_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [input]);

  return (
    <>
      <Searchbar
        placeholder={t('location.searchPlaceholder')}
        value={input}
        onChangeText={setInput}
        autoFocus
        autoCorrect={false}
        autoCapitalize="none"
        spellCheck={false}
        elevation={0}
        iconColor={theme.colors.onSurfaceVariant}
        inputStyle={{ color: theme.colors.onSurface }}
        style={[
          styles.searchbar,
          { backgroundColor: theme.colors.surfaceVariant },
        ]}
        accessibilityLabel={t('location.searchPlaceholder')}
      />

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {showHint && (
          <Text
            variant="bodyMedium"
            style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}
          >
            {t('location.searchHint')}
          </Text>
        )}

        {isLoading && (
          <ActivityIndicator
            color={theme.colors.primary}
            style={styles.loading}
          />
        )}

        {hasError && (
          <Text
            variant="bodyMedium"
            style={[styles.hint, { color: theme.colors.error }]}
          >
            {t('location.searchFailed')}
          </Text>
        )}

        {showEmpty && (
          <Text
            variant="bodyMedium"
            style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}
          >
            {t('location.searchEmpty')}
          </Text>
        )}

        {results.map((location) => (
          <LocationRow
            key={location.id}
            location={location}
            selected={false}
            onPress={() => onAdd(location)}
            trailing={
              <View style={styles.addIcon}>
                <MaterialCommunityIcons
                  name="plus"
                  size={typography.fontSize.lg}
                  color={theme.colors.primary}
                />
              </View>
            }
          />
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  searchbar: {
    marginTop: spacing.sm,
  },
  body: {
    flexShrink: 1,
  },
  content: {
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  hint: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  loading: {
    marginVertical: spacing.md,
  },
  addIcon: {
    width: 32,
    alignItems: 'center',
  },
});
