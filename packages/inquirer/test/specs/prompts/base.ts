import { expect } from 'chai';
import ReadlineStub from '../../helpers/readline';

import Base, { IBasePrompt } from '../../../lib/prompts/base';

type Context = {
  rl: ReadlineStub;
  base: Base<any>;
};

describe('`base` prompt (e.g. prompt helpers)', function() {
  beforeEach(function(this: Context) {
    this.rl = new ReadlineStub();
    this.base = new Base(
      {
        message: 'foo bar',
        name: 'name'
      },
      this.rl
    );
  });

  it('should not point by reference to the entry `question` object', function(this: Context) {
    var question = {
      message: 'foo bar',
      name: 'name'
    };
    var opt = ((new Base(question, this.rl) as any).opt as IBasePrompt<any>);

    expect(question).to.not.equal(opt);
    expect(question.name).to.equal(opt.name);
    expect(question.message).to.equal(opt.message);
  });
});
