import { existsSync } from 'fs';
import * as path from 'path';
import TerrainCLI from '../TerrainCLI';

async function runCommand(execPath: string, command: Function, errorCheck: Function) {
  // Initialize rootPath directory to current working directory.
  let rootPath = process.cwd();

  // Backtrack, up to 4 times, through file tree to find execPath.
  for (let stepBack = 0; stepBack < 5; stepBack += 1) {
    // User specified error check to execute upon each iteration.
    errorCheck(process.cwd());

    // If execPath available, execute command.
    if (existsSync(execPath)) {
      return command();
    }

    // If execPath does not exist in current directory, step back one directory.
    rootPath = path.join(rootPath, '..');
    process.chdir(rootPath);
  }

  // If rootPath not found after stepping back 4 directories,
  // tell user to run command in a terrain project directory.
  return TerrainCLI.warning(
    'Please ensure that you are in a terrain project directory.',
  );
}

export default runCommand;
