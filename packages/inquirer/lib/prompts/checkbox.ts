/**
 * `list` type prompt
 */

import { isArray, map as _map, isString } from 'lodash';
import chalk from 'chalk';
import { hide, show } from 'cli-cursor';
import { pointer as _pointer, radioOn, radioOff } from 'figures';
import { map, takeUntil } from 'rxjs/operators';
import Base, { IBasePrompt } from './base';
import observe from '../utils/events';
import Paginator from '../utils/paginator';
import Choices from '../objects/choices';
import Separator from '../objects/separator';

interface ICheckboxBase
  extends Pick<
    IBasePrompt<any[]>,
    'name' | 'message' | 'choices' | 'filter' | 'validate' | 'default' | 'checked'
  > {}

export interface ICheckboxPrompt extends ICheckboxBase {
  type: 'checkbox';
}

export type CheckboxItem =
  | (Omit<ICheckboxBase, 'message'> & { type?: 'checkbox' })
  | Separator;

export default class CheckboxPrompt extends Base<any[]> {
  public pointer = 0;
  public paginator: Paginator;
  public firstRender?: boolean;
  public spaceKeyPressed?: boolean;
  public selection: (string | undefined)[] = [];
  constructor(
    questions: CheckboxItem | CheckboxItem[],
    rl: any,
    answers?: Record<keyof typeof questions, any>
  ) {
    super(questions, rl, answers);

    if (!this.opt.choices) {
      throw this.createParamError('choices');
    }

    if (isArray(this.opt.default)) {
      (this.opt.choices as Choices).forEach(choice => {
        if ((this.opt.default || []).indexOf(choice.value) >= 0) {
          choice.checked = true;
        }
      }, this);
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

    var events = observe(this.rl);

    var validation = this.handleSubmitEvents(
      events.line.pipe(map(this.getCurrentValue.bind(this)))
    );
    validation.success.forEach(this.onEnd.bind(this));
    validation.error.forEach(this.onError.bind(this));

    events.normalizedUpKey
      .pipe(takeUntil(validation.success))
      .forEach(this.onUpKey.bind(this));
    events.normalizedDownKey
      .pipe(takeUntil(validation.success))
      .forEach(this.onDownKey.bind(this));
    events.numberKey
      .pipe(takeUntil(validation.success))
      .forEach(this.onNumberKey.bind(this));
    events.spaceKey
      .pipe(takeUntil(validation.success))
      .forEach(this.onSpaceKey.bind(this));
    events.aKey.pipe(takeUntil(validation.success)).forEach(this.onAllKey.bind(this));
    events.iKey.pipe(takeUntil(validation.success)).forEach(this.onInverseKey.bind(this));

    // Init the prompt
    hide();
    this.render();
    this.firstRender = false;

    return this;
  }

  /**
   * Render the prompt to screen
   */
  public render(error?: Error) {
    // Render question
    var message = this.getQuestion();
    var bottomContent = '';

    if (!this.spaceKeyPressed) {
      message +=
        '(Press ' +
        chalk.cyan.bold('<space>') +
        ' to select, ' +
        chalk.cyan.bold('<a>') +
        ' to toggle all, ' +
        chalk.cyan.bold('<i>') +
        ' to invert selection)';
    }

    // Render choices or answer depending on the state
    if (this.status === 'answered') {
      message += chalk.cyan(this.selection.join(', '));
    } else {
      var choicesStr = renderChoices(this.opt.choices as Choices, this.pointer);
      var indexPosition = (this.opt.choices as Choices).indexOf(
        (this.opt.choices as Choices).getChoice(this.pointer)!
      );
      message +=
        '\n' + this.paginator.paginate(choicesStr, indexPosition, this.opt.pageSize);
    }

    if (error) {
      bottomContent = chalk.red('>> ') + error;
    }

    this.screen.render(message, bottomContent);
  }

  /**
   * When user press `enter` key
   */

  onEnd(state: any) {
    this.status = 'answered';

    // Rerender prompt (and clean subline error)
    this.render();

    this.screen.done();
    show();
    this.done(state.value);
  }

  onError(state: any) {
    this.render(state.isValid);
  }

  getCurrentValue() {
    const choices = (this.opt.choices as Choices).realChoices.filter(choice =>
      Boolean(choice.checked)
    );

    this.selection = _map(choices, 'short');
    return _map(choices, 'value');
  }

  onUpKey() {
    const len = (this.opt.choices as Choices).realLength;
    this.pointer = this.pointer > 0 ? this.pointer - 1 : len - 1;
    this.render();
  }

  onDownKey() {
    const len = (this.opt.choices as Choices).realLength;
    this.pointer = this.pointer < len - 1 ? this.pointer + 1 : 0;
    this.render();
  }

  onNumberKey(input: number) {
    if (input <= (this.opt.choices as Choices).realLength) {
      this.pointer = input - 1;
      this.toggleChoice(this.pointer);
    }

    this.render();
  }

  onSpaceKey() {
    this.spaceKeyPressed = true;
    this.toggleChoice(this.pointer);
    this.render();
  }

  onAllKey() {
    var shouldBeChecked = Boolean(
      (this.opt.choices as Choices).realChoices.find(choice => !choice.checked)
    );

    (this.opt.choices as Choices).realChoices.forEach(choice => {
      choice.checked = shouldBeChecked;
    });

    this.render();
  }

  onInverseKey() {
    (this.opt.choices as Choices).realChoices.forEach(choice => {
      choice.checked = !choice.checked;
    });

    this.render();
  }

  toggleChoice(index: number) {
    var item = (this.opt.choices as Choices).getChoice(index);
    if (item !== undefined) {
      (this.opt.choices as Choices).getChoice(index)!.checked = !item.checked;
    }
  }
}

/**
 * Function for rendering checkbox choices
 * @param pointer Position of the pointer
 * @returns Rendered content
 */
function renderChoices(choices: Choices, pointer: number) {
  let output = '';
  let separatorOffset = 0;

  choices.forEach((choice, i) => {
    if (choice.type === 'separator') {
      separatorOffset++;
      output += ' ' + choice + '\n';
      return;
    }

    if (choice.disabled) {
      separatorOffset++;
      output += ' - ' + choice.name;
      output += ' (' + (isString(choice.disabled) ? choice.disabled : 'Disabled') + ')';
    } else {
      var line = getCheckbox(choice.checked) + ' ' + choice.name;
      if (i - separatorOffset === pointer) {
        output += chalk.cyan(_pointer + line);
      } else {
        output += ' ' + line;
      }
    }

    output += '\n';
  });

  return output.replace(/\n$/, '');
}

/**
 * Get the checkbox
 * @param checked add a X or not to the checkbox
 * @returns Composited checkbox
 */
function getCheckbox(checked?: boolean) {
  return checked ? chalk.green(radioOn) : radioOff;
}
