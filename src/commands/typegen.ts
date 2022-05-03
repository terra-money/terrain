import { Command, flags } from "@oclif/command";
import { execSync } from "child_process";
import * as path from 'path'
import namespaceGen from "../lib/namespace-gen";
import * as fs from 'fs'

const hl           = (_: string) => `\x1b[35m${_}\x1b[0m`
const snakeToCamel = (_:string) =>
  _.toLowerCase().replace(/([-_][a-z])/g, group =>
    group
      .toUpperCase()
      .replace('-', '')
      .replace('_', '')
  );

export default class GenerateTypes extends Command {
    static description = `Generates .TS type definitions for a given CosmWasm contract. 
  Under development:[
    Each CosmWasm contract registered with terrain has its types exported as TypeScript type declarations.
    These declarations can be found in terrain/types as individual namespaces or reimported from the master Terrain namespace.
    ]
  `;

    // -------------------------------------------------
    // Oclif format the space out of its command 'description' output. 
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
        "$ terrain typegen mycontract",
        "$ terrain typegen mycontract --outdir ~/mytypes",
        "$ terrain typegen mycontract --outdir ~/mytypes --name customNamespace",
    ];

    static flags = {
        "outdir": flags.string({ description: "Custom output directory." }),
        "name"  : flags.string({description:"Name to give to the generated namespace and its containing file."})
    };

    static args = [{
        name    : "contractDir",
        required: true,
    }];

    async run() {
        const { args, flags } = this.parse(GenerateTypes);

        const CONTRACT_DIR = args.contractDir
        const OUT_DIR      = flags.outdir
        const OUT_NAME     = flags.name

        //  verifying input  
        try {

            fs.lstatSync(CONTRACT_DIR).isDirectory()
            fs.lstatSync(path.resolve(CONTRACT_DIR, 'schema')).isDirectory()

            fs.readdirSync(path.resolve(CONTRACT_DIR, 'schema')).length < 1
                ? console.error(`The schema directory is empty. Generating an empty namespace.
Consider generating CosmWasm schema manually: ${hl("cargo schema")}
https://docs.cosmwasm.com/tutorials/simple-option/develop/#schema`)
                : null

        } catch (e) {
            console.error(`${hl(CONTRACT_DIR)} is NOT a valid CosmWasm contract directory.`)
            process.exit(1)
        }

        if (OUT_DIR !== undefined) {
            try {
                fs.lstatSync(OUT_DIR).isDirectory()
            } catch (direrorr) {
                console.error(`"${hl(OUT_DIR)}" either does not exist or is NOT a valid directory. Provide a valid path to output a .TS namespace to.`);
                process.exit(1)
            }
        } else {
            // ? TODO: Implement a Terain master namespace reimporting types for all registered contracts.
            console.log("Freeform invocation unimplemented. use --outdir for now")
            process.exit(1)
        }


        let   namespaceName = OUT_NAME || snakeToCamel(path.basename(CONTRACT_DIR))
        const result        = await namespaceGen(namespaceName, args.contractDir)
        fs.writeFileSync(path.resolve(OUT_DIR, `${namespaceName}.ts`), result)
    }
}
