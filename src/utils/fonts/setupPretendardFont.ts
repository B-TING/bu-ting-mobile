import type { ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
} from 'react-native';

import { PRETENDARD, PRETENDARD_DEFAULT } from '../../constants/fonts/pretendard';

const WEIGHT_TO_FAMILY: Record<string, string> = {
  '100': PRETENDARD.regular,
  '200': PRETENDARD.regular,
  '300': PRETENDARD.regular,
  '400': PRETENDARD.regular,
  normal: PRETENDARD.regular,
  '500': PRETENDARD.medium,
  '600': PRETENDARD.semibold,
  '700': PRETENDARD.bold,
  bold: PRETENDARD.bold,
  '800': PRETENDARD.extrabold,
  '900': PRETENDARD.black,
};

function resolvePretendardFamily(style: TextStyle | undefined): string {
  if (!style) {
    return PRETENDARD_DEFAULT;
  }

  if (typeof style.fontFamily === 'string' && style.fontFamily.startsWith('Pretendard')) {
    return style.fontFamily;
  }

  const weight = style.fontWeight ?? '400';
  return WEIGHT_TO_FAMILY[String(weight)] ?? PRETENDARD_DEFAULT;
}

function withPretendardStyle<T extends TextStyle>(style: StyleProp<T> | undefined): StyleProp<T> {
  const flat = StyleSheet.flatten(style);
  if (!flat) {
    return { fontFamily: PRETENDARD_DEFAULT } as StyleProp<T>;
  }

  if (typeof flat.fontFamily === 'string' && flat.fontFamily.startsWith('Pretendard')) {
    return style;
  }

  const fontFamily = resolvePretendardFamily(flat);
  return [{ fontFamily, fontWeight: 'normal' }, style] as StyleProp<T>;
}

type RenderableComponent = {
  render?: (props: TextProps, ref: unknown) => ReactNode;
};

function patchTextComponent(Component: typeof Text | typeof TextInput): void {
  const candidate = Component as typeof Component & RenderableComponent;
  if (typeof candidate.render !== 'function') {
    return;
  }

  const originalRender = candidate.render;
  candidate.render = function patchedRender(
    props: TextProps | TextInputProps,
    ref: React.Ref<unknown>,
  ) {
    return originalRender.call(this, { ...props, style: withPretendardStyle(props.style) }, ref);
  };
}

/** 앱 전역 Text / TextInput 기본 폰트를 Pretendard로 설정합니다. */
export function setupPretendardFont(): void {
  patchTextComponent(Text);
  patchTextComponent(TextInput);

  const text = Text as typeof Text & { defaultProps?: Partial<TextProps> };
  text.defaultProps = text.defaultProps ?? {};
  text.defaultProps.style = withPretendardStyle(text.defaultProps.style);

  const textInput = TextInput as typeof TextInput & { defaultProps?: Partial<TextInputProps> };
  textInput.defaultProps = textInput.defaultProps ?? {};
  textInput.defaultProps.style = withPretendardStyle(textInput.defaultProps.style);
}
