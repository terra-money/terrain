import { Command } from '@oclif/command';
import { cli } from 'cli-ux';
import fs from 'fs-extra';
import * as path from 'path';
import TerrainCLI from '../../TerrainCLI';

export default class TaskNew extends Command {
  static description = 'create new task';

  static args = [{ name: 'task' }];

  async run() {
    const { args } = this.parse(TaskNew);

    const pathToTasks = path.join(process.cwd(), 'tasks', `${args.task}.ts`);
    if (fs.existsSync(pathToTasks)) {
      TerrainCLI.error(`Task with name ${args.task} already exists chose another name for the task.`);
    }

    cli.action.start(`Creating task: ${args.task}`);
    await fs.writeFile(
      pathToTasks,
      `import { Env, task } from "@terra-money/terrain";

task(async (env:Env) => {
  console.log(env);
  console.log("Template")
});`,
    );
    cli.action.stop();

    return undefined;
  }
}
