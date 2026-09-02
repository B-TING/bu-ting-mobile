import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';

type RenderHookResult<T, Props> = {
  result: { current: T };
  rerender: (nextProps?: Props) => void;
  unmount: () => void;
};

/**
 * Minimal `renderHook` for RN Jest (no @testing-library/react-native).
 */
export function renderHook<T, Props = undefined>(
  callback: Props extends undefined ? () => T : (props: Props) => T,
  options?: Props extends undefined ? undefined : { initialProps: Props },
): RenderHookResult<T, Props> {
  const result: { current: T } = { current: undefined as T };
  let props = (options as { initialProps?: Props } | undefined)?.initialProps as Props;

  function TestComponent({ hookProps }: { hookProps: Props }) {
    result.current =
      props === undefined
        ? (callback as () => T)()
        : (callback as (p: Props) => T)(hookProps);
    return null;
  }

  let root: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    root = ReactTestRenderer.create(<TestComponent hookProps={props} />);
  });

  return {
    result,
    rerender: (nextProps?: Props) => {
      if (nextProps !== undefined) {
        props = nextProps;
      }
      act(() => {
        root.update(<TestComponent hookProps={props} />);
      });
    },
    unmount: () => {
      act(() => {
        root.unmount();
      });
    },
  };
}

export { act };
