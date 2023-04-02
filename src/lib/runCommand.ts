import { existsSync } from 'fs';
import * as path from 'path';
import tesseractCLI from '../tesseractCLI';

async function runCommand(
  execPath: string,
  command: () => void,
  errorCheck: () => void,
  successMessage?: () => void,
) {
  // Initialize tesseractAppRootPath directory to current working directory.
  let tesseractAppRootPath = process.cwd();

  // Backtrack, up to 4 times, through file tree to find execPath.
  for (let stepBack = 0; stepBack < 5; stepBack += 1) {
    // User specified error check to execute upon each iteration.
    // eslint-disable-next-line no-await-in-loop
    await errorCheck();

    // If execPath available, execute command.
    if (existsSync(execPath)) {
      // eslint-disable-next-line no-await-in-loop
      await command();
      return successMessage?.();
    }

    // If execPath does not exist in current directory, step back one directory.
    tesseractAppRootPath = path.join(tesseractAppRootPath, '..');
    process.chdir(tesseractAppRootPath);
  }

  // If tesseractAppRootPath not found after stepping back 4 directories,
  // tell user to run command in a tesseract project directory.
  return tesseractCLI.error(
    `Command execution path "${execPath}" not found. Please ensure that you are in a tesseract project directory.`,
    'Execution Path Not Found',
  );
}

export default runCommand;
