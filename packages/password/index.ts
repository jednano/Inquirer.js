import input from '@inquirer/input';
import chalk from 'chalk';

export default (config: any) => {
  if (config.transformer) {
    throw new Error(
      'Inquirer password prompt does not support custom transformer function. Use the input prompt instead.'
    );
  }

  return input(
    Object.assign({}, config, {
      // Make sure we do not display the default password
      defaultValue: undefined,
      transformer: (input: any, { isFinal }: { isFinal: boolean }) => {
        if (config.mask) {
          return Array(input.length)
            .fill(config.mask)
            .join('');
        }

        if (!isFinal) {
          return chalk.dim('[input is masked]');
        }

        return '';
      }
    }),
  );
};
