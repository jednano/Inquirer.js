import { Key } from 'readline'

export function isUpKey(key: Key) {
  return key.name === 'up' || key.name === 'k' || (key.name === 'p' && key.ctrl);
}

export function isDownKey(key: Key) {
  return key.name === 'down' || key.name === 'j' || (key.name === 'n' && key.ctrl);
}

export function isSpaceKey(key: Key) {
  return key.name === 'space';
}

export function isNumberKey(key: Key) {
  return '123456789'.includes(key.name!);
}
