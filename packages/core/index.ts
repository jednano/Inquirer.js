import { identity, isFunction, noop } from 'lodash';
import { createInterface, Key } from 'readline';
import chalk from 'chalk';
import MuteStream = require('mute-stream');
import runAsync = require('run-async');
import { dots as spinner } from 'cli-spinners';
import ScreenManager from './lib/screen-manager';

const defaultState = {
  validate: () => true,
  filter: identity,
  transformer: identity
};

const defaultMapStateToValue = (state: { value: any; default: any }) => {
  if (!state.value) {
    return state.default;
  }

  return state.value;
};

const defaultOnLine = (_state: any, { submit }: { submit: any }) => submit();

class StateManager {
  public currentState = {
    loadingIncrement: 0,
    value: '',
    status: 'idle'
  };
  public rl: any
  public screen: ScreenManager
  public config: any
  public cb?: (value: any) => void
  constructor(configFactory: any, public initialState: any, public render: any) {
    // Default `input` to stdin
    const input = process.stdin;

    // Add mute capabilities to the output
    const output = new MuteStream();
    output.pipe(process.stdout);

    this.rl = createInterface({
      terminal: true,
      input,
      output
    });
    this.screen = new ScreenManager(this.rl);

    let config = configFactory;
    if (isFunction(configFactory)) {
      config = configFactory(this.rl);
    }

    this.config = config;

    this.onKeypress = this.onKeypress.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.startLoading = this.startLoading.bind(this);
    this.onLoaderTick = this.onLoaderTick.bind(this);
    this.setState = this.setState.bind(this);
    this.handleLineEvent = this.handleLineEvent.bind(this);
  }

  async execute(cb: (value: any) => void) {
    let { message } = this.getState();
    this.cb = cb;

    // Load asynchronous properties
    const showLoader = setTimeout(this.startLoading, 500);
    if (isFunction(message)) {
      message = await runAsync(message)();
    }

    this.setState({ message, status: 'idle' });

    // Disable the loader if it didn't launch
    clearTimeout(showLoader);

    // Setup event listeners once we're done fetching the configs
    this.rl.input.on('keypress', this.onKeypress);
    this.rl.on('line', this.handleLineEvent);
  }

  onKeypress(_value: any, key: Key) {
    const { onKeypress = noop } = this.config;
    // Ignore enter keypress. The "line" event is handling those.
    if (key.name === 'enter' || key.name === 'return') {
      return;
    }

    this.setState({ value: this.rl.line, error: null });
    onKeypress(this.rl.line, key, this.getState(), this.setState);
  }

  startLoading() {
    this.setState({ loadingIncrement: 0, status: 'loading' });
    setTimeout(this.onLoaderTick, spinner.interval);
  }

  onLoaderTick() {
    const { status, loadingIncrement } = this.getState();
    if (status === 'loading') {
      this.setState({ loadingIncrement: loadingIncrement + 1 });
      setTimeout(this.onLoaderTick, spinner.interval);
    }
  }

  handleLineEvent() {
    const { onLine = defaultOnLine } = this.config;
    onLine(this.getState(), {
      submit: this.onSubmit,
      setState: this.setState
    });
  }

  async onSubmit() {
    const state = this.getState();
    const { validate, filter } = state;
    const { validate: configValidate = () => true } = this.config;

    const { mapStateToValue = defaultMapStateToValue } = this.config;
    let value = mapStateToValue(state);

    const showLoader = setTimeout(this.startLoading, 500);
    this.rl.pause();
    try {
      const filteredValue = await runAsync(filter)(value);
      let isValid = configValidate(value, state);
      if (isValid === true) {
        isValid = await runAsync(validate)(filteredValue);
      }

      if (isValid === true) {
        this.onDone(filteredValue);
        clearTimeout(showLoader);
        return;
      }

      this.onError(isValid);
    } catch (err) {
      this.onError(err.message + '\n' + err.stack);
    }

    clearTimeout(showLoader);
    this.rl.resume();
  }

  onError(error?: any) {
    this.setState({
      status: 'idle',
      error: error || 'You must provide a valid value'
    });
  }

  onDone(value: any) {
    this.setState({ status: 'done' });
    this.rl.input.removeListener('keypress', this.onKeypress);
    this.rl.removeListener('line', this.handleLineEvent);
    this.screen.done();
    this.cb!(value);
  }

  setState(partialState: any) {
    this.currentState = Object.assign({}, this.currentState, partialState);
    this.onChange(this.getState());
  }

  getState() {
    return Object.assign({}, defaultState, this.initialState, this.currentState);
  }

  getPrefix() {
    const { status, loadingIncrement } = this.getState();
    let prefix = chalk.green('?');
    if (status === 'loading') {
      const frame = loadingIncrement % spinner.frames.length;
      prefix = chalk.yellow(spinner.frames[frame]);
    }

    return prefix;
  }

  onChange(state: any) {
    const { status, message, value, transformer } = this.getState();

    let error;
    if (state.error) {
      error = `${chalk.red('>>')} ${state.error}`;
    }

    const renderState = Object.assign(
      {
        prefix: this.getPrefix()
      },
      state,
      {
        // Only pass message down if it's a string. Otherwise we're still in init state
        message: isFunction(message) ? 'Loading...' : message,
        value: transformer(value, { isFinal: status === 'done' }),
        validate: undefined,
        filter: undefined,
        transformer: undefined
      }
    );
    this.screen.render(this.render(renderState, this.config), error);
  }
}

export function createPrompt<T, U>(config: T, render: U) {
  const run = (initialState: any) =>
    new Promise(resolve => {
      const prompt = new StateManager(config, initialState, render);
      prompt.execute(resolve);
    });

  run.render = render;
  run.config = config;

  return run;
}
