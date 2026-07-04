/// <reference types="nativewind/types" />

/** Hermes / RN 0.73+ — DOM lib 미포함 tsconfig용 */
declare class TextEncoder {
  constructor();
  encode(input?: string): Uint8Array;
}

declare class TextDecoder {
  constructor(label?: string);
  decode(input?: ArrayBufferView, options?: { stream?: boolean }): string;
}
