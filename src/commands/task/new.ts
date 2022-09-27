import { Command } from '@oclif/command';
import { cli } from 'cli-ux';
import { writeFile, existsSync } from 'fs-extra';
import { join } from 'path';
import dedent from 'dedent';
import runCommand from '../../lib/runCommand';
import TerrainCLI from '../../TerrainCLI';

export default class TaskNew extends Command {
  static description = 'create new task';

  static args = [{ name: 'task' }];

  async run() {
    const { args } = this.parse(TaskNew);

    // Command execution path.
    const execPath = 'tasks';

    // New task file creation path.
    const newTaskPath = join(execPath, `${args.task}.ts`);

    // Command to be performed.
    async function command() {
      cli.action.start(`Creating task: ${args.task}`);
      await writeFile(
        newTaskPath,
        dedent`
          import { Env, task } from "@terra-money/terrain";

          task(async (env:Env) => {
            console.log(env);
            console.log("Template")
          });\n
        `,
      );
      cli.action.stop();
    }

    // Error check to be performed upon each backtrack iteration.
    function errorCheck() {
      if (existsSync(newTaskPath)) {
        TerrainCLI.error(`A task with the name ${args.task} already exists. Try using another name for the task.`);
      }
    }

    // Attempt to execute command while backtracking through file tree.
    runCommand(
      execPath,
      command,
      errorCheck,
    );
  }
}
