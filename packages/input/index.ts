import { createPrompt } from '@inquirer/core';
import chalk from 'chalk';

export default createPrompt(
  {
    canRemoveDefault: true,
    onKeypress: (
      value: any,
      key: { name: string },
      { canRemoveDefault }: { canRemoveDefault: boolean },
      setState: (s: any) => any
    ) => {
      const newState: any = { canRemoveDefault: !value };

      // Allow user to remove the default value by pressing backspace
      if (canRemoveDefault && key.name === 'backspace') {
        newState.default = undefined;
      }

      setState(newState);
    }
  },
  (state: {
    prefix?: string;
    value?: string;
    status?: 'idle' | 'done';
    message: string;
    default?: string;
  }) => {
    const { prefix, value = '', status } = state;
    const message = chalk.bold(state.message);
    let formattedValue = value;
    if (status === 'done') {
      formattedValue = chalk.cyan(value || state.default || '');
    }

    let defaultValue = '';
    if (state.default && status !== 'done' && !value) {
      defaultValue = chalk.dim(` (${state.default})`);
    }

    return `${prefix} ${message}${defaultValue} ${formattedValue}`;
  }
);
