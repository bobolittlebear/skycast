import { useEffect, useState } from "react";
import { Keyboard, Platform, type KeyboardEvent } from "react-native";

/**
 * 当前软键盘高度，单位 px；键盘收起时为 0。
 * iOS 使用 willShow / willHide，动画一开始就能拿到高度，面板可以跟手位移；
 * Android 的 will 系列触发时机不可靠，改用 didShow / didHide。
 * 只在页面级容器里使用，列表项里调用会重复订阅同一组事件。
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = (event: KeyboardEvent) => {
      // 事件给的是浮点高度，取整后用于布局，避免亚像素抖动
      setHeight(Math.round(event.endCoordinates.height));
    };
    const onHide = () => {
      setHeight(0);
    };

    const showSubscription = Keyboard.addListener(showEvent, onShow);
    const hideSubscription = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return height;
}
