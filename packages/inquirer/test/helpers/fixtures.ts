import * as inquirer from '../../lib/inquirer';
import { CheckboxItem, ICheckboxPrompt } from '../../lib/prompts/checkbox';

export const input = {
  message: 'message',
  name: 'name'
};

export const number = {
  message: 'message',
  name: 'name'
};

export const confirm = {
  message: 'message',
  name: 'name'
};

export const password = {
  message: 'message',
  name: 'name'
};

export const list = {
  message: 'message',
  name: 'name',
  choices: ['foo', new inquirer.Separator(), 'bar', 'bum']
};

export const rawlist = {
  message: 'message',
  name: 'name',
  choices: ['foo', 'bar', new inquirer.Separator(), 'bum']
};

export const expand = {
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
  choices: [
    'choice 1',
    new inquirer.Separator(),
    'choice 2',
    'choice 3'
  ] as CheckboxItem[]
};

export const editor = {
  message: 'message',
  name: 'name',
  default: 'Inquirer'
};
