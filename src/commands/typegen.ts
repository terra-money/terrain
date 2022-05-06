import { Command, flags as oclifFlags } from '@oclif/command';
import * as path from 'path';
import * as fs from 'fs';
import namespaceGen from '../lib/namespace-gen';

const hl = (_: string) => `\x1b[35m${_}\x1b[0m`;
const snakeToCamel = (_: string) => _.toLowerCase().replace(/([-_][a-z])/g, (group) => group
  .toUpperCase()
  .replace('-', '')
  .replace('_', ''));

export default class GenerateTypes extends Command {
  static description = `Generates .TS type definitions for a given CosmWasm contract. 
  Under development:[
    Each CosmWasm contract registered with terrain has its types exported as TypeScript type declarations.
    These declarations can be found in terrain/types as individual namespaces or reimported from the master Terrain namespace.
    ]
  `;

  // -------------------------------------------------
  // Oclif formats the spaces out of its command 'description' output.
  // Here is how the typedefs housekeeping might look like.
  // -------------------------------------------------
  //     terrain
  //     ├── ...
  //     ├── tasks
  //     ├── contracts
  //     |   ├── counter
  //     |   └── staking
  //     └── types
  //         ├── terrain-global.ts
  //         ├── staking
  //         |   └── staking.ts
  //         └── counter
  //             └── counter.ts
  // -------------------------------------------------

  static examples = [
    '$ terrain typegen mycontract',
    '$ terrain typegen mycontract --outdir ~/mytypes',
    '$ terrain typegen mycontract --outdir ~/mytypes --name customNamespace',
  ];

  static flags = {
    outdir: oclifFlags.string({ description: 'Custom output directory.' }),
    name: oclifFlags.string({ description: 'Name to give to the generated namespace and its containing file.' }),
  };

  static args = [{
    name: 'contractDir',
    required: true,
    description: "Provide a path to a CosmWasm contract directory containing a 'schema' folder.",
  }];

  async run() {
    const { args, flags } = this.parse(GenerateTypes);

    const CONTRACT_DIR = args.contractDir;
    const OUT_DIR = flags.outdir;
    const OUT_NAME = flags.name;

    //  verifying input
    try {
      fs.lstatSync(CONTRACT_DIR).isDirectory();
      fs.lstatSync(path.resolve(CONTRACT_DIR, 'schema')).isDirectory();

      if (fs.readdirSync(path.resolve(CONTRACT_DIR, 'schema')).length < 1) {
        console.warn(`The schema directory is empty. Generating an empty namespace.\nConsider generating CosmWasm schema manually: ${hl('cargo schema')} https://docs.cosmwasm.com/tutorials/simple-option/develop/#schema`);
      }
    } catch (e) {
      console.error(`${hl(CONTRACT_DIR)} is NOT a valid CosmWasm contract directory.`);
      process.exit(1);
    }

    if (OUT_DIR !== undefined) {
      try {
        fs.lstatSync(OUT_DIR).isDirectory();
      } catch (direrorr) {
        console.error(`"${hl(OUT_DIR)}" either does not exist or is NOT a valid directory. Provide a valid path to output a .TS namespace to.`);
        process.exit(1);
      }
    } else {
      // ? TODO: Implement a Terain master namespace reimporting types for all registered contracts.
      console.log("[Terrain] Freeform invocation unimplemented. Use with '--outdir [DIR]' for now");
      process.exit(1);
    }

    const namespaceName = OUT_NAME || snakeToCamel(path.basename(CONTRACT_DIR));
    const result = await namespaceGen(namespaceName, args.contractDir);

    try {
      fs.writeFileSync(path.resolve(OUT_DIR, `${namespaceName}.ts`), result);
      console.warn(`[Terrain]: Wrote to ${hl(path.resolve(OUT_DIR, `${namespaceName}.ts`))} successfully.`);
    } catch (_) {
      console.warn(`[Terrain]: Could not write to ${path.resolve(OUT_DIR, `${namespaceName}.ts`)}.`);
      throw _;
    }
  }
}
