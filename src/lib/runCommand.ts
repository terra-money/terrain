import { existsSync } from 'fs';
import * as path from 'path';
import TerrainCLI from '../TerrainCLI';

async function runCommand(execPath: string, command: () => void, errorCheck: () => void) {
  // Initialize terrainAppRootPath directory to current working directory.
  let terrainAppRootPath = process.cwd();

  // Backtrack, up to 4 times, through file tree to find execPath.
  for (let stepBack = 0; stepBack < 5; stepBack += 1) {
    // User specified error check to execute upon each iteration.
    // eslint-disable-next-line no-await-in-loop
    await errorCheck();

    // If execPath available, execute command.
    if (existsSync(execPath)) {
      return command();
    }

    // If execPath does not exist in current directory, step back one directory.
    terrainAppRootPath = path.join(terrainAppRootPath, '..');
    process.chdir(terrainAppRootPath);
  }

  // If terrainAppRootPath not found after stepping back 4 directories,
  // tell user to run command in a terrain project directory.
  return TerrainCLI.error(
    `Command execution path "${execPath}" not found. Please ensure that you are in a terrain project directory.`,
    'Execution Path Not Found',
  );
}

export default runCommand;
