import { createPrompt } from '@inquirer/core';
import { isUpKey, isDownKey, isNumberKey } from '@inquirer/core/lib/key';
import Paginator from '@inquirer/core/lib/Paginator';
import chalk from 'chalk';
import { pointer } from 'figures';
import { cursorHide } from 'ansi-escapes';
import{ Key } from 'readline';

export default createPrompt(
  (readline: any) => ({
    onKeypress: (
      _value: any,
      key: Key,
      { cursorPosition = 0, choices }: { cursorPosition: number; choices: any[] },
      setState: (value: any) => any
    ) => {
      if (isUpKey(key) || isDownKey(key)) {
        let newCursorPosition = cursorPosition;
        const offset = isUpKey(key) ? -1 : 1;
        let selectedOption;

        while (!selectedOption || selectedOption.disabled) {
          newCursorPosition =
            (newCursorPosition + offset + choices.length) % choices.length;
          selectedOption = choices[newCursorPosition];
        }

        setState({ cursorPosition: newCursorPosition });
      } else if (isNumberKey(key)) {
        // Adjust index to start at 1
        const newCursorPosition = Number(key.name) - 1;

        // Abort if the choice doesn't exists or if disabled
        if (!choices[newCursorPosition] || choices[newCursorPosition].disabled) {
          return;
        }

        setState({ cursorPosition: newCursorPosition });
      }
    },
    mapStateToValue: ({
      cursorPosition = 0,
      choices
    }: {
      cursorPosition: number;
      choices: any[];
    }) => {
      return choices[cursorPosition].value;
    },
    paginator: new Paginator(readline)
  }),
  (
    state: {
      prefix?: string;
      choices: ({ name: string; value: any; disabled: boolean })[];
      cursorPosition?: number;
      message: string;
      status?: 'done';
      pageSize?: number;
    },
    { paginator }: { paginator: Paginator }
  ) => {
    const { prefix, choices, cursorPosition = 0, pageSize = 7 } = state;
    const message = chalk.bold(state.message);

    if (state.status === 'done') {
      const choice = choices[cursorPosition];
      return `${prefix} ${message} ${chalk.cyan(choice.name || choice.value)}`;
    }

    const allChoices = choices
      .map(
        (
          {
            name,
            value,
            disabled
          }: {
            name: string;
            value: any;
            disabled: boolean;
          },
          index: number
        ) => {
          const line = name || value;
          if (disabled) {
            return chalk.dim(`- ${line} (disabled)`);
          }

          if (index === cursorPosition) {
            return chalk.cyan(`${pointer} ${line}`);
          }

          return `  ${line}`;
        }
      )
      .join('\n');
    const windowedChoices = paginator.paginate(allChoices, cursorPosition, pageSize);
    return `${prefix} ${message}\n${windowedChoices}${cursorHide}`;
  }
);
