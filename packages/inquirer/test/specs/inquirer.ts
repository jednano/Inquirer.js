/**
 * Inquirer public API test
 */

import { expect } from 'chai';
import { stub, spy as _spy, assert } from 'sinon';
import { noop } from 'lodash';
import { Observable } from 'rxjs';
import Inquirer from '../../lib/inquirer';
import { autosubmit } from '../helpers/events';

interface Context {
  inq: Inquirer;
}

describe('inquirer.prompt', function() {
  beforeEach(function(this: Context) {
    this.inq = new Inquirer();
  });

  it("should close and create a new readline instances each time it's called", async function(this: Context) {
    const promise = this.inq.prompt({
      type: 'confirm',
      name: 'q1',
      message: 'message'
    });

    const rl1 = promise.ui.rl;
    rl1.emit('line');

    await promise;
    expect(rl1.close.called).to.equal(true);
    expect(rl1.output.end.called).to.equal(true);
    const promise2 = this.inq.prompt({
      type: 'confirm',
      name: 'q1',
      message: 'message'
    });
    const rl2 = promise2.ui.rl;
    rl2.emit('line');
    await promise2;
    expect(rl2.close.called).to.equal(true);
    expect(rl2.output.end.called).to.equal(true);
    expect(rl1).to.not.equal(rl2);
  });

  it('should take a prompts array and return answers', async function(this: Context) {
    const promise = this.inq.prompt([
      {
        type: 'confirm',
        name: 'q1',
        message: 'message'
      },
      {
        type: 'confirm',
        name: 'q2',
        message: 'message',
        default: false
      }
    ]);
    autosubmit(promise.ui);

    const answers = await promise;
    expect(answers.q1).to.equal(true);
    expect(answers.q2).to.equal(false);
  });

  it('should take a prompts array with nested names', async function(this: Context) {
    const promise = this.inq.prompt([
      {
        type: 'confirm',
        name: 'foo.bar.q1',
        message: 'message'
      },
      {
        type: 'confirm',
        name: 'foo.q2',
        message: 'message',
        default: false
      }
    ]);
    autosubmit(promise.ui);

    const answers = await promise;
    expect(answers).to.deep.equal({
      foo: {
        bar: {
          q1: true
        },
        q2: false
      }
    });
  });

  it('should take a single prompt and return answer', async function(this: Context) {
    const promise = this.inq.prompt({
      type: 'input',
      name: 'q1',
      message: 'message',
      default: 'bar'
    });

    promise.ui.rl.emit('line');
    const answers = await promise;
    expect(answers.q1).to.equal('bar');
  });

  it('should parse `message` if passed as a function', async function(this: Context) {
    const stubMessage = 'foo';

    const msgFunc = function(answers) {
      expect(answers.name1).to.equal('bar');
      return stubMessage;
    };

    const prompts = [
      {
        type: 'input',
        name: 'name1',
        message: 'message',
        default: 'bar'
      },
      {
        type: 'stub' as 'stub',
        name: 'name',
        message: msgFunc
      }
    ];

    const promise = this.inq.registerPrompt('stub', function(params) {
      this.opt = {
        when: () => true
      };
      this.run = stub().returns(Promise.resolve());
      expect(params.message).to.equal(stubMessage);
    }).prompt(prompts)
    promise.ui.rl.emit('line');
    promise.ui.rl.emit('line');
    await promise;
    // Ensure we're not overwriting original prompt values.
    expect(prompts[1].message).to.equal(msgFunc);
  });

  it('should run asynchronous `message`', function(this: Context, done) {
    const stubMessage = 'foo';
    const promise = this.inq.registerPrompt('stub', function(params) {
      this.opt = {
        when: () => true
      };
      this.run = stub().returns(Promise.resolve());
      expect(params.message).to.equal(stubMessage);
      done();
    }).prompt([
      {
        type: 'input',
        name: 'name1',
        message: 'message',
        default: 'bar'
      },
      {
        type: 'stub',
        name: 'name',
        message: function(answers) {
          expect(answers.name1).to.equal('bar');
          const goOn = this.async();
          setTimeout(() => {
            goOn(null, stubMessage);
          }, 0);
        }
      }
    ]);
    promise.ui.rl.emit('line');
  });

  it('should parse `default` if passed as a function', function(this: Context, done) {
    const stubDefault = 'foo';
    const promise = this.inq.registerPrompt('stub', function(params) {
      this.opt = {
        when: () => true
      };
      this.run = stub().returns(Promise.resolve());
      expect(params.default).to.equal(stubDefault);
      done();
    }).prompt([
      {
        type: 'input',
        name: 'name1',
        message: 'message',
        default: 'bar'
      },
      {
        type: 'stub',
        name: 'name',
        message: 'message',
        default: function(answers) {
          expect(answers.name1).to.equal('bar');
          return stubDefault;
        }
      }
    ]);
    promise.ui.rl.emit('line');
  });

  it('should run asynchronous `default`', function() {
    let goesInDefault = false;
    const input2Default = 'foo';
    let promise = this.prompt([
      {
        type: 'input',
        name: 'name1',
        message: 'message',
        default: 'bar'
      },
      {
        type: 'input2',
        name: 'q2',
        message: 'message',
        default: function(answers) {
          goesInDefault = true;
          expect(answers.name1).to.equal('bar');
          const goOn = this.async();
          setTimeout(() => {
            goOn(null, input2Default);
          }, 0);
          setTimeout(() => {
            promise.ui.rl.emit('line');
          }, 10);
        }
      }
    ]);
    promise.ui.rl.emit('line');

    return promise.then(answers => {
      expect(goesInDefault).to.equal(true);
      expect(answers.q2).to.equal(input2Default);
    });
  });

  it('should pass previous answers to the prompt constructor', function(this: Context, done) {
    const promise = this.inq.registerPrompt('stub', function(_params, _rl, answers) {
      this.run = stub().returns(Promise.resolve());
      expect(answers.name1).to.equal('bar');
      done();
    }).prompt([
      {
        type: 'input',
        name: 'name1',
        message: 'message',
        default: 'bar'
      },
      {
        type: 'stub',
        name: 'name',
        message: 'message'
      }
    ]);
    promise.ui.rl.emit('line');
  });

  it('should parse `choices` if passed as a function', function(this: Context, done) {
    const stubChoices = ['foo', 'bar'];
    const promise = this.inq.registerPrompt('stub', function({ choices }) {
      this.run = stub().returns(Promise.resolve());
      this.opt = {
        when: () => true
      };
      expect(choices).to.equal(stubChoices);
      done();
    }).prompt([
      {
        type: 'input',
        name: 'name1',
        message: 'message',
        default: 'bar'
      },
      {
        type: 'stub',
        name: 'name',
        message: 'message',
        choices: function(answers) {
          expect(answers.name1).to.equal('bar');
          return stubChoices;
        }
      }
    ]);
    promise.ui.rl.emit('line');
  });

  it('should returns a promise', function(this: Context, done) {
    const promise = this.inq.prompt({
      type: 'input',
      name: 'q1',
      message: 'message',
      default: 'bar'
    });
    promise.then(answers => {
      expect(answers.q1).to.equal('bar');
      done();
    });

    promise.ui.rl.emit('line');
  });

  it('should expose the Reactive interface', function(this: Context, done) {
    const promise = this.inq.prompt([
      {
        type: 'input',
        name: 'name1',
        message: 'message',
        default: 'bar'
      },
      {
        type: 'input',
        name: 'name',
        message: 'message',
        default: 'doe'
      }
    ]);
    const spy = _spy();
    promise.ui.process.subscribe(
      spy,
      function() {},
      function() {
        assert.calledWith(spy, { name: 'name1', answer: 'bar' });
        assert.calledWith(spy, { name: 'name', answer: 'doe' });
        done();
      }
    );

    autosubmit(promise.ui);
  });

  it('should expose the UI', function(this: Context, done) {
    const promise = this.inq.prompt([]);
    expect(promise.ui.answers).to.be.an('object');
    done();
  });

  it('takes an Observable as question', function() {
    const promise = this.prompt(Observable.create(function(obs) {
      obs.next({
        type: 'confirm',
        name: 'q1',
        message: 'message'
      });
      setTimeout(() => {
        obs.next({
          type: 'confirm',
          name: 'q2',
          message: 'message',
          default: false
        });
        obs.complete();
        promise.ui.rl.emit('line');
      }, 30);
    }));
    promise.ui.rl.emit('line');

    return promise.then(answers => {
      expect(answers.q1).to.equal(true);
      expect(answers.q2).to.equal(false);
    });
  });

  describe('hierarchical mode (`when`)', function() {
    it('should pass current answers to `when`', function() {
      const promise = this.prompt([
        {
          type: 'confirm',
          name: 'q1',
          message: 'message'
        },
        {
          name: 'q2',
          message: 'message',
          when: function(answers) {
            expect(answers).to.be.an('object');
            expect(answers.q1).to.equal(true);
          }
        }
      ]);

      autosubmit(promise.ui);
      return promise;
    });

    it('should run prompt if `when` returns true', function() {
      let goesInWhen = false;
      const promise = this.prompt([
        {
          type: 'confirm',
          name: 'q1',
          message: 'message'
        },
        {
          type: 'input',
          name: 'q2',
          message: 'message',
          default: 'bar-var',
          when: function() {
            goesInWhen = true;
            return true;
          }
        }
      ]);
      autosubmit(promise.ui);

      return promise.then(answers => {
        expect(goesInWhen).to.equal(true);
        expect(answers.q2).to.equal('bar-var');
      });
    });

    it('should run prompt if `when` is true', function() {
      const promise = this.prompt([
        {
          type: 'confirm',
          name: 'q1',
          message: 'message'
        },
        {
          type: 'input',
          name: 'q2',
          message: 'message',
          default: 'bar-var',
          when: true
        }
      ]);
      autosubmit(promise.ui);

      return promise.then(answers => {
        expect(answers.q2).to.equal('bar-var');
      });
    });

    it('should not run prompt if `when` returns false', function() {
      let goesInWhen = false;
      const promise = this.prompt([
        {
          type: 'confirm',
          name: 'q1',
          message: 'message'
        },
        {
          type: 'confirm',
          name: 'q2',
          message: 'message',
          when: function() {
            goesInWhen = true;
            return false;
          }
        },
        {
          type: 'input',
          name: 'q3',
          message: 'message',
          default: 'foo'
        }
      ]);
      autosubmit(promise.ui);

      return promise.then(answers => {
        expect(goesInWhen).to.equal(true);
        expect(answers.q2).to.equal(undefined);
        expect(answers.q3).to.equal('foo');
        expect(answers.q1).to.equal(true);
      });
    });

    it('should not run prompt if `when` is false', function() {
      const promise = this.prompt([
        {
          type: 'confirm',
          name: 'q1',
          message: 'message'
        },
        {
          type: 'confirm',
          name: 'q2',
          message: 'message',
          when: false
        },
        {
          type: 'input',
          name: 'q3',
          message: 'message',
          default: 'foo'
        }
      ]);
      autosubmit(promise.ui);

      return promise.then(answers => {
        expect(answers.q2).to.equal(undefined);
        expect(answers.q3).to.equal('foo');
        expect(answers.q1).to.equal(true);
      });
    });

    it('should run asynchronous `when`', function() {
      let goesInWhen = false;
      const promise = this.prompt([
        {
          type: 'confirm',
          name: 'q1',
          message: 'message'
        },
        {
          type: 'input',
          name: 'q2',
          message: 'message',
          default: 'foo-bar',
          when: function() {
            goesInWhen = true;
            const goOn = this.async();
            setTimeout(() => {
              goOn(null, true);
            }, 0);
            setTimeout(() => {
              promise.ui.rl.emit('line');
            }, 10);
          }
        }
      ]);
      autosubmit(promise.ui);

      return promise.then(answers => {
        expect(goesInWhen).to.equal(true);
        expect(answers.q2).to.equal('foo-bar');
      });
    });

    it('should get the value which set in `when` on returns false', function() {
      const promise = this.prompt([
        {
          name: 'q',
          message: 'message',
          when: function(answers) {
            answers.q = 'foo';
            return false;
          }
        }
      ]);
      autosubmit(promise.ui);

      return promise.then(answers => {
        expect(answers.q).to.equal('foo');
      });
    });
  });

  describe('#registerPrompt()', function() {
    it('registers new prompt types', function(this: Context, done) {
      const questions = [{ type: 'foo', message: 'something' }];
      this.inq.registerPrompt('foo', function(question, _rl, answers) {
        expect(question).to.eql(questions[0]);
        expect(answers).to.eql({});
        this.run = stub().returns(Promise.resolve());
        done();
      }).prompt(questions);
    });

    it('overwrite default prompt types', function(this: Context, done) {
      const questions = [{ type: 'confirm', message: 'something' }];
      this.inq.registerPrompt('confirm', function() {
        this.run = stub().returns(Promise.resolve());
        done();
      }).prompt(questions);
    });
  });

  describe('#restoreDefaultPrompts()', function() {
    it('restore default prompts', function(this: Context) {
      const ConfirmPrompt = this.inq.prompts.confirm;
      this.inq.registerPrompt('confirm', noop);
      this.inq.restoreDefaultPrompts();
      expect(ConfirmPrompt).to.equal(this.inq.prompts.confirm);
    });
  });

  // See: https://github.com/SBoudrias/Inquirer.js/pull/326
  it('does not throw exception if cli-width reports width of 0', async function(this: Context) {
    const original = (process.stdout as any).getWindowSize;
    (process.stdout as any).getWindowSize = () => ([0]);

    const promise = this.inq.prompt([
      {
        type: 'confirm',
        name: 'q1',
        message: 'message'
      }
    ]);
    promise.ui.rl.emit('line');

    const answers = await promise;
    (process.stdout as any).getWindowSize = original;
    expect(answers.q1).to.equal(true);
  });
});
