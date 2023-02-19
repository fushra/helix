declare module 'resource://app/modules/Event.sys.mjs' {
  type Listener<T> = (params: T) => unknown | Promise<unknown>

  export class Event<T> {
    private _listeners: Listener<T>[]

    addListener(listener: Listener<T>): void
    trigger(param: T): void
  }
}
