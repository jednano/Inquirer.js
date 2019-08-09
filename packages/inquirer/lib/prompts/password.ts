/**
 * `password` type prompt
 */

import chalk from 'chalk';
import { map, takeUntil } from 'rxjs/operators';
import Base, { IBasePrompt } from './base';
import observe from '../utils/events';
import { Key } from 'readline';

function mask(input: any, maskChar?: string | true) {
  input = String(input);
  maskChar = typeof maskChar === 'string' ? maskChar : '*';
  if (input.length === 0) {
    return '';
  }

  return new Array(input.length + 1).join(maskChar);
}

export interface PasswordQuestion
  extends Pick<
    IBasePrompt<string>,
    'name' | 'message' | 'mask' | 'default' | 'filter' | 'validate'
  > {
  type: 'password';
}

export default class PasswordPrompt extends Base<string> {
  public answer: any;

  /**
   * Start the Inquiry session
   * @param cb Callback when prompt is done
   */
  protected _run(cb: (...args: any[]) => void) {
    this.done = cb;

    var events = observe(this.rl);

    // Once user confirm (enter key)
    var submit = events.line.pipe(map(this.filterInput.bind(this)));

    var validation = this.handleSubmitEvents(submit);
    validation.success.forEach(this.onEnd.bind(this));
    validation.error.forEach(this.onError.bind(this));

    events.keypress
      .pipe(takeUntil(validation.success))
      .forEach(this.onKeypress.bind(this));

    // Init
    this.render();

    return this;
  }

  /**
   * Render the prompt to screen
   */
  public render(error?: Error) {
    var message = this.getQuestion();
    var bottomContent = '';

    if (this.status === 'answered') {
      message += this.opt.mask
        ? chalk.cyan(mask(this.answer, this.opt.mask))
        : chalk.italic.dim('[hidden]');
    } else if (this.opt.mask) {
      message += mask(this.rl.line || '', this.opt.mask);
    } else {
      message += chalk.italic.dim('[input is hidden] ');
    }

    if (error) {
      bottomContent = '\n' + chalk.red('>> ') + error;
    }

    this.screen.render(message, bottomContent);
  }

  /**
   * When user press `enter` key
   */
  public filterInput(input: any) {
    if (!input) {
      return this.opt.default == null ? '' : this.opt.default;
    }

    return input;
  }

  public onEnd(state: any) {
    this.status = 'answered';
    this.answer = state.value;

    // Re-render prompt
    this.render();

    this.screen.done();
    this.done(state.value);
  }

  public onError(state: any) {
    this.render(state.isValid);
  }

  public onKeypress(_event: { key: Key }) {
    // If user press a key, just clear the default value
    if (this.opt.default) {
      this.opt.default = undefined;
    }

    this.render();
  }
}
