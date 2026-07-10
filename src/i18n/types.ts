import { COPY_NAMESPACES, type CopyNamespace } from './copyRegistry';

export type CopyFor<N extends CopyNamespace> = (typeof COPY_NAMESPACES)[N]['ko'];
