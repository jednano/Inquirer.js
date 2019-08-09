/**
 * Test Prompt public APIs
 */

import { expect } from 'chai';
import { each, clone } from 'lodash';
import * as fixtures from '../helpers/fixtures';
import ReadlineStub from '../helpers/readline';
import Inquirer, { prompts as _prompts, Separator } from '../../lib/inquirer';
import { autosubmit } from '../helpers/events';

// Define prompts and their public API
var prompts = [
  {
    name: 'input',
    apis: ['filter', 'validate', 'default', 'message', 'requiredValues']
  },
  {
    name: 'confirm',
    apis: ['message', 'requiredValues']
  },
  {
    name: 'rawlist',
    apis: ['filter', 'message', 'choices', 'requiredValues']
  },
  {
    name: 'list',
    apis: ['filter', 'message', 'choices', 'requiredValues']
  },
  {
    name: 'expand',
    apis: ['requiredValues', 'message']
  },
  {
    name: 'checkbox',
    apis: ['requiredValues', 'message', 'choices', 'filter', 'validate']
  },
  {
    name: 'password',
    apis: ['requiredValues', 'message', 'filter', 'validate', 'default']
  }
];

interface Context {
  fixture: any;
  Prompt: any;
  rl: ReadlineStub;
}

// Define tests
var tests = {
  filter: function() {
    describe('filter API', function() {
      it('should filter the user input', function(this: Context, done) {
        this.fixture.filter = () => 'pass';

        var prompt = new this.Prompt(this.fixture, this.rl);
        prompt.run().then(answer => {
          expect(answer).to.equal('pass');
          done();
        });

        this.rl.emit('line', '');
      });

      it('should allow filter function to be asynchronous', function(this: Context, done) {
        this.fixture.filter = function() {
          var done = this.async();
          setTimeout(() => {
            done(null, 'pass');
          }, 0);
        };

        var prompt = new this.Prompt(this.fixture, this.rl);
        prompt.run().then(answer => {
          expect(answer).to.equal('pass');
          done();
        });

        this.rl.emit('line', '');
      });

      it('should handle errors produced in async filters', function(this: Context) {
        var called = 0;
        var rl = this.rl;

        this.fixture.filter = function() {
          called++;
          var cb = this.async();

          if (called === 2) {
            return cb(null, 'pass');
          }

          rl.emit('line');
          return cb(new Error('fail'));
        };

        var prompt = new this.Prompt(this.fixture, this.rl);
        var promise = prompt.run();

        this.rl.emit('line');
        return promise;
      });

      it('should pass previous answers to the prompt filter function', async function(this: Context) {
        var inq = new Inquirer();

        var promise = inq.prompt([
          {
            type: 'confirm',
            name: 'q1',
            message: 'message'
          },
          {
            type: 'confirm',
            name: 'q2',
            message: 'message',
            filter: function(input, answers) {
              expect(answers.q1).to.equal(true);
              return input;
            },
            default: false
          } as any
        ]);
        autosubmit(promise.ui);

        const answers = await promise;
        expect(answers.q1).to.equal(true);
        expect(answers.q2).to.equal(false);
      });
    });
  },

  validate: function() {
    describe('validate API', function() {
      it('should reject input if boolean false is returned', function(this: Context) {
        var called = 0;

        this.fixture.validate = () => {
          called++;
          // Make sure returning false won't continue
          if (called === 2) {
            return true;
          }

          this.rl.emit('line');
          return false;
        };

        var prompt = new this.Prompt(this.fixture, this.rl);
        var promise = prompt.run();

        this.rl.emit('line');
        return promise;
      });

      it('should reject input if a string is returned', function(this: Context, done) {
        var self = this;
        var called = 0;
        var errorMessage = 'uh oh, error!';

        this.fixture.validate = function() {
          called++;
          // Make sure returning false won't continue
          if (called === 2) {
            done();
            return;
          }

          self.rl.emit('line');
          return errorMessage;
        };

        var prompt = new this.Prompt(this.fixture, this.rl);
        prompt.run();

        this.rl.emit('line');
      });

      it('should reject input if a Promise is returned which rejects', function(this: Context, done) {
        var self = this;
        var called = 0;
        var errorMessage = 'uh oh, error!';

        this.fixture.validate = function() {
          called++;
          // Make sure returning false won't continue
          if (called === 2) {
            done();
            return;
          }

          self.rl.emit('line');
          return Promise.reject(errorMessage);
        };

        var prompt = new this.Prompt(this.fixture, this.rl);
        prompt.run();

        this.rl.emit('line');
      });

      it('should accept input if boolean true is returned', function(this: Context) {
        var called = 0;

        this.fixture.validate = function() {
          called++;
          return true;
        };

        var prompt = new this.Prompt(this.fixture, this.rl);
        var promise = prompt.run().then(() => {
          expect(called).to.equal(1);
        });

        this.rl.emit('line');
        return promise;
      });

      it('should allow validate function to be asynchronous', function(this: Context) {
        var self = this;
        var called = 0;

        this.fixture.validate = function() {
          var done = this.async();
          setTimeout(() => {
            called++;
            // Make sure returning false won't continue
            if (called === 2) {
              done(null, true);
            } else {
              self.rl.emit('line');
            }

            done(false);
          }, 0);
        };

        var prompt = new this.Prompt(this.fixture, this.rl);
        var promise = prompt.run();

        this.rl.emit('line');
        return promise;
      });

      it('should allow validate function to return a Promise', function(this: Context) {
        this.fixture.validate = function() {
          return Promise.resolve(true);
        };

        var prompt = new this.Prompt(this.fixture, this.rl);
        var promise = prompt.run();

        this.rl.emit('line');
        return promise;
      });

      it('should pass previous answers to the prompt validation function', async function(this: Context) {
        const inq = new Inquirer();

        const promise = inq.prompt([
          {
            type: 'confirm',
            name: 'q1',
            message: 'message'
          },
          {
            type: 'confirm',
            name: 'q2',
            message: 'message',
            validate: function(input, answers) {
              expect(answers.q1).to.equal(true);
              return true;
            },
            default: false
          } as any,
        ]);
        autosubmit(promise.ui);

        const answers = await promise;
        expect(answers.q1).to.equal(true);
        expect(answers.q2).to.equal(false);
      });
    });
  },

  default: function() {
    describe('default API', function() {
      it('should allow a default value', function(this: Context, done) {
        this.fixture.default = 'pass';

        var prompt = new this.Prompt(this.fixture, this.rl);
        prompt.run().then(answer => {
          expect(this.rl.output.__raw__).to.contain('(pass)');
          expect(answer).to.equal('pass');
          done();
        });

        this.rl.emit('line', '');
      });

      it('should allow a falsy default value', function(this: Context, done) {
        this.fixture.default = 0;

        var prompt = new this.Prompt(this.fixture, this.rl);
        prompt.run().then(answer => {
          expect(this.rl.output.__raw__).to.contain('(0)');
          expect(answer).to.equal(0);
          done();
        });

        this.rl.emit('line', '');
      });
    });
  },

  message: function() {
    describe('message API', function() {
      it('should print message on screen', function(this: Context) {
        this.fixture.message = 'Foo bar bar foo bar';

        var prompt = new this.Prompt(this.fixture, this.rl);
        prompt.run();

        expect(this.rl.output.__raw__).to.contain(this.fixture.message);
      });
      it('should default to name for message', function() {
        this.fixture.name = 'testfoobarbarfoobar';
        delete this.fixture.message;

        var prompt = new this.Prompt(this.fixture, this.rl);
        prompt.run();

        expect(this.rl.output.__raw__).to.contain(this.fixture.name + ':');
      });
    });
  },

  choices: function() {
    describe('choices API', function() {
      it('should print choices to screen', function(this: Context) {
        var prompt = new this.Prompt(this.fixture, this.rl);
        var choices = prompt.opt.choices;

        prompt.run();

        each(choices.filter(Separator.exclude), choice => {
          expect(this.rl.output.__raw__).to.contain(choice.name);
        });
      });
    });
  },

  requiredValues: function() {
    describe('Missing value', function() {
      it('`name` should throw', function(this: Context) {
        expect(() => {
          delete this.fixture.name;
          return new this.Prompt(this.fixture, this.rl);
        }).to.throw(/name/);
      });
    });
  }
};

// Run tests
describe('Prompt public APIs', function() {
  each(prompts, function(detail) {
    describe('on ' + detail.name + ' prompt', function() {
      beforeEach(function(this: Context) {
        this.fixture = clone(fixtures[detail.name]);
        this.Prompt = prompts[detail.name];
        this.rl = new ReadlineStub();
      });

      each(detail.apis, function(apiName) {
        tests[apiName](detail.name);
      });
    });
  });
});
