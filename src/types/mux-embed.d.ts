declare module 'mux-embed' {
  export interface Metadata {
    [key: string]: unknown;
  }

  export interface MuxOnVideoElement {
    destroy?: () => void;
  }

  export interface Options {
    [key: string]: unknown;
  }

  export interface Mux {
    remove?: () => void;
  }

  const mux: Mux;
  export default mux;
}

interface HTMLVideoElement {
  mux?: unknown;
}
