import assert = require('assert');
import { isNumber, filter as _filter, map, find as _find } from 'lodash';
import Separator, { exclude } from './separator';
import Choice from './choice';

export type ChoicesList<T> = (string | number | (Choice<T> & T) | Separator)[];

/**
 * Choices collection
 * Collection of multiple `choice` object
 * @constructor
 * @param choices  All `choice` to keep in the collection
 */
export default class Choices<T = {}> {
  public choices: ((Choice<T> & T) | Separator)[];

  public realChoices: (Choice<T> & T)[];

  constructor(choices: ChoicesList<T>, answers?: Record<keyof typeof choices, any>) {
    this.choices = choices.map(val => {
      if ((val as (Choice<T> & T)).type === 'separator') {
        if (!(val instanceof Separator)) {
          val = new Separator(((val as any) as Separator).line);
        }

        return val;
      }

      return new Choice(val, answers) as (Choice<T> & T);
    });

    this.realChoices = this.choices
      .filter(exclude)
      .filter(item => !(item as (Choice<T> & T)).disabled) as (Choice<T> & T)[];
  }

  public get length() {
    return this.choices.length;
  }

  public set length(value: number) {
    this.choices.length = value;
  }

  public get realLength() {
    return this.realChoices.length;
  }

  public set realLength(_value: number) {
    throw new Error('Cannot set `realLength` of a Choices collection');
  }

  /**
   * Get a valid choice from the collection
   * @param The selected choice index
   * @returns The matched choice or undefined
   */
  public getChoice(selector: number): (Choice<T> & T) | undefined {
    assert(isNumber(selector));
    return this.realChoices[selector];
  }

  /**
   * Get a raw element from the collection
   * @param selector The selected index value
   * @returns The matched choice or undefined
   */
  public get(selector: number) {
    assert(isNumber(selector));
    return this.choices[selector];
  }

  /**
   * Match the valid choices against a where clause
   * @param whereClause Lodash `where` clause
   * @returns Matching choices or empty array
   */
  public where(whereClause: Partial<Record<keyof (Choice<T> & T), any>>) {
    return _filter(this.realChoices, whereClause);
  }

  /**
   * Pluck a particular key from the choices
   * @param propertyName Property name to select
   * @returns Selected properties
   */
  public pluck(propertyName: keyof (Choice<T> & T)) {
    return map(this.realChoices, propertyName);
  }

  // Expose usual Array methods
  public indexOf(searchElement: Choice<T> & T, fromIndex?: number) {
    return this.choices.indexOf(searchElement, fromIndex);
  }

  public forEach(
    callbackfn: (
      value: Choice<T> & T,
      index: number,
      array: ((Choice<T> & T) | Separator)[]
    ) => void,
    _thisArg?: any
  ) {
    return (this.choices as (Choice<T> & T)[]).forEach(callbackfn);
  }

  public filter(
    callbackfn: (
      value: Partial<Choice<T> & T>,
      index: number,
      array: ((Choice<T> & T) | Separator)[]
    ) => boolean,
    _thisArg?: any
  ) {
    return (this.choices as (Choice<T> & T)[]).filter(callbackfn);
  }

  public find(choice: Partial<Choice<T> & T>, fromIndex?: number) {
    return _find(this.realChoices, choice, fromIndex) as (Choice<T> & T) | undefined;
  }

  push(...items: ((Choice<T> & T) | Separator | string | number)[]) {
    var objs = map(items, val => new Choice(val) as (Choice<T> & T));
    this.choices.push.apply(this.choices, objs);
    this.realChoices = this.choices.filter(exclude) as (Choice<T> & T)[];
    return this.choices;
  }
}
