import { createPrompt } from '@inquirer/core';
import chalk from 'chalk';

export default createPrompt(
  {
    mapStateToValue: _mapStateToValue
  },
  (state: {
    prefix?: string;
    value?: boolean;
    status?: 'done';
    message: string;
    default?: boolean;
  }, { mapStateToValue }: { mapStateToValue: typeof _mapStateToValue }) => {
    const { prefix, value = '', status } = state;
    const message = chalk.bold(state.message);
    let formattedValue = value;
    if (status === 'done') {
      const value = mapStateToValue(state);
      formattedValue = chalk.cyan(value ? 'yes' : 'no');
    }

    let defaultValue = '';
    if (status !== 'done') {
      defaultValue = chalk.dim(state.default === false ? ' (y/N)' : ' (Y/n)');
    }

    return `${prefix} ${message}${defaultValue} ${formattedValue}`;
  }
);

function _mapStateToValue({ value, default: rawDefault }: any) {
  if (value) {
    return /^y(es)?/i.test(value);
  }

  return rawDefault !== false;
}
