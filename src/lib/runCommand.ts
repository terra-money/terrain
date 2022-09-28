import { existsSync } from 'fs';
import * as path from 'path';
import TerrainCLI from '../TerrainCLI';

async function runCommand(execPath: string, command: () => void, errorCheck: () => void) {
  // Initialize terrainAppRootPath directory to current working directory.
  let terrainAppRootPath = process.cwd();
  const results = [];

  // Backtrack, up to 4 times, through file tree to find execPath.
  for (let stepBack = 0; stepBack < 5; stepBack += 1) {
    // User specified error check to execute upon each iteration.
    results.push(errorCheck());

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
  await Promise.all(results);
  return TerrainCLI.warning(
    'Please ensure that you are in a terrain project directory.',
  );
}

export default runCommand;
