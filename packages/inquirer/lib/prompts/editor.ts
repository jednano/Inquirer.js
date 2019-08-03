/**
 * `editor` type prompt
 */

import chalk from 'chalk';
import { editAsync } from 'external-editor';
import Base, { IBasePrompt } from './base';
import observe from '../utils/events';
import { Subject, Subscription } from 'rxjs';

export interface IEditorPrompt
  extends Pick<
    IBasePrompt<string>,
    'name' | 'message' | 'default' | 'filter' | 'validate'
  > {
  type: 'editor';
}

export default class EditorPrompt extends Base<string> {
  public editorResult?: Subject<any>;
  public lineSubscription?: Subscription;
  public currentText? = '';
  public answer: any;
  /**
   * Start the Inquiry session
   * @param cb Callback when prompt is done
   */
  protected _run(cb: (...args: any[]) => void) {
    this.done = cb;

    this.editorResult = new Subject();

    // Open Editor on "line" (Enter Key)
    var events = observe(this.rl);
    this.lineSubscription = events.line.subscribe(this.startExternalEditor.bind(this));

    // Trigger Validation when editor closes
    var validation = this.handleSubmitEvents(this.editorResult);
    validation.success.forEach(this.onEnd.bind(this));
    validation.error.forEach(this.onError.bind(this));

    // Prevents default from being printed on screen (can look weird with multiple lines)
    this.currentText = this.opt.default;
    this.opt.default = undefined;

    // Init
    this.render();

    return this;
  }

  /**
   * Render the prompt to screen
   */
  public render(error?: Error) {
    var bottomContent = '';
    var message = this.getQuestion();

    if (this.status === 'answered') {
      message += chalk.dim('Received');
    } else {
      message += chalk.dim('Press <enter> to launch your preferred editor.');
    }

    if (error) {
      bottomContent = chalk.red('>> ') + error;
    }

    this.screen.render(message, bottomContent);
  }

  /**
   * Launch $EDITOR on user press enter
   */
  public startExternalEditor() {
    // Pause Readline to prevent stdin and stdout from being modified while the editor is showing
    this.rl.pause();
    editAsync(this.currentText!, this.endExternalEditor.bind(this));
  }

  public endExternalEditor(error: Error, result: any) {
    this.rl.resume();
    if (error) {
      this.editorResult!.error(error);
    } else {
      this.editorResult!.next(result);
    }
  }

  public onEnd(state: any) {
    this.editorResult!.unsubscribe();
    this.lineSubscription!.unsubscribe();
    this.answer = state.value;
    this.status = 'answered';
    // Re-render prompt
    this.render();
    this.screen.done();
    this.done(this.answer);
  }

  public onError(state: any) {
    this.render(state.isValid);
  }
}
