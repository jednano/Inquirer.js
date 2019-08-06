import { expect } from 'chai';
import { clone } from 'lodash';
import ReadlineStub from '../../helpers/readline';
import { checkbox } from '../../helpers/fixtures';

import Checkbox from '../../../lib/prompts/checkbox';

interface Context {
  fixture: typeof checkbox;
  rl: ReadlineStub;
  checkbox: Checkbox;
}

describe('`checkbox` prompt', function() {
  beforeEach(function(this: Context) {
    this.fixture = clone(checkbox);
    this.rl = new ReadlineStub();
    this.checkbox = new Checkbox(this.fixture, this.rl);
  });

  it('should return a single selected choice in an array', function(this: Context, done) {
    this.checkbox.run().then(answer => {
      expect(answer).to.be.an('array');
      expect(answer.length).to.equal(1);
      expect(answer[0]).to.equal('choice 1');
      done();
    });
    this.rl.input.emit('keypress', ' ', { name: 'space' });
    this.rl.emit('line');
  });

  it('should return multiples selected choices in an array', function(this: Context, done) {
    this.checkbox.run().then(answer => {
      expect(answer).to.be.an('array');
      expect(answer.length).to.equal(2);
      expect(answer[0]).to.equal('choice 1');
      expect(answer[1]).to.equal('choice 2');
      done();
    });
    this.rl.input.emit('keypress', ' ', { name: 'space' });
    this.rl.input.emit('keypress', null, { name: 'down' });
    this.rl.input.emit('keypress', ' ', { name: 'space' });
    this.rl.emit('line');
  });

  it('should check defaults choices', function(this: Context, done) {
    this.fixture.choices = [
      { name: '1', checked: true },
      { name: '2', checked: false },
      { name: '3', checked: false }
    ];
    this.checkbox = new Checkbox(this.fixture, this.rl);
    this.checkbox.run().then(answer => {
      expect(answer.length).to.equal(1);
      expect(answer[0]).to.equal('1');
      done();
    });
    this.rl.emit('line');
  });

  it('provide an array of checked choice to validate', function(this: Context) {
    this.fixture.choices = [
      { name: '1', checked: true },
      { name: '2', checked: 1 },
      { name: '3', checked: false }
    ];
    this.fixture.validate = function(answer) {
      expect(answer).to.eql(['1', '2']);
      return true;
    };

    this.checkbox = new Checkbox(this.fixture, this.rl);
    var promise = this.checkbox.run();
    this.rl.emit('line');
    return promise;
  });

  it('should check defaults choices if given as array of values', function(this: Context, done) {
    this.fixture.choices = [{ name: '1' }, { name: '2' }, { name: '3' }];
    this.fixture.default = ['1', '3'];
    this.checkbox = new Checkbox(this.fixture, this.rl);
    this.checkbox.run().then(answer => {
      expect(answer.length).to.equal(2);
      expect(answer[0]).to.equal('1');
      expect(answer[1]).to.equal('3');
      done();
    });
    this.rl.emit('line');
  });

  it('should toggle choice when hitting space', function(this: Context, done) {
    this.checkbox.run().then(answer => {
      expect(answer.length).to.equal(1);
      expect(answer[0]).to.equal('choice 1');
      done();
    });
    this.rl.input.emit('keypress', ' ', { name: 'space' });
    this.rl.input.emit('keypress', null, { name: 'down' });
    this.rl.input.emit('keypress', ' ', { name: 'space' });
    this.rl.input.emit('keypress', ' ', { name: 'space' });
    this.rl.emit('line');
  });

  it('should allow for arrow navigation', function(this: Context, done) {
    this.checkbox.run().then(answer => {
      expect(answer.length).to.equal(1);
      expect(answer[0]).to.equal('choice 2');
      done();
    });

    this.rl.input.emit('keypress', null, { name: 'down' });
    this.rl.input.emit('keypress', null, { name: 'down' });
    this.rl.input.emit('keypress', null, { name: 'up' });

    this.rl.input.emit('keypress', ' ', { name: 'space' });
    this.rl.emit('line');
  });

  it('should allow for vi-style navigation', function(this: Context, done) {
    this.checkbox.run().then(answer => {
      expect(answer.length).to.equal(1);
      expect(answer[0]).to.equal('choice 2');
      done();
    });

    this.rl.input.emit('keypress', 'j', { name: 'j' });
    this.rl.input.emit('keypress', 'j', { name: 'j' });
    this.rl.input.emit('keypress', 'k', { name: 'k' });

    this.rl.input.emit('keypress', ' ', { name: 'space' });
    this.rl.emit('line');
  });

  it('should allow for emacs-style navigation', function(this: Context, done) {
    this.checkbox.run().then(answer => {
      expect(answer.length).to.equal(1);
      expect(answer[0]).to.equal('choice 2');
      done();
    });

    this.rl.input.emit('keypress', 'n', { name: 'n', ctrl: true });
    this.rl.input.emit('keypress', 'n', { name: 'n', ctrl: true });
    this.rl.input.emit('keypress', 'p', { name: 'p', ctrl: true });

    this.rl.input.emit('keypress', ' ', { name: 'space' });
    this.rl.emit('line');
  });

  it('should allow 1-9 shortcut key', function(this: Context, done) {
    this.checkbox.run().then(answer => {
      expect(answer.length).to.equal(1);
      expect(answer[0]).to.equal('choice 2');
      done();
    });

    this.rl.input.emit('keypress', '2');
    this.rl.emit('line');
  });

  it('should select all answers if <a> is pressed', async function(this: Context) {
    var promise = this.checkbox.run();

    this.rl.input.emit('keypress', 'a', { name: 'a' });
    this.rl.emit('line');

    const answer = await promise;
    expect(answer.length).to.equal(3);
  });

  it('should select no answers if <a> is pressed a second time', async function(this: Context) {
    var promise = this.checkbox.run();

    this.rl.input.emit('keypress', 'a', { name: 'a' });
    this.rl.input.emit('keypress', 'a', { name: 'a' });
    this.rl.emit('line');

    const answer = await promise;
    expect(answer.length).to.equal(0);
  });

  it('should select the inverse of the current selection when <i> is pressed', async function(this: Context) {
    var promise = this.checkbox.run();

    this.rl.input.emit('keypress', 'i', { name: 'i' });
    this.rl.emit('line');

    const answer = await promise;
    expect(answer.length).to.equal(3);
  });

  describe('with disabled choices', function(this: Context) {
    beforeEach(function() {
      this.fixture.choices.push({
        name: 'dis1',
        disabled: true
      });
      this.fixture.choices.push({
        name: 'dis2',
        disabled: 'uh oh'
      });
      this.checkbox = new Checkbox(this.fixture, this.rl);
    });

    it('output disabled choices and custom messages', async function(this: Context) {
      var promise = this.checkbox.run();
      this.rl.emit('line');
      await promise;
      expect(this.rl.output.__raw__).to.contain('- dis1 (Disabled)');
      expect(this.rl.output.__raw__).to.contain('- dis2 (uh oh)');
    });

    it('skip disabled choices', function(this: Context, done) {
      this.checkbox.run().then(answer => {
        expect(answer[0]).to.equal('choice 1');
        done();
      });
      this.rl.input.emit('keypress', null, { name: 'down' });
      this.rl.input.emit('keypress', null, { name: 'down' });
      this.rl.input.emit('keypress', null, { name: 'down' });

      this.rl.input.emit('keypress', ' ', { name: 'space' });
      this.rl.emit('line');
    });

    it("uncheck defaults choices who're disabled", function(this: Context, done) {
      this.fixture.choices = [
        { name: '1', checked: true, disabled: true },
        { name: '2' }
      ];
      this.checkbox = new Checkbox(this.fixture, this.rl);
      this.checkbox.run().then(answer => {
        expect(answer.length).to.equal(0);
        done();
      });
      this.rl.emit('line');
    });

    it('disabled can be a function', function(this: Context) {
      this.fixture.choices = [
        {
          name: 'dis1',
          disabled: function(answers) {
            expect(answers.foo).to.equal('foo');
            return true;
          }
        }
      ];
      this.checkbox = new Checkbox(this.fixture, this.rl, { foo: 'foo' });
      var promise = this.checkbox.run();
      this.rl.emit('line');

      promise.then(() => {
        expect(this.rl.output.__raw__).to.contain('- dis1 (Disabled)');
      });
    });
  });
});
