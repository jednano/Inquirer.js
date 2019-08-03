/**
 * Sticky bottom bar user interface
 */

import through = require('through');
import Base from './baseUI';
import { clearLine, left } from '../utils/readline';
import { last } from 'lodash';

export default class BottomBar extends Base {
  public log: through.ThroughStream
  public bottomBar: string
  public height?: number
  constructor(opt: any = {}) {
    super(opt);

    this.log = through(this.writeLog.bind(this));
    this.bottomBar = opt.bottomBar || '';
    this.render();
  }

  /**
   * Render the prompt to screen
   */
  public render() {
    this.write(this.bottomBar);
    return this;
  }

  clean() {
    clearLine(this.rl, this.bottomBar.split('\n').length);
    return this;
  }

  /**
   * Update the bottom bar content and rerender
   * @param bottomBar Bottom bar content
   */
  public updateBottomBar(bottomBar: string) {
    clearLine(this.rl, 1);
    this.rl.output.unmute();
    this.clean();
    this.bottomBar = bottomBar;
    this.render();
    this.rl.output.mute();
    return this;
  }

  /**
   * Write out log data
   * @param data The log data to be output
   */
  public writeLog(data: string) {
    this.rl.output.unmute();
    this.clean();
    this.rl.output.write(this.enforceLF(data.toString()));
    this.render();
    this.rl.output.mute();
    return this;
  }

  /**
   * Make sure line end on a line feed
   * @param str Input string
   * @returns The input string with a final line feed
   */
  public enforceLF(str: string) {
    return str.match(/[\r\n]$/) ? str : str + '\n';
  }

  /**
   * Helper for writing message in Prompt
   * @param message The message to be output
   */
  public write(message: string) {
    var msgLines = message.split(/\n/);
    this.height = msgLines.length;

    // Write message to screen and setPrompt to control backspace
    this.rl.setPrompt(last(msgLines));

    if (this.rl.output.rows === 0 && this.rl.output.columns === 0) {
      /* When it's a tty through serial port there's no terminal info and the render will malfunction,
         so we need enforce the cursor to locate to the leftmost position for rendering. */
      left(this.rl, message.length + this.rl.line.length);
    }

    this.rl.output.write(message);
  }
}
