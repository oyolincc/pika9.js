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

    private _init(options: Pika9.Options): void;
    private _load(): void;
    private _checkLoad(): void;
    private _updateSelection(startPoint: Pika9.Point, endPoint: Pika9.Point): void;
    private _onHoldStart(ev: Pika9.HolderEvent): void;
    private _onHoldMove(ev: Pika9.HolderEvent): void;
    private _onHoldEnd(ev: Pika9.HolderEvent): void;
    public enable(): void;
    public disable(): void;
    public unload(): void;
    public setSelectable(children: Pika9.Selector | Pika9.Selector[]): void;

    public constructor(options: Pika9.Options);
  }

  namespace Pika9 {
    type Selector = string | Node | HTMLElement;
    type Point = { x: number, y: number, [key: string]: any }
  
    interface Options {
      parent: Selector;
      children: Selector | Selector[];
      threshold?: number;
      onStart?: (ev: Event) => any;
      onHold?: (ev: Event) => any;
      onEnd?: (ev: Event) => any;
      mode?: 'toggle' | 'append' | 'disposable';
      cleanOnClick?: boolean;
    }

    interface Event {
      start: Point;
      active: Point;
      added: HTMLElement[];
      removed: HTMLElement[];
      selected: HTMLElement[];
    }

    interface HolderEvent {
      activePoint?: Point;
      startPoint: Point;
      target: HTMLElement;
      currentTarget: HTMLElement;
    }
  
    class Selection {}
    class Holder {}
    class ElManager {}
  }

  export = Pika9
}
