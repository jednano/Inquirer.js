import { isFunction } from 'lodash';
import { from, of } from 'rxjs';
import runAsync = require('run-async');

/**
 * Resolve a question property value if it is passed as a function.
 * This method will overwrite the property on the question object with the received value.
 * @param question Question object
 * @param prop Property to fetch name
 * @param answers Answers object
 * @returns Observable emitting once value is known
 */
export function fetchAsyncQuestionProperty(question: any, prop: string, answers: any[]) {
  if (!isFunction(question[prop])) {
    return of(question);
  }

  return from(
    runAsync(question[prop])(answers).then((value: any) => {
      question[prop] = value;
      return question;
    })
  );
}
