import { Command } from '@oclif/command';
import { cli } from 'cli-ux';
import { writeFile, existsSync } from 'fs-extra';
import { join } from 'path';
import dedent from 'dedent';
import runCommand from '../../lib/runCommand';
import TerrainCLI from '../../TerrainCLI';

export default class TaskNew extends Command {
  static description = 'Create a new task.';

  static args = [{ name: 'task' }];

  async run() {
    const { args } = this.parse(TaskNew);

    // Command execution path.
    const execPath = 'tasks';

    // New task file creation path.
    const newTaskPath = join(execPath, `${args.task}.ts`);

    // Command to be performed.
    const command = async () => {
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
    };

    // Error check to be performed upon each backtrack iteration.
    const errorCheck = () => {
      if (existsSync(newTaskPath)) {
        TerrainCLI.error(
          `A task with the name "${args.task}" already exists in the "tasks" directory. Try using another name for the task.`,
          'Task Already Exists',
        );
      }
    };

    // Attempt to execute command while backtracking through file tree.
    await runCommand(execPath, command, errorCheck);
  }
}
