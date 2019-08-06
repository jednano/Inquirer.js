/**
 * `rawlist` type prompt
 */

import { extend, isNumber, findIndex } from 'lodash';
import chalk from 'chalk';
import { map, takeUntil } from 'rxjs/operators';
import Base, { IBasePrompt } from './base';
import observe from '../utils/events';
import Paginator from '../utils/paginator';
import Choices from '../objects/choices';

export interface IRawListPrompt
  extends Pick<
    IBasePrompt<string | number>,
    'name' | 'message' | 'choices' | 'default' | 'filter'
  > {
  type: 'rawlist';
}

type RawListItem = Omit<IRawListPrompt, 'type'>;

export default class RawList extends Base<string | number> {
  public selected?: number;

  public rawDefault: number;

  public answer: any;

  public paginator: Paginator;

  constructor(
    questions: RawListItem | RawListItem[],
    rl?: any,
    answers?: Record<keyof typeof questions, any>
  ) {
    super(questions, rl, answers);

    if (!this.opt.choices) {
      throw this.createParamError('choices');
    }

    this.selected = 0;
    this.rawDefault = 0;

    extend(this.opt, {
      validate: (val: any) => val != null
    });

    var def = this.opt.default;
    if (isNumber(def) && def >= 0 && def < (this.opt.choices as Choices).realLength) {
      this.selected = def;
      this.rawDefault = def;
    } else if (!isNumber(def) && def != null) {
      let index = findIndex(
        (this.opt.choices as Choices).realChoices,
        ({ value }) => value === def
      );
      let safeIndex = Math.max(index, 0);
      this.selected = safeIndex;
      this.rawDefault = safeIndex;
    }

    // Make sure no default is set (so it won't be printed)
    this.opt.default = undefined;

    this.paginator = new Paginator();
  }

  /**
   * Start the Inquiry session
   * @param cb Callback when prompt is done
   */
  protected _run(cb: (...args: any[]) => void) {
    this.done = cb;

    // Once user confirm (enter key)
    var events = observe(this.rl);
    var submit = events.line.pipe(map(this.getCurrentValue.bind(this)));

    var validation = this.handleSubmitEvents(submit);
    validation.success.forEach(this.onEnd.bind(this));
    validation.error.forEach(this.onError.bind(this));

    events.keypress
      .pipe(takeUntil(validation.success))
      .forEach(this.onKeypress.bind(this));
    events.normalizedUpKey.pipe(takeUntil(events.line)).forEach(this.onUpKey.bind(this));
    events.normalizedDownKey
      .pipe(takeUntil(events.line))
      .forEach(this.onDownKey.bind(this));

    // Init the prompt
    this.render();

    return this;
  }

  /**
   * Render the prompt to screen
   */
  public render(error?: string) {
    // Render question
    var message = this.getQuestion();
    var bottomContent = '';

    if (this.status === 'answered') {
      message += chalk.cyan(this.answer);
    } else {
      var choicesStr = renderChoices(this.opt.choices as Choices, this.selected!);
      message +=
        '\n' + this.paginator.paginate(choicesStr, this.selected, this.opt.pageSize);
      message += '\n  Answer: ';
    }

    message += this.rl.line;

    if (error) {
      bottomContent = '\n' + chalk.red('>> ') + error;
    }

    this.screen.render(message, bottomContent);
  }

  /**
   * When user press `enter` key
   */
  public getCurrentValue(index: any) {
    if (index == null || index === '') {
      index = this.rawDefault;
    } else {
      index -= 1;
    }

    var choice = (this.opt.choices as Choices).getChoice(index);
    return choice ? choice.value : null;
  }

  public onEnd(state: any) {
    this.status = 'answered';
    this.answer = state.value;

    // Re-render prompt
    this.render();

    this.screen.done();
    this.done(state.value);
  }

  public onError() {
    this.render('Please enter a valid index');
  }

  /**
   * When user press a key
   */

  onKeypress() {
    var index = this.rl.line.length ? Number(this.rl.line) - 1 : 0;

    if ((this.opt.choices as Choices).getChoice(index)) {
      this.selected = index;
    } else {
      this.selected = undefined;
    }

    this.render();
  }

  /**
   * When user press up key
   */

  onUpKey() {
    this.onArrowKey('up');
  }

  /**
   * When user press down key
   */

  onDownKey() {
    this.onArrowKey('down');
  }

  /**
   * When user press up or down key
   * @param type Arrow type: up or down
   */
  public onArrowKey(type: 'up' | 'right' | 'down' | 'left') {
    var index = this.rl.line.length ? Number(this.rl.line) - 1 : 0;
    if (type === 'up')
      index = index === 0 ? (this.opt.choices as Choices).length - 1 : index - 1;
    else index = index === (this.opt.choices as Choices).length - 1 ? 0 : index + 1;
    this.rl.line = String(index + 1);
    this.onKeypress();
  }
}

/**
 * Function for rendering list choices
 * @param pointer Position of the pointer
 * @returns Rendered content
 */

function renderChoices(choices: Choices, pointer: number) {
  var output = '';
  var separatorOffset = 0;

  choices.forEach(function(choice, i) {
    output += '\n  ';

    if (choice.type === 'separator') {
      separatorOffset++;
      output += ' ' + choice;
      return;
    }

    var index = i - separatorOffset;
    var display = index + 1 + ') ' + choice.name;
    if (index === pointer) {
      display = chalk.cyan(display);
    }

    output += display;
  });

  return output;
}
