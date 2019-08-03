import {
  cursorBackward,
  cursorForward,
  cursorUp,
  cursorDown,
  eraseLines
} from 'ansi-escapes';

/**
 * Move cursor left by `x`
 * @param rl Readline instance
 * @param x How far to go left (default to 1)
 */
export function left(rl: any, x: number) {
  rl.output.write(cursorBackward(x));
}

/**
 * Move cursor right by `x`
 * @param rl Readline instance
 * @param x How far to go left (default to 1)
 */
export function right(rl: any, x: number) {
  rl.output.write(cursorForward(x));
}

/**
 * Move cursor up by `x`
 * @param rl Readline instance
 * @param x How far to go up (default to 1)
 */
export function up(rl: any, x: number) {
  rl.output.write(cursorUp(x));
}

/**
 * Move cursor down by `x`
 * @param rl Readline instance
 * @param x How far to go down (default to 1)
 */
export function down(rl: any, x: number) {
  rl.output.write(cursorDown(x));
}

/**
 * Clear current line
 * @param rl Readline instance
 * @param len number of lines to delete
 */
export function clearLine(rl: any, len: number) {
  rl.output.write(eraseLines(len));
}
