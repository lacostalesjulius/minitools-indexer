export class State {
  #value;
  #hooks = [];

  constructor(initialValue = null) {
    this.#value = initialValue;
  }

  get value() {
    return this.#value;
  }

  set value(newValue) {
    const previous = this.#value;
    this.#value = newValue;
    this.#hooks.forEach(hook => {
      try { hook(newValue, previous); } catch(e) { console.error(e); }
    });
  }

  use(hook) {
    this.#hooks.push(hook);
  }

  remove(hook) {
    this.#hooks = this.#hooks.filter(h => h !== hook);
  }
}
