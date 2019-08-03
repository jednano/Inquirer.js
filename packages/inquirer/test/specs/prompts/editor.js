import { expect } from 'chai';
import { clone } from 'lodash';
import ReadlineStub from '../../helpers/readline';
import { editor } from '../../helpers/fixtures';

import Editor from '../../../lib/prompts/editor';

describe('`editor` prompt', function() {
  beforeEach(function() {
    this.previousVisual = process.env.VISUAL;
    // Writes the word "testing" to the file
    process.env.VISUAL = 'node ./test/bin/write.js testing';
    this.fixture = clone(editor);
    this.rl = new ReadlineStub();
  });

  afterEach(function() {
    process.env.VISUAL = this.previousVisual;
  });

  it('should retrieve temporary files contents', function() {
    var prompt = new Editor(this.fixture, this.rl);

    var promise = prompt.run();
    this.rl.emit('line', '');

    return promise.then(answer => {
      return expect(answer).to.equal('testing');
    });
  });
});
