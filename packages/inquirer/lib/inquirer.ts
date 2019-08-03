export { default as Separator } from './objects/separator';
import BottomBar from './ui/bottom-bar';
import Prompt from './ui/prompt';

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
 * Create a new self-contained prompt module.
 */
export function createPromptModule(opt?: any) {
  /**
   * Public CLI helper interface
   * @param questions Questions settings array
   */
  function promptModule(questions: any[]) {
    const _ui = new ui.Prompt(promptModule.prompts, opt);
    const promise = _ui.run(questions);

    // Monkey patch the UI on the promise object so
    // that it remains publicly accessible.
    promise.ui = _ui;

    return promise;
  }

  promptModule.prompts = { ...defaultPrompts } as Record<string, any>;

  /**
   * Register a prompt type
   * @param name Prompt type name
   * @param prompt Prompt constructor
   */
  promptModule.registerPrompt = function(name: string, prompt: any) {
    promptModule.prompts[name] = prompt;
    return this;
  };

  /**
   * Register the defaults provider prompts
   */
  promptModule.restoreDefaultPrompts = function() {
    promptModule.prompts = {
      ...promptModule.prompts,
      ...defaultPrompts
    };
  };

  return promptModule;
}

export const prompt = createPromptModule();

// Expose helper functions on the top level for easiest usage by common users
export function registerPrompt(name: string, prompt: any) {
  prompt.registerPrompt(name, prompt);
}

export function restoreDefaultPrompts() {
  prompt.restoreDefaultPrompts();
}
