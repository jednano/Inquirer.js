import { isPlainObject, isArray, set, clone, isFunction } from 'lodash';
import { defer, empty, from, of } from 'rxjs';
import { concatMap, filter, publish, reduce } from 'rxjs/operators';
import runAsync = require('run-async');
import { fetchAsyncQuestionProperty } from '../utils/utils';
import Base from './baseUI';

/**
 * Base interface class other can inherits from
 */
export default class PromptUI extends Base {
  public answers: any;
  public process: any
  constructor(public prompts: Record<string, any>, opt: any) {
    super(opt);
  }

  public run(questions: any[]) {
    // Keep global reference to the answers
    this.answers = {};

    // Make sure questions is an array.
    if (isPlainObject(questions)) {
      questions = [questions];
    }

    // Create an observable, unless we received one as parameter.
    // Note: As this is a public interface, we cannot do an instanceof check as we won't
    // be using the exact same object in memory.
    var obs = isArray(questions) ? from(questions) : questions;

    this.process = obs.pipe(
      concatMap(this.processQuestion.bind(this)),
      publish() // Creates a hot Observable. It prevents duplicating prompts.
    );

    this.process.connect();

    return this.process
      .pipe(
        reduce((_answers, answer: any) => {
          set(this.answers, answer.name, answer.answer);
          return this.answers;
        }, {})
      )
      .toPromise(Promise)
      .then(this.onCompletion.bind(this));
  }

  /**
   * Once all prompt are over
   */
  public onCompletion() {
    this.close();

    return this.answers;
  }

  public processQuestion(question: any) {
    question = clone(question);
    return defer(() => {
      var obs = of(question);

      return obs.pipe(
        concatMap(this.setDefaultType.bind(this)),
        concatMap(this.filterIfRunnable.bind(this)),
        concatMap(() => fetchAsyncQuestionProperty(question, 'message', this.answers)),
        concatMap(() => fetchAsyncQuestionProperty(question, 'default', this.answers)),
        concatMap(() => fetchAsyncQuestionProperty(question, 'choices', this.answers)),
        concatMap(this.fetchAnswer.bind(this))
      );
    });
  }

  public fetchAnswer(question: any) {
    var Prompt = this.prompts[question.type];
    this.activePrompt = new Prompt(question, this.rl, this.answers);
    return defer(() =>
      from(
        this.activePrompt.run().then((answer: any) => ({ name: question.name, answer }))
      )
    );
  }

  public setDefaultType(question: any) {
    // Default type to input
    if (!this.prompts[question.type]) {
      question.type = 'input';
    }

    return defer(() => of(question));
  }

  public filterIfRunnable(question: any) {
    if (question.when === false) {
      return empty();
    }

    if (!isFunction(question.when)) {
      return of(question);
    }

    var answers = this.answers;
    return defer(() =>
      from(
        runAsync(question.when)(answers).then((shouldRun: boolean) => {
          if (shouldRun) {
            return question;
          }
        })
      ).pipe(filter(val => val != null))
    );
  }
}
