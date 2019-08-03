import { flatten } from 'lodash';

/**
 * Force line returns at specific width. This function is ANSI code friendly and it'll
 * ignore invisible codes during width calculation.
 * @param content lines
 */
export function breakLines(content: string, width: number) {
  const regex = new RegExp('(?:(?:\\033[[0-9;]*m)*.?){1,' + width + '}', 'g');
  return flatten(
    content.split('\n').map(line => {
      const chunk = line.match(regex);
      // Remove the last match as it's always empty
      chunk && chunk.pop();
      return chunk || '';
    })
  ).join('\n');
}
