declare module 'pika9' {
  class Pika9 {
    private _options: Pika9.Options;
    private _loaded: boolean;
    private _selection: Pika9.Selection | null;
    private _holder: Pika9.Holder | null;
    private _elManager: Pika9.ElManager | null;
    private _throttleHold: Function | null;
    private _enable: boolean;
    private _holding: boolean;
  }

  namespace Pika9 {
    interface Options {
      parent: string | Node | HTMLElement;
      children: string | Node | HTMLElement;
      threshold?: number;
      onStart?: Function;
      onHold?: Function;
      onEnd?: Function;
      mode?: 'toggle' | 'append' | 'disposable';
      cleanOnClick?: boolean;
    }
    class Selection {}
    class Holder {}
    class ElManager {}
  }

  export = Pika9
}
