import stripAnsi from 'strip-ansi';
import { expect } from 'chai';
import { clone } from 'lodash';
import ReadlineStub from '../../helpers/readline';
import { password as _password } from '../../helpers/fixtures';

import Password from '../../../lib/prompts/password';

interface Context {
  fixture: typeof _password;
  rl: any;
}

function testMasking(rl, mask) {
  return function(answer) {
    expect(answer).to.equal('Inquirer');
    var expectOutput = expect(stripAnsi(rl.output.__raw__));
    if (mask) {
      expectOutput.to.contain(mask);
    } else {
      expectOutput.to.not.contain('********');
    }
  };
}

describe('`password` prompt', function() {
  beforeEach(function(this: Context) {
    this.fixture = clone(_password);
    this.rl = new ReadlineStub();
  });

  it('should use raw value from the user without masking', function(this: Context) {
    var password = new Password(this.fixture, this.rl);
    var promise = password.run().then(testMasking(this.rl, false));

    this.rl.emit('line', 'Inquirer');
    return promise;
  });

  it('should mask the input with "*" if the `mask` option was provided by the user was `true`', function(this: Context) {
    this.fixture.mask = true;
    var password = new Password(this.fixture, this.rl);
    var promise = password.run().then(testMasking(this.rl, '********'));

    this.rl.emit('line', 'Inquirer');
    return promise;
  });

  it('should mask the input if a `mask` string was provided by the user', function(this: Context) {
    this.fixture.mask = '#';
    var password = new Password(this.fixture, this.rl);
    var promise = password.run().then(testMasking(this.rl, '########'));

    this.rl.emit('line', 'Inquirer');
    return promise;
  });

  it('Preserves default', function(this: Context) {
    this.fixture.default = 'Inquirer';
    var password = new Password(this.fixture, this.rl);
    var promise = password.run().then(answer => expect(answer).to.equal('Inquirer'));
    this.rl.emit('line', '');
    return promise;
  });

  it('Clears default on keypress', function(this: Context) {
    this.fixture.default = 'Inquirer';
    var password = new Password(this.fixture, this.rl);
    var promise = password.run().then(answer => expect(answer).to.equal(''));
    password.onKeypress({ key: { name: 'backspace' }});
    this.rl.emit('line', '');
    return promise;
  });
});
