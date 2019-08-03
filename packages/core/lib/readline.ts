import {
  cursorBackward,
  cursorForward,
  cursorUp,
  cursorDown,
  eraseLines
} from 'ansi-escapes';

/**
 * Move cursor left by `x`
 * @param  {Readline} rl - Readline instance
 * @param  {Number}   x  - How far to go left (default to 1)
 */

export function left(rl: { output: any }, x?: number) {
  rl.output.write(cursorBackward(x));
}

/**
 * Move cursor right by `x`
 * @param  {Readline} rl - Readline instance
 * @param  {Number}   x  - How far to go left (default to 1)
 */

export function right(rl: { output: any }, x?: number) {
  rl.output.write(cursorForward(x));
}

/**
 * Move cursor up by `x`
 * @param  {Readline} rl - Readline instance
 * @param  {Number}   x  - How far to go up (default to 1)
 */

export function up(rl: { output: any }, x?: number) {
  rl.output.write(cursorUp(x));
}

/**
 * Move cursor down by `x`
 * @param  {Readline} rl - Readline instance
 * @param  {Number}   x  - How far to go down (default to 1)
 */

export function down(rl: { output: any }, x?: number) {
  rl.output.write(cursorDown(x));
}

/**
 * Clear current line
 * @param  {Readline} rl  - Readline instance
 * @param  {Number}   len - number of line to delete
 */
export function clearLine(rl: { output: any }, len: number) {
  rl.output.write(eraseLines(len));
}
