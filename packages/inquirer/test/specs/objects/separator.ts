import { expect } from 'chai';
import stripAnsi from 'strip-ansi';

import Separator, { exclude } from '../../../lib/objects/separator';
import { Separator as _Separator } from '../../../lib/inquirer';

describe('Separator constructor', function() {
  it('should set a default', function() {
    var sep = new Separator();
    expect(stripAnsi(sep.toString())).to.equal('──────────────');
  });

  it('should set user input as separator', function() {
    var sep = new Separator('foo bar');
    expect(stripAnsi(sep.toString())).to.equal('foo bar');
  });

  it('instances should be stringified when appended to a string', function() {
    var sep = new Separator('foo bar');
    expect(stripAnsi(String(sep))).to.equal('foo bar');
  });

  it('should be exposed on Inquirer object', function() {
    expect(_Separator).to.equal(Separator);
  });

  it('should expose a helper function to check for separator', function() {
    expect(exclude({})).to.equal(true);
    expect(exclude(new Separator())).to.equal(false);
  });

  it("give the type 'separator' to its object", function() {
    var sep = new Separator();
    expect(sep.type).to.equal('separator');
  });
});
