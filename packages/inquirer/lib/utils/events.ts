import { fromEvent } from 'rxjs';
import { filter, map, share } from 'rxjs/operators';
import { Key } from 'readline';

function normalizeKeypressEvents(value: any, key = {}) {
  return { value, key };
}

export default function(rl: any) {
  var keypress = fromEvent(rl.input, 'keypress', normalizeKeypressEvents)
    // Ignore `enter` key. On the readline, we only care about the `line` event.
    .pipe(filter(({ key }: { key: Key }) => key.name !== 'enter' && key.name !== 'return'));

  return {
    line: fromEvent(rl, 'line'),
    keypress,

    normalizedUpKey: keypress.pipe(
      filter(
        ({ key }: any) =>
          key.name === 'up' || key.name === 'k' || (key.name === 'p' && key.ctrl)
      ),
      share()
    ),

    normalizedDownKey: keypress.pipe(
      filter(
        ({ key }: any) =>
          key.name === 'down' || key.name === 'j' || (key.name === 'n' && key.ctrl)
      ),
      share()
    ),

    numberKey: keypress.pipe(
      filter((e: any) => e.value && '123456789'.indexOf(e.value) >= 0),
      map(e => Number(e.value)),
      share()
    ),

    spaceKey: keypress.pipe(
      filter(({ key }) => key && key.name === 'space'),
      share()
    ),
    aKey: keypress.pipe(
      filter(({ key }) => key && key.name === 'a'),
      share()
    ),
    iKey: keypress.pipe(
      filter(({ key }) => key && key.name === 'i'),
      share()
    )
  };
}
