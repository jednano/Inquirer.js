import { expect } from 'chai';
import { clone } from 'lodash';
import ReadlineStub from '../../helpers/readline';
import { editor } from '../../helpers/fixtures';

import Editor from '../../../lib/prompts/editor';

interface Context {
  previousVisual: typeof process.env.VISUAL;
  fixture: typeof editor;
  rl: any;
}

describe('`editor` prompt', function() {
  beforeEach(function(this: Context) {
    this.previousVisual = process.env.VISUAL;
    // Writes the word "testing" to the file
    process.env.VISUAL = 'node ./test/bin/write.js testing';
    this.fixture = clone(editor);
    this.rl = new ReadlineStub();
  });

  afterEach(function(this: Context) {
    process.env.VISUAL = this.previousVisual;
  });

  it('should retrieve temporary files contents', async function(this: Context) {
    var prompt = new Editor(this.fixture, this.rl);

    var promise = prompt.run();
    this.rl.emit('line', '');

    const answer = await promise;
    return expect(answer).to.equal('testing');
  });
});
