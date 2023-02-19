export class Event {
  _listeners = []

  addListener(listener) {
    this._listeners.push(listener)
  }

  trigger(param) {
    for (const listener of this._listeners) {
      listener(param)
    }
  }
}
