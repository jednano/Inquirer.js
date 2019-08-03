import { expect } from 'chai';
import { clone } from 'lodash';
import ReadlineStub from '../../helpers/readline';
import { confirm } from '../../helpers/fixtures';

import Confirm, { prototype } from '../../../lib/prompts/confirm';

describe('`confirm` prompt', function() {
  beforeEach(function() {
    this.fixture = clone(confirm);
    this.rl = new ReadlineStub();
    this.confirm = new Confirm(this.fixture, this.rl);
  });

  afterEach(function() {
    prototype.write = this._write;
  });

  it('should default to true', function(done) {
    this.confirm.run().then(answer => {
      expect(this.rl.output.__raw__).to.contain('Y/n');
      expect(answer).to.equal(true);
      done();
    });

    this.rl.emit('line', '');
  });

  it('should allow a default `false` value', function(done) {
    this.fixture.default = false;
    var falseConfirm = new Confirm(this.fixture, this.rl);

    falseConfirm.run().then(answer => {
      expect(this.rl.output.__raw__).to.contain('y/N');
      expect(answer).to.equal(false);
      done();
    });

    this.rl.emit('line', '');
  });

  it('should allow a default `true` value', function(done) {
    this.fixture.default = true;
    var falseConfirm = new Confirm(this.fixture, this.rl);

    falseConfirm.run().then(answer => {
      expect(this.rl.output.__raw__).to.contain('Y/n');
      expect(answer).to.equal(true);
      done();
    });

    this.rl.emit('line', '');
  });

  it("should parse 'Y' value to boolean true", function(done) {
    this.confirm.run().then(answer => {
      expect(answer).to.equal(true);
      done();
    });

    this.rl.emit('line', 'Y');
  });

  it("should parse 'Yes' value to boolean true", function(done) {
    this.confirm.run().then(answer => {
      expect(answer).to.equal(true);
      done();
    });

    this.rl.emit('line', 'Yes');
  });

  it("should parse 'No' value to boolean false", function(done) {
    this.confirm.run().then(answer => {
      expect(answer).to.equal(false);
      done();
    });

    this.rl.emit('line', 'No');
  });

  it('should parse every other string value to boolean false', function(done) {
    this.confirm.run().then(answer => {
      expect(answer).to.equal(false);
      done();
    });

    this.rl.emit('line', 'bla bla foo');
  });
});
