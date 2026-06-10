export class Terminal {
  constructor() {
    this.onData = jest.fn();
    this.loadAddon = jest.fn();
    this.open = jest.fn();
    this.dispose = jest.fn();
    this.write = jest.fn();
    this.reset = jest.fn();
    this.resize = jest.fn();
    this.focus = jest.fn();
  }
}
