/**
 * Simple script to write an argument to a file
 */

import { writeFileSync } from 'fs';

if (process.argv.length === 4) {
  writeFileSync(process.argv[3], process.argv[2]);
}
