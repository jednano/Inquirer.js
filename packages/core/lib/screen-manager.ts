import { last } from 'lodash';
import cliWidth = require('cli-width');
import stripAnsi from 'strip-ansi';
import stringWidth from 'string-width';
import { cursorShow } from 'ansi-escapes';
import { up, left, right, down, clearLine } from './readline';
import { breakLines } from './utils';

const height = (content: string) => content.split('\n').length;
const lastLine = (content: string) => last(content.split('\n'));

export default class ScreenManager {
  // These variables are keeping information to allow correct prompt re-rendering
  private height = 0
  private extraLinesUnderPrompt = 0

  constructor(private rl: any) {}

  render(content: string, bottomContent?: string) {
    this.rl.output.unmute();
    this.clean(this.extraLinesUnderPrompt);

    /**
     * Write message to screen and setPrompt to control backspace
     */

    const promptLine = lastLine(content);
    const rawPromptLine = stripAnsi(promptLine!);

    // Remove the rl.line from our prompt. We can't rely on the content of
    // rl.line (mainly because of the password prompt), so just rely on it's
    // length.
    let prompt = rawPromptLine;
    if (this.rl.line.length) {
      prompt = prompt.slice(0, -this.rl.line.length);
    }

    this.rl.setPrompt(prompt);

    // SetPrompt will change cursor position, now we can get correct value
    const cursorPos = this.rl._getCursorPos();
    const width = cliWidth({ defaultWidth: 80, output: this.rl.output });

    content = breakLines(content, width);
    if (bottomContent) {
      bottomContent = breakLines(bottomContent, width);
    }

    // Manually insert an extra line if we're at the end of the line.
    // This prevent the cursor from appearing at the beginning of the
    // current line.
    if (rawPromptLine.length % width === 0) {
      content += '\n';
    }

    const fullContent = content + (bottomContent ? '\n' + bottomContent : '');
    this.rl.output.write(fullContent);

    /**
     * Re-adjust the cursor at the correct position.
     */

    // We need to consider parts of the prompt under the cursor as part of the bottom
    // content in order to correctly cleanup and re-render.
    const promptLineUpDiff = Math.floor(rawPromptLine.length / width) - cursorPos.rows;
    const bottomContentHeight =
      promptLineUpDiff + (bottomContent ? height(bottomContent) : 0);
    if (bottomContentHeight > 0) {
      up(this.rl, bottomContentHeight);
    }

    // Reset cursor at the beginning of the line
    left(this.rl, stringWidth(lastLine(fullContent)!));

    // Adjust cursor on the right
    if (cursorPos.cols > 0) {
      right(this.rl, cursorPos.cols);
    }

    /**
     * Set up state for next re-rendering
     */
    this.extraLinesUnderPrompt = bottomContentHeight;
    this.height = height(fullContent);

    this.rl.output.mute();
  }

  clean(extraLines: number) {
    if (extraLines > 0) {
      down(this.rl, extraLines);
    }

    clearLine(this.rl, this.height);
  }

  done() {
    this.releaseCursor();
    this.rl.setPrompt('');
    this.rl.output.unmute();
    this.rl.output.write('\n');
    this.rl.output.write(cursorShow);
    this.rl.close();
  }

  releaseCursor() {
    if (this.extraLinesUnderPrompt > 0) {
      down(this.rl, this.extraLinesUnderPrompt);
    }
  }
}
