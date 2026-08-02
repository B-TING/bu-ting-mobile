import { useEffect, useRef, type ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

import { useGuideTargetsOptional } from './GuideTargetContext';

type GuideTargetProps = ViewProps & {
  id: string;
  children: ReactNode;
};

/** 가이드 하이라이트용 타깃 — 레지스트리에 ref 등록 */
export function GuideTarget({ id, children, ...rest }: GuideTargetProps) {
  const registry = useGuideTargetsOptional();
  const ref = useRef<View>(null);

  useEffect(() => {
    if (!registry) {
      return;
    }
    registry.registerTarget(id, ref.current);
    return () => registry.unregisterTarget(id);
  }, [id, registry]);

  return (
    <View
      ref={ref}
      collapsable={false}
      onLayout={() => {
        if (registry && ref.current) {
          registry.registerTarget(id, ref.current);
        }
      }}
      {...rest}>
      {children}
    </View>
  );
}
