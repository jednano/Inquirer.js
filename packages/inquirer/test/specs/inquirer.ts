/**
 * Inquirer public API test
 */

import { expect } from 'chai';
import { stub, spy as _spy, assert } from 'sinon';
import { noop } from 'lodash';
import { Observable } from 'rxjs';
import {
  createPromptModule,
  registerPrompt,
  prompt as _prompt,
  restoreDefaultPrompts
} from '../../lib/inquirer';
import { autosubmit } from '../helpers/events';

interface Context {
  prompt: ReturnType<typeof createPromptModule>;
}

describe('inquirer.prompt', function() {
  beforeEach(function(this: Context) {
    this.prompt = createPromptModule();
  });

  it("should close and create a new readline instances each time it's called", function(this: Context) {
    var ctx = this;

    var promise = this.prompt({
      type: 'confirm',
      name: 'q1',
      message: 'message'
    });

    const rl1 = promise.ui.rl;
    rl1.emit('line');

    return promise.then(() => {
      expect(rl1.close.called).to.equal(true);
      expect(rl1.output.end.called).to.equal(true);

      var promise2 = ctx.prompt({
        type: 'confirm',
        name: 'q1',
        message: 'message'
      });

      const rl2 = promise2.ui.rl;
      rl2.emit('line');

      return promise2.then(() => {
        expect(rl2.close.called).to.equal(true);
        expect(rl2.output.end.called).to.equal(true);

        expect(rl1).to.not.equal(rl2);
      });
    });
  });

  it('should take a prompts array and return answers', function(this: Context) {
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
        default: false
      }
    ]);
    autosubmit(promise.ui);

    return promise.then(answers => {
      expect(answers.q1).to.equal(true);
      expect(answers.q2).to.equal(false);
    });
  });

  it('should take a prompts array with nested names', function(this: Context) {
    const promise = this.prompt([
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

    return promise.then(answers => {
      expect(answers).to.deep.equal({
        foo: {
          bar: {
            q1: true
          },
          q2: false
        }
      });
    });
  });

  it('should take a single prompt and return answer', function(this: Context) {
    const promise = this.prompt({
      type: 'input',
      name: 'q1',
      message: 'message',
      default: 'bar'
    });

    promise.ui.rl.emit('line');
    return promise.then(answers => {
      expect(answers.q1).to.equal('bar');
    });
  });

  it('should parse `message` if passed as a function', function(this: Context) {
    var stubMessage = 'foo';
    this.prompt.registerPrompt('stub', function(params) {
      this.opt = {
        when: () => true
      };
      this.run = stub().returns(Promise.resolve());
      expect(params.message).to.equal(stubMessage);
    });

    const msgFunc = function(answers) {
      expect(answers.name1).to.equal('bar');
      return stubMessage;
    };

    var promise = this.prompt([
      {
        type: 'input',
        name: 'name1',
        message: 'message',
        default: 'bar'
      },
      {
        type: 'stub',
        name: 'name',
        message: msgFunc
      }
    ]);
    promise.ui.rl.emit('line');
    promise.ui.rl.emit('line');
    return promise.then(() => {
      // Ensure we're not overwriting original prompt values.
      expect(prompts[1].message).to.equal(msgFunc);
    });
  });

  it('should run asynchronous `message`', function(this: Context, done) {
    var stubMessage = 'foo';
    this.prompt.registerPrompt('stub', function(params) {
      this.opt = {
        when: () => true
      };
      this.run = stub().returns(Promise.resolve());
      expect(params.message).to.equal(stubMessage);
      done();
    });

    var promise = this.prompt([
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
          var goOn = this.async();
          setTimeout(() => {
            goOn(null, stubMessage);
          }, 0);
        }
      }
    ]);
    promise.ui.rl.emit('line');
  });

  it('should parse `default` if passed as a function', function(this: Context, done) {
    var stubDefault = 'foo';
    this.prompt.registerPrompt('stub', function(params) {
      this.opt = {
        when: () => true
      };
      this.run = stub().returns(Promise.resolve());
      expect(params.default).to.equal(stubDefault);
      done();
    });

    const promise = this.prompt([
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
    var goesInDefault = false;
    var input2Default = 'foo';
    var promise;
    var prompts = [
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
          var goOn = this.async();
          setTimeout(() => {
            goOn(null, input2Default);
          }, 0);
          setTimeout(() => {
            promise.ui.rl.emit('line');
          }, 10);
        }
      }
    ];

    promise = this.prompt(prompts);
    promise.ui.rl.emit('line');

    return promise.then(answers => {
      expect(goesInDefault).to.equal(true);
      expect(answers.q2).to.equal(input2Default);
    });
  });

  it('should pass previous answers to the prompt constructor', function(this: Context, done) {
    const promptWithStub = this.prompt.registerPrompt('stub', function(_params, _rl, answers) {
      this.run = stub().returns(Promise.resolve());
      expect(answers.name1).to.equal('bar');
      done();
    });

    var promise = promptWithStub([
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
    var stubChoices = ['foo', 'bar'];
    this.prompt.registerPrompt('stub', function({ choices }) {
      this.run = stub().returns(Promise.resolve());
      this.opt = {
        when: () => true
      };
      expect(choices).to.equal(stubChoices);
      done();
    });

    var promise = this.prompt([
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
    var promise = this.prompt({
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
    const promise = this.prompt([
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
    var spy = _spy();
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
    var promise = this.prompt([]);
    expect(promise.ui.answers).to.be.an('object');
    done();
  });

  it('takes an Observable as question', function() {
    var promise;
    var prompts = Observable.create(function(obs) {
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
    });

    promise = this.prompt(prompts);
    promise.ui.rl.emit('line');

    return promise.then(answers => {
      expect(answers.q1).to.equal(true);
      expect(answers.q2).to.equal(false);
    });
  });

  describe('hierarchical mode (`when`)', function() {
    it('should pass current answers to `when`', function() {
      var prompts = [
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
      ];

      var promise = this.prompt(prompts);

      autosubmit(promise.ui);
      return promise;
    });

    it('should run prompt if `when` returns true', function() {
      var goesInWhen = false;
      var prompts = [
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
      ];

      var promise = this.prompt(prompts);
      autosubmit(promise.ui);

      return promise.then(answers => {
        expect(goesInWhen).to.equal(true);
        expect(answers.q2).to.equal('bar-var');
      });
    });

    it('should run prompt if `when` is true', function() {
      var prompts = [
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
      ];

      var promise = this.prompt(prompts);
      autosubmit(promise.ui);

      return promise.then(answers => {
        expect(answers.q2).to.equal('bar-var');
      });
    });

    it('should not run prompt if `when` returns false', function() {
      var goesInWhen = false;
      var prompts = [
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
      ];

      var promise = this.prompt(prompts);
      autosubmit(promise.ui);

      return promise.then(answers => {
        expect(goesInWhen).to.equal(true);
        expect(answers.q2).to.equal(undefined);
        expect(answers.q3).to.equal('foo');
        expect(answers.q1).to.equal(true);
      });
    });

    it('should not run prompt if `when` is false', function() {
      var prompts = [
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
      ];

      var promise = this.prompt(prompts);
      autosubmit(promise.ui);

      return promise.then(answers => {
        expect(answers.q2).to.equal(undefined);
        expect(answers.q3).to.equal('foo');
        expect(answers.q1).to.equal(true);
      });
    });

    it('should run asynchronous `when`', function() {
      var promise;
      var goesInWhen = false;
      var prompts = [
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
            var goOn = this.async();
            setTimeout(() => {
              goOn(null, true);
            }, 0);
            setTimeout(() => {
              promise.ui.rl.emit('line');
            }, 10);
          }
        }
      ];

      promise = this.prompt(prompts);
      autosubmit(promise.ui);

      return promise.then(answers => {
        expect(goesInWhen).to.equal(true);
        expect(answers.q2).to.equal('foo-bar');
      });
    });

    it('should get the value which set in `when` on returns false', function() {
      var prompts = [
        {
          name: 'q',
          message: 'message',
          when: function(answers) {
            answers.q = 'foo';
            return false;
          }
        }
      ];

      var promise = this.prompt(prompts);
      autosubmit(promise.ui);

      return promise.then(answers => {
        expect(answers.q).to.equal('foo');
      });
    });
  });

  describe('#registerPrompt()', function() {
    it('register new prompt types', function(this: Context, done) {
      var questions = [{ type: 'foo', message: 'something' }];
      registerPrompt('foo', function(question, _rl, answers) {
        expect(question).to.eql(questions[0]);
        expect(answers).to.eql({});
        this.run = stub().returns(Promise.resolve());
        done();
      });

      _prompt(questions);
    });

    it('overwrite default prompt types', function(this: Context, done) {
      var questions = [{ type: 'confirm', message: 'something' }];
      registerPrompt('confirm', function() {
        this.run = stub().returns(Promise.resolve());
        done();
      });

      _prompt(questions);
      restoreDefaultPrompts();
    });
  });

  describe('#restoreDefaultPrompts()', function() {
    it('restore default prompts', function() {
      var ConfirmPrompt = _prompt.prompts.confirm;
      registerPrompt('confirm', noop);
      restoreDefaultPrompts();
      expect(ConfirmPrompt).to.equal(_prompt.prompts.confirm);
    });
  });

  // See: https://github.com/SBoudrias/Inquirer.js/pull/326
  it('does not throw exception if cli-width reports width of 0', function() {
    var original = process.stdout.getWindowSize;
    process.stdout.getWindowSize = function() {
      return [0];
    };

    var prompt = createPromptModule();

    var promise = prompt([
      {
        type: 'confirm',
        name: 'q1',
        message: 'message'
      }
    ]);
    promise.ui.rl.emit('line');

    return promise.then(answers => {
      process.stdout.getWindowSize = original;
      expect(answers.q1).to.equal(true);
    });
  });
});
