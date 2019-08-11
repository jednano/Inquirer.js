const globby = require('globby');
const { enable, warnOnUnregistered, registerMock } = require('mockery');
const ReadlineStub = require('./helpers/readline');

enable();
warnOnUnregistered(false);
registerMock('readline', {
  createInterface: function() {
    return new ReadlineStub();
  }
});

process.env.TS_NODE_PROJECT = './tsconfig.json';

const Mocha = require('ts-mocha');

const mocha = new Mocha();

(async () => {
  const paths = await globby('test/**/*');
  paths.forEach(file => {
    console.log('file:', file);
    mocha.addFile(file);
  });
  mocha.run(failures => {
    process.on('exit', () => {
      process.exit(failures);
    });
  });
})();
