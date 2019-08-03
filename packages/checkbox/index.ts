import { createPrompt } from '@inquirer/core';
import { isUpKey, isDownKey, isSpaceKey, isNumberKey } from '@inquirer/core/lib/key';
import Paginator from '@inquirer/core/lib/Paginator';
import chalk from 'chalk';
import { circleFilled, circle, pointer } from 'figures';
import { cursorHide } from 'ansi-escapes';

export default createPrompt(
  (readline: any) => ({
    onKeypress: (_value: any, key: any, { cursorPosition = 0, choices }: any, setState: any) => {
      let newCursorPosition = cursorPosition;
      if (isUpKey(key) || isDownKey(key)) {
        const offset = isUpKey(key) ? -1 : 1;
        let selectedOption;

        while (!selectedOption || selectedOption.disabled) {
          newCursorPosition =
            (newCursorPosition + offset + choices.length) % choices.length;
          selectedOption = choices[newCursorPosition];
        }

        setState({ cursorPosition: newCursorPosition });
      } else if (isSpaceKey(key)) {
        setState({
          showHelpTip: false,
          choices: choices.map((choice: any, i: number) => {
            if (i === cursorPosition) {
              return Object.assign({}, choice, { checked: !choice.checked });
            }

            return choice;
          })
        });
      } else if (key.name === 'a') {
        const selectAll = Boolean(choices.find((choice: any) => !choice.checked));
        setState({
          choices: choices.map((choice: any) =>
            Object.assign({}, choice, { checked: selectAll })
          )
        });
      } else if (key.name === 'i') {
        setState({
          choices: choices.map((choice: any) =>
            Object.assign({}, choice, { checked: !choice.checked })
          )
        });
      } else if (isNumberKey(key)) {
        // Adjust index to start at 1
        const position = Number(key.name) - 1;

        // Abort if the choice doesn't exists or if disabled
        if (!choices[position] || choices[position].disabled) {
          return;
        }

        setState({
          cursorPosition: position,
          choices: choices.map((choice: any, i: number) => {
            if (i === position) {
              return Object.assign({}, choice, { checked: !choice.checked });
            }

            return choice;
          })
        });
      }
    },
    mapStateToValue: ({ choices }: any) => {
      return choices.filter((choice: any) => choice.checked).map((choice: any) => choice.value);
    },
    paginator: new Paginator(readline)
  }),
  (state: {
    prefix?: string;
    choices: any[];
    showHelpTip?: boolean;
    cursorPosition?: number;
    pageSize?: number;
    message: string;
    status?: 'done';
  }, { paginator }: any) => {
    const { prefix, choices, showHelpTip, cursorPosition = 0, pageSize = 7 } = state;
    const message = chalk.bold(state.message);

    if (state.status === 'done') {
      const selection = choices
        .filter((choice: any) => choice.checked)
        .map(({ name, value }: any) => name || value);
      return `${prefix} ${message} ${chalk.cyan(selection.join(', '))}`;
    }

    let helpTip = '';
    if (showHelpTip !== false) {
      const keys = [
        `${chalk.cyan.bold('<space>')} to select`,
        `${chalk.cyan.bold('<a>')} to toggle all`,
        `${chalk.cyan.bold('<i>')} to invert selection`
      ];
      helpTip = ` (Press ${keys.join(', ')})`;
    }

    const allChoices = choices
      .map(({ name, value, checked, disabled }: any, index: number) => {
        const line = name || value;
        if (disabled) {
          return chalk.dim(` - ${line} (disabled)`);
        }

        const checkbox = checked ? chalk.green(circleFilled) : circle;
        if (index === cursorPosition) {
          return chalk.cyan(`${pointer}${checkbox} ${line}`);
        }

        return ` ${checkbox} ${line}`;
      })
      .join('\n');
    const windowedChoices = paginator.paginate(allChoices, cursorPosition, pageSize);
    return `${prefix} ${message}${helpTip}\n${windowedChoices}${cursorHide}`;
  }
);
