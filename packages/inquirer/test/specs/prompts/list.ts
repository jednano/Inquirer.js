import { expect } from 'chai';
import { clone } from 'lodash';
import ReadlineStub from '../../helpers/readline';
import { list as _list } from '../../helpers/fixtures';

import List from '../../../lib/prompts/list';

interface Context {
  fixture: typeof _list;
  rl: any;
  list: List;
}

describe('`list` prompt', function() {
  beforeEach(function(this: Context) {
    this.fixture = clone(_list);
    this.rl = new ReadlineStub();
    this.list = new List(this.fixture, this.rl);
  });

  it('should default to first choice', function(this: Context, done) {
    this.list.run().then(answer => {
      expect(answer).to.equal('foo');
      done();
    });

    this.rl.emit('line');
  });

  it('should move selected cursor on keypress', function(this: Context, done) {
    this.list.run().then(answer => {
      expect(answer).to.equal('bar');
      done();
    });

    this.rl.input.emit('keypress', '', { name: 'down' });
    this.rl.emit('line');
  });

  it('should allow for arrow navigation', function(this: Context, done) {
    this.list.run().then(answer => {
      expect(answer).to.equal('bar');
      done();
    });

    this.rl.input.emit('keypress', '', { name: 'down' });
    this.rl.input.emit('keypress', '', { name: 'down' });
    this.rl.input.emit('keypress', '', { name: 'up' });
    this.rl.emit('line');
  });

  it('should allow for vi-style navigation', function(this: Context, done) {
    this.list.run().then(answer => {
      expect(answer).to.equal('bar');
      done();
    });

    this.rl.input.emit('keypress', 'j', { name: 'j' });
    this.rl.input.emit('keypress', 'j', { name: 'j' });
    this.rl.input.emit('keypress', 'k', { name: 'k' });
    this.rl.emit('line');
  });

  it('should allow for emacs-style navigation', function(this: Context, done) {
    this.list.run().then(answer => {
      expect(answer).to.equal('bar');
      done();
    });

    this.rl.input.emit('keypress', 'n', { name: 'n', ctrl: true });
    this.rl.input.emit('keypress', 'n', { name: 'n', ctrl: true });
    this.rl.input.emit('keypress', 'p', { name: 'p', ctrl: true });
    this.rl.emit('line');
  });

  it('should loop the choices when going out of boundaries', function() {
    var promise1 = this.list.run().then(answer => {
      expect(answer).to.equal('bar');
    });

    this.rl.input.emit('keypress', '', { name: 'up' });
    this.rl.input.emit('keypress', '', { name: 'up' });
    this.rl.emit('line');

    return promise1.then(() => {
      this.list.selected = 0; // Reset
      var promise2 = this.list.run().then(answer => {
        expect(answer).to.equal('foo');
      });

      this.rl.input.emit('keypress', '', { name: 'down' });
      this.rl.input.emit('keypress', '', { name: 'down' });
      this.rl.input.emit('keypress', '', { name: 'down' });
      this.rl.emit('line');
      return promise2;
    });
  });

  it('should require a choices array', function() {
    expect(() => {
      return new List({ name: 'foo', message: 'bar' });
    }).to.throw(/choices/);
  });

  it('should allow a numeric default', function(this: Context, done) {
    this.fixture.default = 1;
    var list = new List(this.fixture, this.rl);

    list.run().then(answer => {
      expect(answer).to.equal('bar');
      done();
    });

    this.rl.emit('line');
  });

  it('should work from a numeric default being the index', function(this: Context, done) {
    this.fixture.default = 1;
    var list = new List(this.fixture, this.rl);

    list.run().then(answer => {
      expect(answer).to.equal('bum');
      done();
    });

    this.rl.input.emit('keypress', '', { name: 'down' });
    this.rl.emit('line');
  });

  it('should allow a string default being the value', function(this: Context, done) {
    this.fixture.default = 'bar';
    var list = new List(this.fixture, this.rl);

    list.run().then(answer => {
      expect(answer).to.equal('bar');
      done();
    });

    this.rl.emit('line');
  });

  it('should work from a string default', function(this: Context, done) {
    this.fixture.default = 'bar';
    var list = new List(this.fixture, this.rl);

    list.run().then(answer => {
      expect(answer).to.equal('bum');
      done();
    });

    this.rl.input.emit('keypress', '', { name: 'down' });
    this.rl.emit('line');
  });

  it("shouldn't allow an invalid string default to change position", function(this: Context, done) {
    this.fixture.default = 'babar';
    var list = new List(this.fixture, this.rl);

    list.run().then(answer => {
      expect(answer).to.equal('foo');
      done();
    });

    this.rl.emit('line');
  });

  it("shouldn't allow an invalid index as default", function(this: Context, done) {
    this.fixture.default = 4;
    var list = new List(this.fixture, this.rl);

    list.run().then(answer => {
      expect(answer).to.equal('foo');
      done();
    });

    this.rl.emit('line');
  });

  it('should allow 1-9 shortcut key', function(this: Context, done) {
    this.list.run().then(answer => {
      expect(answer).to.equal('bar');
      done();
    });

    this.rl.input.emit('keypress', '2');
    this.rl.emit('line');
  });
});
