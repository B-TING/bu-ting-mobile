import Svg, { Path } from 'react-native-svg';

type Props = {
  size?: number;
  color?: string;
};

/** 카카오 로그인 공식 말풍선 심볼 (18×18 viewBox) */
export function KakaoSymbolIcon({ size = 18, color = '#000000' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path
        fill={color}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 1C4.58 1 1 3.99 1 7.54c0 2.21 1.48 4.15 3.69 5.28L3.5 15.5c-.08.3.25.54.51.36l3.38-2.25c.52.07 1.05.11 1.61.11 4.42 0 8-2.99 8-6.54S13.42 1 9 1z"
      />
    </Svg>
  );
}
