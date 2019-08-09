export { default as Separator } from './objects/separator';
import BottomBar from './ui/bottom-bar';
import Prompt from './ui/prompt';

import BasePrompt, { IBasePrompt } from './prompts/base';
import list, { ListQuestion } from './prompts/list';
import input, { InputQuestion } from './prompts/input';
import number, { NumberQuestion } from './prompts/number';
import confirm, { ConfirmQuestion } from './prompts/confirm';
import rawlist, { RawListQuestion } from './prompts/rawlist';
import expand, { ExpandQuestion } from './prompts/expand';
import checkbox, { CheckboxQuestion } from './prompts/checkbox';
import password, { PasswordQuestion } from './prompts/password';
import editor, { EditorQuestion } from './prompts/editor';

export const ui = {
  BottomBar,
  Prompt
};

const defaultPrompts = {
  list,
  input,
  number,
  confirm,
  rawlist,
  expand,
  checkbox,
  password,
  editor
};

export type DefaultQuestions =
  | ListQuestion
  | InputQuestion
  | NumberQuestion
  | ConfirmQuestion
  | RawListQuestion
  | ExpandQuestion
  | CheckboxQuestion
  | PasswordQuestion
  | EditorQuestion;

type PromptFunction = ((...args: ConstructorParameters<typeof BasePrompt>) => void)

/**
 * Inquirer.js
 * A collection of common interactive command line user interfaces.
 */
export default class Inquirer<
  K extends string = never,
  V extends IBasePrompt | PromptFunction = IBasePrompt,
  Q = DefaultQuestions
> {
  public prompts = { ...defaultPrompts } as typeof defaultPrompts & Record<K, V>;

  constructor(
    options: {
      input?: NodeJS.ReadStream;
      output?: NodeJS.WriteStream;
    } = {},
    private ui: Prompt = new Prompt({ ...defaultPrompts }, options)
  ) {}

  prompt(questions: Q | Q[]) {
    const promise = this.ui.run(questions);

    // Monkey patch the UI on the promise object so
    // that it remains publicly accessible.
    (promise as any).ui = this.ui;

    return promise as Promise<any> & { ui: Prompt };
  }

  /**
   * Register a prompt type
   * @param name Prompt type name
   * @param prompt Prompt constructor
   */
  public registerPrompt<
    RK extends string,
    RV extends IBasePrompt<any> | PromptFunction
  >(name: RK, prompt: RV): Inquirer<RK, RV, Q | Record<string, any>> {
    (this.prompts as any)[name] = prompt;
    return this as any;
  }

  public restoreDefaultPrompts() {
    this.prompts = {
      ...this.prompts,
      ...defaultPrompts
    };
  }
}
