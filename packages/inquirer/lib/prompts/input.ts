/**
 * `input` type prompt
 */

import chalk from 'chalk';
import { map, takeUntil } from 'rxjs/operators';
import Base, { IBasePrompt } from './base';
import observe from '../utils/events';

export interface IInputPrompt<T = string>
  extends Pick<
    IBasePrompt<T>,
    'name' | 'message' | 'default' | 'filter' | 'validate' | 'transformer'
  > {
  type: 'input';
}

export default class InputPrompt<T = string> extends Base<T> {
  public answer: any;

  /**
   * Start the Inquiry session
   * @param cb Callback when prompt is done
   */
  protected _run(cb: (...args: any[]) => void) {
    this.done = cb;

    // Once user confirm (enter key)
    var events = observe(this.rl);
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
    let bottomContent = '';
    let message = this.getQuestion();
    const transformer = this.opt.transformer;
    let isFinal = this.status === 'answered';

    const appendContent = isFinal ? this.answer : this.rl.line;

    if (transformer) {
      message += transformer(appendContent, this.answers, { isFinal });
    } else {
      message += isFinal ? chalk.cyan(appendContent) : appendContent;
    }

    if (error) {
      bottomContent = chalk.red('>> ') + error;
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
    this.answer = state.value;
    this.status = 'answered';

    // Re-render prompt
    this.render();

    this.screen.done();
    this.done(state.value);
  }

  public onError(state: any) {
    this.rl.line += state.value;
    this.rl.cursor += state.value.length;
    this.render(state.isValid);
  }

  /**
   * When user press a key
   */
  public onKeypress() {
    // If user press a key, just clear the default value
    if (this.opt.default) {
      this.opt.default = undefined;
    }

    this.render();
  }
}
