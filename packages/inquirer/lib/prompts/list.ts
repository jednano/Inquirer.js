/**
 * `list` type prompt
 */

import { isNumber, findIndex, identity, isString } from 'lodash';
import chalk from 'chalk';
import { pointer as _pointer } from 'figures';
import { hide, show } from 'cli-cursor';
import runAsync = require('run-async');
import { flatMap, map, take, takeUntil } from 'rxjs/operators';
import Base, { IBasePrompt } from './base';
import observe from '../utils/events';
import Paginator from '../utils/paginator';
import Choices from '../objects/choices';

export interface ListQuestion
  extends Pick<
    IBasePrompt<string | number>,
    'name' | 'message' | 'choices' | 'default' | 'filter'
  > {
  type: 'list';
}

type ListItem = Omit<ListQuestion, 'type'> & { type?: 'list' };

export default class ListPrompt extends Base<string | number> {
  public firstRender: boolean;

  public selected: number;

  public paginator: Paginator;

  constructor(
    questions: ListItem | ListItem[],
    rl?: any,
    answers?: Record<keyof typeof questions, any>
  ) {
    super(questions, rl, answers);

    if (!this.opt.choices) {
      throw this.createParamError('choices');
    }

    this.firstRender = true;
    this.selected = 0;

    var def = this.opt.default;

    // If def is a Number, then use as index. Otherwise, check for value.
    if (isNumber(def) && def >= 0 && def < (this.opt.choices as Choices).realLength) {
      this.selected = def;
    } else if (!isNumber(def) && def != null) {
      let index = findIndex(
        (this.opt.choices as Choices).realChoices,
        ({ value }) => value === def
      );
      this.selected = Math.max(index, 0);
    }

    // Make sure no default is set (so it won't be printed)
    this.opt.default = undefined;

    this.paginator = new Paginator(this.screen);
  }

  /**
   * Start the Inquiry session
   * @param cb Callback when prompt is done
   */
  protected _run(cb: (...args: any[]) => void) {
    this.done = cb;

    var self = this;

    var events = observe(this.rl);
    events.normalizedUpKey.pipe(takeUntil(events.line)).forEach(this.onUpKey.bind(this));
    events.normalizedDownKey
      .pipe(takeUntil(events.line))
      .forEach(this.onDownKey.bind(this));
    events.numberKey.pipe(takeUntil(events.line)).forEach(this.onNumberKey.bind(this));
    events.line
      .pipe(
        take(1),
        map(this.getCurrentValue.bind(this)),
        flatMap(value => runAsync(self.opt.filter)(value).catch(identity))
      )
      .forEach(this.onSubmit.bind(this));

    // Init the prompt
    hide();
    this.render();

    return this;
  }

  /**
   * Render the prompt to screen
   */
  public render() {
    // Render question
    var message = this.getQuestion();

    if (this.firstRender) {
      message += chalk.dim('(Use arrow keys)');
    }

    // Render choices or answer depending on the state
    if (this.status === 'answered') {
      message += chalk.cyan(
        (this.opt.choices as Choices).getChoice(this.selected)!.short!
      );
    } else {
      var choicesStr = listRender(this.opt.choices as Choices, this.selected);
      var indexPosition = (this.opt.choices as Choices).indexOf(
        (this.opt.choices as Choices).getChoice(this.selected)!
      );
      message +=
        '\n' + this.paginator.paginate(choicesStr, indexPosition, this.opt.pageSize);
    }

    this.firstRender = false;

    this.screen.render(message);
  }

  /**
   * When user press `enter` key
   */
  public onSubmit(value: any) {
    this.status = 'answered';

    // Rerender prompt
    this.render();

    this.screen.done();
    show();
    this.done(value);
  }

  public getCurrentValue() {
    return (this.opt.choices as Choices).getChoice(this.selected)!.value;
  }

  /**
   * When user press a key
   */
  public onUpKey() {
    var len = (this.opt.choices as Choices).realLength;
    this.selected = this.selected > 0 ? this.selected - 1 : len - 1;
    this.render();
  }

  public onDownKey() {
    var len = (this.opt.choices as Choices).realLength;
    this.selected = this.selected < len - 1 ? this.selected + 1 : 0;
    this.render();
  }

  public onNumberKey(input: number) {
    if (input <= (this.opt.choices as Choices).realLength) {
      this.selected = input - 1;
    }

    this.render();
  }
}

/**
 * Function for rendering list choices
 * @param pointer Position of the pointer
 * @returns Rendered content
 */
function listRender(choices: Choices, pointer: number) {
  var output = '';
  var separatorOffset = 0;

  choices.forEach((choice, i) => {
    if (choice.type === 'separator') {
      separatorOffset++;
      output += '  ' + choice + '\n';
      return;
    }

    if (choice.disabled) {
      separatorOffset++;
      output += '  - ' + choice.name;
      output += ' (' + (isString(choice.disabled) ? choice.disabled : 'Disabled') + ')';
      output += '\n';
      return;
    }

    var isSelected = i - separatorOffset === pointer;
    var line = (isSelected ? _pointer + ' ' : '  ') + choice.name;
    if (isSelected) {
      line = chalk.cyan(line);
    }

    output += line + ' \n';
  });

  return output.replace(/\n$/, '');
}
