import { isString, isNumber, extend, isFunction } from 'lodash';
import Separator from './separator';

export interface IChoice {
  type?: 'choice' | 'separator';
  /**
   * To display in list.
   */
  name?: string;
  /**
   * To save in the answers hash.
   */
  value?: any;
  /**
   * To display after selection.
   */
  short?: string;
  disabled?: boolean | ((answers?: any[]) => boolean);
  checked?: boolean;
}

/**
 * Choice object
 * Normalize input as choice object
 */
export default class Choice<T = {}> implements IChoice {
  public name?: IChoice['name'];
  public short?: IChoice['short'];
  public value?: IChoice['value'];
  public disabled?: IChoice['disabled'];
  public checked?: IChoice['checked'];
  public type?: IChoice['type'] = 'choice';

  /**
   *
   * @param val Choice value. If an object is passed, it should contains
   * at least one of `value` or `name` property
   * @param answers
   */
  constructor(val: number | string | (IChoice & T) | (Choice<T> & T) | Separator, answers?: Record<keyof typeof val, any>) {
    // Don't process Choice and Separator object
    if (val instanceof Choice || (val as IChoice).type === 'separator') {
      return val as (Choice<T> & T | (IChoice & T));
    }

    if (isString(val) || isNumber(val)) {
      this.name = String(val);
      this.value = val;
      this.short = String(val);
    } else {
      extend(this, val, {
        name: (val as IChoice).name || (val as IChoice).value,
        value: 'value' in val ? val.value : (val as IChoice).name,
        short: (val as IChoice).short || (val as IChoice).name || (val as IChoice).value
      });
    }

    if (isFunction((val as Choice<T>).disabled)) {
      this.disabled = ((val as Choice<T>).disabled as ((
        _answers?: typeof answers
      ) => boolean))(answers);
    } else {
      this.disabled = (val as IChoice).disabled;
    }
  }
}
