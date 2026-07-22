import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react';
import { type View } from 'react-native';

import type { GuideRect } from './guideTypes';

type GuideTargetContextValue = {
  registerTarget: (id: string, node: View | null) => void;
  unregisterTarget: (id: string) => void;
  /** 루트 컨테이너 기준 상대 좌표로 측정 */
  measureTarget: (id: string) => Promise<GuideRect | null>;
  rootRef: RefObject<View | null>;
};

const GuideTargetContext = createContext<GuideTargetContextValue | null>(null);

function measureInWindow(node: View): Promise<GuideRect | null> {
  return new Promise(resolve => {
    if (typeof node.measureInWindow !== 'function') {
      resolve(null);
      return;
    }
    node.measureInWindow((x, y, width, height) => {
      if (width <= 0 || height <= 0) {
        resolve(null);
        return;
      }
      resolve({ x, y, width, height });
    });
  });
}

export function GuideTargetProvider({ children }: { children: ReactNode }) {
  const nodesRef = useRef<Map<string, View>>(new Map());
  const rootRef = useRef<View | null>(null);

  const registerTarget = useCallback((id: string, node: View | null) => {
    if (node) {
      nodesRef.current.set(id, node);
    } else {
      nodesRef.current.delete(id);
    }
  }, []);

  const unregisterTarget = useCallback((id: string) => {
    nodesRef.current.delete(id);
  }, []);

  const measureTarget = useCallback(async (id: string): Promise<GuideRect | null> => {
    const node = nodesRef.current.get(id);
    if (!node) {
      return null;
    }

    const target = await measureInWindow(node);
    if (!target) {
      return null;
    }

    const root = rootRef.current;
    if (!root) {
      return target;
    }

    const rootRect = await measureInWindow(root);
    if (!rootRect) {
      return target;
    }

    return {
      x: target.x - rootRect.x,
      y: target.y - rootRect.y,
      width: target.width,
      height: target.height,
    };
  }, []);

  const value = useMemo(
    () => ({ registerTarget, unregisterTarget, measureTarget, rootRef }),
    [registerTarget, unregisterTarget, measureTarget],
  );

  return (
    <GuideTargetContext.Provider value={value}>{children}</GuideTargetContext.Provider>
  );
}

export function useGuideTargets(): GuideTargetContextValue {
  const ctx = useContext(GuideTargetContext);
  if (!ctx) {
    throw new Error('useGuideTargets must be used within GuideTargetProvider');
  }
  return ctx;
}

export function useGuideTargetsOptional(): GuideTargetContextValue | null {
  return useContext(GuideTargetContext);
}
