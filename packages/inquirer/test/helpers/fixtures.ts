import * as inquirer from '../../lib/inquirer';
import { CheckboxQuestion } from '../../lib/prompts/checkbox';
import { ConfirmQuestion } from '../../lib/prompts/confirm';
import { InputQuestion } from '../../lib/prompts/input';
import { NumberQuestion } from '../../lib/prompts/number';
import { PasswordQuestion } from '../../lib/prompts/password';
import { ListQuestion } from '../../lib/prompts/list';
import { RawListQuestion } from '../../lib/prompts/rawlist';
import { ExpandQuestion } from '../../lib/prompts/expand';
import { EditorQuestion } from '../../lib/prompts/editor';

export const input: Omit<InputQuestion, 'type'> = {
  message: 'message',
  name: 'name'
};

export const number: Omit<NumberQuestion, 'type'> = {
  message: 'message',
  name: 'name'
};

export const confirm: Omit<ConfirmQuestion, 'type'> = {
  message: 'message',
  name: 'name'
};

export const password: Omit<PasswordQuestion, 'type'> = {
  message: 'message',
  name: 'name'
};

export const list: Omit<ListQuestion, 'type'> = {
  message: 'message',
  name: 'name',
  choices: ['foo', new inquirer.Separator(), 'bar', 'bum']
};

export const rawlist: Omit<RawListQuestion, 'type'> = {
  message: 'message',
  name: 'name',
  choices: ['foo', 'bar', new inquirer.Separator(), 'bum']
};

export const expand: Omit<ExpandQuestion, 'type'> = {
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

export const checkbox: Omit<CheckboxQuestion, 'type'> = {
  message: 'message',
  name: 'name',
  choices: ['choice 1', new inquirer.Separator(), 'choice 2', 'choice 3']
};

export const editor: Omit<EditorQuestion, 'type'> = {
  message: 'message',
  name: 'name',
  default: 'Inquirer'
};
