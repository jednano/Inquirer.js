import { enable, warnOnUnregistered, registerMock } from 'mockery';
import ReadlineStub from './helpers/readline';

enable();
warnOnUnregistered(false);
registerMock('readline', {
  createInterface: function() {
    return new ReadlineStub();
  }
});
