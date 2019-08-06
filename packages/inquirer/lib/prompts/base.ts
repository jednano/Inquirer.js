/**
 * Base prompt implementation
 * Should be extended by prompt types.
 */

import { defaults, clone, identity, noop } from 'lodash';
import chalk from 'chalk';
import runAsync = require('run-async');
import { filter, flatMap, share, take, takeUntil } from 'rxjs/operators';
import Choices, { ChoicesList } from '../objects/choices';
import ScreenManager from '../utils/screen-manager';
import { Observable } from 'rxjs/internal/Observable';

export interface IBasePrompt<T, TChoices extends Choices = Choices> {
  /**
   * @default 'input'
   */
  type?:
    | 'checkbox'
    | 'confirm'
    | 'editor'
    | 'expand'
    | 'input'
    | 'list'
    | 'number'
    | 'password'
    | 'rawlist';
  name: string;
  message: string;
  default?: T;
  /**
   * Receive the user input and answers hash. Should return true if the value
   * is valid, and an error message (String) otherwise. If false is returned,
   * a default error message is provided.
   */
  validate?: (value: string) => boolean | string;
  filter?: (value: string) => T;
  when?: () => boolean;
  suffix?: string;
  prefix?: string;
  /**
   * If defined as a function, the first parameter will be the current inquirer
   * session answers.
   */
  choices?: TChoices | ChoicesList<any> | ((answers: any) => TChoices);
  pageSize?: number;
  /**
   * The transformation only impacts what is shown while editing. It does not
   * modify the answers hash.
   * @returns a transformed value to display to the user.
   */
  transformer?: (input: T, answers: any, options: any) => T;
  /**
   * Character used to mask input.
   * @default an asterisk
   */
  mask?: string | true;
  /**
   * Checked by default.
   */
  checked?: boolean;
}

export default class Prompt<T, TChoices extends Choices = Choices> {
  protected opt: IBasePrompt<T, TChoices>;

  public rl: any;

  public screen: ScreenManager;

  public status: 'pending' | 'answered' | 'expanded' = 'pending';

  public message?: string;

  public name?: string;

  public done: (...args: any[]) => void = noop;

  constructor(
    question: any,
    rl?: any,
    public answers?: Record<keyof typeof question, any>
  ) {
    // Set defaults prompt options
    this.opt = defaults(clone(question), {
      validate: () => true,
      filter: identity,
      when: () => true,
      suffix: '',
      prefix: chalk.green('?')
    });

    // Make sure name is present
    if (!this.opt.name) {
      throw this.createParamError('name');
    }

    // Set default message if no message defined
    if (!this.opt.message) {
      this.opt.message = this.opt.name + ':';
    }

    // Normalize choices
    if (Array.isArray(this.opt.choices)) {
      this.opt.choices = new Choices(this.opt.choices, answers) as TChoices;
    }

    this.rl = rl;
    this.screen = new ScreenManager(this.rl);
  }

  /**
   * Start the Inquiry session and manage output value filtering
   */
  public run(): Promise<T> {
    return new Promise(resolve => {
      this._run(resolve);
    });
  }

  /**
   * Default noop (this one should be overwritten in prompts)
   */
  protected _run(cb: (...args: any[]) => void = noop) {
    cb();
  }

  /**
   * Create an error telling a required parameter is missing
   * @param name Name of the missing param
   */
  protected createParamError(name: string) {
    return new Error('You must provide a `' + name + '` parameter');
  }

  /**
   * Called when the UI closes. Override to do any specific cleanup necessary
   */
  public close() {
    this.screen.releaseCursor();
  }

  /**
   * Run the provided validation method each time a submit event occur.
   * @param submit submit event flow
   */
  public handleSubmitEvents<T extends Observable<any>>(submit: T) {
    var self = this;
    var validate = runAsync(this.opt.validate);
    var asyncFilter = runAsync(this.opt.filter);
    var validation = submit.pipe(
      flatMap(value =>
        asyncFilter(value, self.answers).then(
          (filteredValue: any) =>
            validate(filteredValue, self.answers).then(
              (isValid: boolean) => ({ isValid, value: filteredValue }),
              (err: Error) => ({ isValid: err })
            ),
          (err: Error) => ({ isValid: err })
        )
      ),
      share()
    );

    var success = validation.pipe(
      filter((state: any) => state.isValid === true),
      take(1)
    );
    var error = validation.pipe(
      filter((state: any) => state.isValid !== true),
      takeUntil(success)
    );

    return {
      success,
      error
    };
  }

  /**
   * Generate the prompt question string
   * @returns prompt question
   */
  public getQuestion() {
    let message =
      this.opt.prefix +
      ' ' +
      chalk.bold(this.opt.message!) +
      this.opt.suffix +
      chalk.reset(' ');

    // Append the default if available, and if question isn't answered
    if (this.opt.default != null && this.status !== 'answered') {
      // If default password is supplied, hide it
      if (this.opt.type === 'password') {
        message += chalk.italic.dim('[hidden] ');
      } else {
        message += chalk.dim('(' + this.opt.default + ') ');
      }
    }

    return message;
  }
}
