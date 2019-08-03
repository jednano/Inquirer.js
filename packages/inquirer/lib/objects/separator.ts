'use strict';
import chalk from 'chalk';
import { line as _line } from 'figures';

/**
 * Separator object
 * Used to space/separate choices group
 * @constructor
 * @param {String} line   Separation line content (facultative)
 */

export default class Separator {
  public type = 'separator';

  public line: string;

  constructor(line?: string) {
    this.line = chalk.dim(line || new Array(15).join(_line));
  }

  /**
   * Stringify separator
   * @returns the separator display string
   */
  public toString() {
    return this.line;
  }

  /**
   * Helper function returning false if object is a separator
   * @param obj object to test against
   * @returns `false` if object is a separator
   */
  public static exclude(obj: { type?: string }) {
    return obj.type !== 'separator';
  }
}

export const exclude = Separator.exclude;
