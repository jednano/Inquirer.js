export { default as Separator } from './objects/separator';
import BottomBar from './ui/bottom-bar';
import Prompt from './ui/prompt';

import { IBasePrompt } from './prompts/base';
import list from './prompts/list';
import input from './prompts/input';
import number from './prompts/number';
import confirm from './prompts/confirm';
import rawlist from './prompts/rawlist';
import expand from './prompts/expand';
import checkbox from './prompts/checkbox';
import password from './prompts/password';
import editor from './prompts/editor';

/**
 * Inquirer.js
 * A collection of common interactive command line user interfaces.
 */

export const prompts: Record<string, any> = {};

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

/**
 * Public CLI helper interface
 * @param questions Questions settings array
 */
class PromptModule<T extends Record<string, any> = Record<never, never>> {
  public prompts = { ...defaultPrompts } as typeof defaultPrompts & T;

  constructor(private ui: Prompt) {}

  prompt(questions: (IBasePrompt & T) | (IBasePrompt & T)[]) {
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
  public registerPrompt<U extends string, V>(
    name: U,
    PromptClass: V
  ): PromptModule<Record<U, V>> {
    (this.prompts as any)[name] = PromptClass;
    return this
  }

  public restoreDefaultPrompts() {
    this.prompts = {
      ...this.prompts,
      ...defaultPrompts
    };
  }
}

/**
 * Create a new self-contained prompt module.
 */
export function createPromptModule(
  opt: {
    input?: NodeJS.ReadStream;
    output?: NodeJS.WriteStream;
  } = {}
) {
  return new PromptModule(new ui.Prompt({ ...defaultPrompts }, opt));
}

export const prompt = createPromptModule();

// Expose helper functions on the top level for easiest usage by common users
export function registerPrompt<T extends string, U>(name: T, PromptClass: U) {
  return prompt.registerPrompt(name, PromptClass);
}

export function restoreDefaultPrompts() {
  prompt.restoreDefaultPrompts();
}
