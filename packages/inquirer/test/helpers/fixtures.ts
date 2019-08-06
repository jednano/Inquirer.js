import * as inquirer from '../../lib/inquirer';
import { ICheckboxPrompt } from '../../lib/prompts/checkbox';
import { IConfirmPrompt } from '../../lib/prompts/confirm';
import { IInputPrompt } from '../../lib/prompts/input';
import { INumberPrompt } from '../../lib/prompts/number';
import { IPasswordPrompt } from '../../lib/prompts/password';
import { IListPrompt } from '../../lib/prompts/list';
import { IRawListPrompt } from '../../lib/prompts/rawlist';
import { IExpandPrompt } from '../../lib/prompts/expand';
import { IEditorPrompt } from '../../lib/prompts/editor';

export const input: Omit<IInputPrompt, 'type'> = {
  message: 'message',
  name: 'name'
};

export const number: Omit<INumberPrompt, 'type'> = {
  message: 'message',
  name: 'name'
};

export const confirm: Omit<IConfirmPrompt, 'type'> = {
  message: 'message',
  name: 'name'
};

export const password: Omit<IPasswordPrompt, 'type'> = {
  message: 'message',
  name: 'name'
};

export const list: Omit<IListPrompt, 'type'> = {
  message: 'message',
  name: 'name',
  choices: ['foo', new inquirer.Separator(), 'bar', 'bum']
};

export const rawlist: Omit<IRawListPrompt, 'type'> = {
  message: 'message',
  name: 'name',
  choices: ['foo', 'bar', new inquirer.Separator(), 'bum']
};

export const expand: Omit<IExpandPrompt, 'type'> = {
  message: 'message',
  name: 'name',
  choices: [
    { key: 'a', name: 'acab' },
    new inquirer.Separator(),
    { key: 'b', name: 'bar' },
    { key: 'c', name: 'chile' },
    { key: 'd', name: 'd', value: false }
  ]
};

export const checkbox: Omit<ICheckboxPrompt, 'type'> = {
  message: 'message',
  name: 'name',
  choices: ['choice 1', new inquirer.Separator(), 'choice 2', 'choice 3']
};

export const editor: Omit<IEditorPrompt, 'type'> = {
  message: 'message',
  name: 'name',
  default: 'Inquirer'
};
