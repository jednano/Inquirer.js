/**
 * `rawlist` type prompt
 */

import { uniq, isNumber, isString, findIndex } from 'lodash';
import chalk from 'chalk';
import { map, takeUntil } from 'rxjs/operators';
import Base, { IBasePrompt } from './base';
import { exclude } from '../objects/separator';
import observe from '../utils/events';
import Paginator from '../utils/paginator';
import Choices from '../objects/choices';

export interface ExpandQuestion
  extends Pick<IBasePrompt<number | string>, 'name' | 'message' | 'choices' | 'default'> {
  type: 'expand';
}

type ExpandItem = Omit<ExpandQuestion, 'type'> & { type?: 'expand' };

type TChoices = Choices<{
  /**
   * Must be a single (lowercased) character.
   */
  key: string;
}>;

export default class ExpandPrompt extends Base<number | string, TChoices> {
  public paginator: Paginator;

  public answer: any;

  public keypressObs: any;

  public selectedKey: any;

  public rawDefault: any;

  constructor(
    questions: ExpandItem | ExpandItem[],
    rl?: any,
    answers?: Record<keyof typeof questions, any>
  ) {
    super(questions, rl, answers);

    if (!this.opt.choices) {
      throw this.createParamError('choices');
    }

    this.validateChoices(this.opt.choices as TChoices);

    // Add the default `help` (/expand) option
    (this.opt.choices as TChoices).push({
      key: 'h',
      name: 'Help, list all options',
      value: 'help'
    });

    this.opt.validate = (choice: string) => {
      if (choice == null) {
        return 'Please enter a valid command';
      }

      return choice !== 'help';
    };

    // Setup the default string (capitalize the default key)
    this.opt.default = this.generateChoicesString(
      this.opt.choices as TChoices,
      this.opt.default
    );

    this.paginator = new Paginator(this.screen);
  }

  /**
   * Start the Inquiry session
   * @param cb Callback when prompt is done
   */
  protected _run(cb: (...args: any[]) => void) {
    this.done = cb;

    // Save user answer and update prompt to show selected option.
    var events = observe(this.rl);
    var validation = this.handleSubmitEvents(
      events.line.pipe(map(this.getCurrentValue.bind(this)))
    );
    validation.success.forEach(this.onSubmit.bind(this));
    validation.error.forEach(this.onError.bind(this));
    this.keypressObs = events.keypress
      .pipe(takeUntil(validation.success))
      .forEach(this.onKeypress.bind(this));

    // Init the prompt
    this.render();

    return this;
  }

  /**
   * Render the prompt to screen
   */
  public render(error?: Error | null, hint?: any) {
    var message = this.getQuestion();
    var bottomContent = '';

    if (this.status === 'answered') {
      message += chalk.cyan(this.answer);
    } else if (this.status === 'expanded') {
      var choicesStr = renderChoices(this.opt.choices as TChoices, this.selectedKey);
      message += this.paginator.paginate(choicesStr, this.selectedKey, this.opt.pageSize);
      message += '\n  Answer: ';
    }

    message += this.rl.line;

    if (error) {
      bottomContent = chalk.red('>> ') + error;
    }

    if (hint) {
      bottomContent = chalk.cyan('>> ') + hint;
    }

    this.screen.render(message, bottomContent);
  }

  public getCurrentValue(input: any) {
    if (!input) {
      input = this.rawDefault;
    }

    var selected = (this.opt.choices as TChoices).find({
      key: input.toLowerCase().trim()
    });
    if (!selected) {
      return null;
    }

    return selected.value;
  }

  /**
   * Generate the prompt choices string
   * @returns Choices
   */
  public getChoices() {
    var output = '';

    (this.opt.choices as TChoices).forEach(choice => {
      output += '\n  ';

      if (choice.type === 'separator') {
        output += ' ' + choice;
        return;
      }

      var choiceStr = choice.key + ') ' + choice.name;
      if (this.selectedKey === choice.key) {
        choiceStr = chalk.cyan(choiceStr);
      }

      output += choiceStr;
    });

    return output;
  }

  public onError(state: any) {
    if (state.value === 'help') {
      this.selectedKey = '';
      this.status = 'expanded';
      this.render();
      return;
    }

    this.render(state.isValid);
  }

  /**
   * When user press `enter` key
   */
  public onSubmit(state: any) {
    this.status = 'answered';
    var choice = (this.opt.choices as TChoices).find({ value: state.value });
    this.answer = choice ? choice.short || choice.name : null;

    // Re-render prompt
    this.render();
    this.screen.done();
    this.done(state.value);
  }

  /**
   * When user press a key
   */
  public onKeypress() {
    this.selectedKey = this.rl.line.toLowerCase();
    var selected = (this.opt.choices as TChoices).find({ key: this.selectedKey });
    if (this.status === 'expanded') {
      this.render();
    } else {
      this.render(null, selected ? selected.name : null);
    }
  }

  /**
   * Validate the choices
   */
  public validateChoices(choices: TChoices) {
    let formatError;
    const errors: string[] = [];
    const keymap: Record<string, any> = {};
    choices.filter(exclude).forEach(choice => {
      if (!choice.key || choice.key.length !== 1) {
        formatError = true;
      }

      if (keymap[choice.key]) {
        errors.push(choice.key);
      }

      keymap[choice.key] = true;
      choice.key = String(choice.key).toLowerCase();
    });

    if (formatError) {
      throw new Error(
        'Format error: `key` param must be a single letter and is required.'
      );
    }

    if (keymap.h) {
      throw new Error(
        'Reserved key error: `key` param cannot be `h` - this value is reserved.'
      );
    }

    if (errors.length) {
      throw new Error(
        'Duplicate key error: `key` param must be unique. Duplicates: ' +
          uniq(errors).join(', ')
      );
    }
  }

  /**
   * Generate a string out of the choices keys
   * @param default The choice index or name to capitalize
   * @returns The rendered choices key string
   */
  public generateChoicesString(choices: TChoices, defaultChoice?: number | string) {
    var defIndex = choices.realLength - 1;
    if (
      isNumber(defaultChoice) &&
      (this.opt.choices as TChoices).getChoice(defaultChoice)
    ) {
      defIndex = defaultChoice;
    } else if (isString(defaultChoice)) {
      let index = findIndex(choices.realChoices, ({ value }) => value === defaultChoice);
      defIndex = index === -1 ? defIndex : index;
    }

    var defStr = (this.opt.choices as TChoices).pluck('key');
    this.rawDefault = defStr[defIndex];
    defStr[defIndex] = String(defStr[defIndex]).toUpperCase();
    return defStr.join('');
  }
}

/**
 * Function for rendering checkbox choices
 * @param pointer Selected key
 * @returns Rendered content
 */
function renderChoices(choices: TChoices, pointer: string) {
  var output = '';

  choices.forEach(choice => {
    output += '\n  ';

    if (choice.type === 'separator') {
      output += ' ' + choice;
      return;
    }

    var choiceStr = choice.key + ') ' + choice.name;
    if (pointer === choice.key) {
      choiceStr = chalk.cyan(choiceStr);
    }

    output += choiceStr;
  });

  return output;
}
