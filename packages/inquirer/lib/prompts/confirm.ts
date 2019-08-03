/**
 * `confirm` type prompt
 */

import { extend, isBoolean } from 'lodash';
import chalk from 'chalk';
import { take, takeUntil } from 'rxjs/operators';
import Base, { IBasePrompt } from './base';
import observe from '../utils/events';

export interface IConfirmPrompt
  extends Pick<IBasePrompt<boolean>, 'name' | 'message' | 'default'> {
  type: 'confirm';
}

export default class ConfirmPrompt extends Base<boolean> {
  constructor(questions: any[], rl: any, answers: any[]) {
    super(questions, rl, answers);

    var rawDefault = true;

    extend(this.opt, {
      filter: (input: any) => {
        var value = rawDefault;
        if (input != null && input !== '') {
          value = /^y(es)?/i.test(input);
        }

        return value;
      }
    });

    if (isBoolean(this.opt.default)) {
      rawDefault = this.opt.default;
    }

    (this.opt.default as any) = rawDefault ? 'Y/n' : 'y/N';

    return this;
  }

  /**
   * Start the Inquiry session
   * @param cb Callback when prompt is done
   */
  protected _run(cb: (...args: any[]) => void) {
    this.done = cb;

    // Once user confirm (enter key)
    var events = observe(this.rl);
    events.keypress.pipe(takeUntil(events.line)).forEach(this.onKeypress.bind(this));

    events.line.pipe(take(1)).forEach(this.onEnd.bind(this));

    // Init
    this.render();

    return this;
  }

  /**
   * Render the prompt to screen
   */
  public render(answer?: any) {
    var message = this.getQuestion();

    if (typeof answer === 'boolean') {
      message += chalk.cyan(answer ? 'Yes' : 'No');
    } else {
      message += this.rl.line;
    }

    this.screen.render(message);

    return this;
  }

  /**
   * When user press `enter` key
   */
  public onEnd(input: any) {
    this.status = 'answered';

    var output = this.opt.filter!(input);
    this.render(output);

    this.screen.done();
    this.done(output);
  }

  /**
   * When user press a key
   */
  public onKeypress() {
    this.render();
  }
}
