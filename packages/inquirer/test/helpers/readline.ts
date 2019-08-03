import { EventEmitter } from 'events';
import { stub as _stub } from 'sinon';

export default class ReadlineStub extends EventEmitter {
  public line = '';
  public input = new EventEmitter();
  public write = _stub().returns(this);
  public moveCursor = _stub().returns(this);
  public setPrompt = _stub().returns(this);
  public close = _stub().returns(this);
  public pause = _stub().returns(this);
  public resume = _stub().returns(this);
  public _getCursorPos = _stub().returns({ cols: 0, rows: 0 });
  public output = {
    end: _stub(),
    mute: _stub(),
    unmute: _stub(),
    __raw__: '',
    write(str: string) {
      this.__raw__ += str;
    }
  }
}
