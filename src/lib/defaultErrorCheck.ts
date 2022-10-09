import { existsSync } from 'fs';
import { join } from 'path';
import TerrainCLI from '../TerrainCLI';

function defaultErrorCheck(contractName: string) {
  return function errorCheck() {
    if (existsSync('contracts') && !existsSync(join('contracts', contractName))) {
      TerrainCLI.error(
        `Contract "${contractName}" not available in "contracts" directory.`,
        'Contract Not Found',
      );
    }
  };
}

export default defaultErrorCheck;
