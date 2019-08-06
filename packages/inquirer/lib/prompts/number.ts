/**
 * `input` type prompt
 */

import Input from './input';
import { IBasePrompt } from './base';

export interface INumberPrompt
  extends Pick<
    IBasePrompt<number>,
    'name' | 'message' | 'default' | 'filter' | 'validate' | 'transformer'
  > {
  type: 'number';
}

/**
 * Extention of the Input prompt specifically for use with number inputs.
 */
export default class NumberPrompt extends Input<number> {
  filterInput(input: any) {
    if (input && typeof input === 'string') {
      input = input.trim();
      // Match a number in the input
      let numberMatch = input.match(/(^-?\d+|^\d+\.\d*|^\d*\.\d+)(e\d+)?$/);
      // If a number is found, return that input.
      if (numberMatch) {
        return Number(numberMatch[0]);
      }
    }

    // If the input was invalid return the default value.
    return this.opt.default == null ? NaN : this.opt.default;
  }
}
