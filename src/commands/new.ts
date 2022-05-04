import { Command, flags } from "@oclif/command";
import { execSync } from "child_process";
import * as fs from "fs-extra";
import cli from "cli-ux";
import * as request from "superagent";
import * as Zip from "adm-zip";
import * as path from "path";

export default class New extends Command {
  static description = "Create new dapp from a template.";

  static examples = [
    "$ terrain new awesome-dapp",
    "$ terrain new --framework vue awesome-dapp",
    "$ terrain new awesome-dapp --path path/to/dapp",
    "$ terrain new --framework next awesome-dapp --path path/to/dapp",
  ];

  static flags = {
    path: flags.string({ description: "path to keep the project" }),
    framework: flags.string({
      description: "Choose the frontend framework you want to use. Non-react framework options have better wallet-provider support but less streamlined contract integration.",
      options: ["next", "vue", "vite", "lit", "svelte", "react"],
      default: "react",
    }),
    version: flags.string({
      default: "0.16",
    }),
  };

  static args = [{ name: "name", required: true }];

  async run() {
    const { args, flags } = this.parse(New);

    cli.log("generating: ");
    cli.action.start("- contract");

    if (flags.path) {
      process.chdir(flags.path);
    }

    fs.mkdirSync(args.name);
    process.chdir(args.name);

    fs.mkdirSync("contracts");
    process.chdir("contracts");


    // Contract 

    const repoName     = "cw-template"
    const branch       = "0.16";
    const contractName = "counter";
    const contractFile = fs.createWriteStream("contract.zip");
    await new Promise((resolve, reject) => {
      request
        .get(`https://github.com/InterWasm/${repoName}/archive/refs/heads/${branch}.zip`)
        .on("error", (error) => {reject(error);})
        .pipe(contractFile)
        .on("finish", () => {cli.action.stop();resolve(null);});
    });

    const contractZip = new Zip("contract.zip");
    contractZip.extractAllTo(".", true);

    fs.renameSync(`${repoName}-${branch}`, `${contractName}`);
    fs.removeSync("contract.zip");
    // Postprocess Cargo.toml - name & authors
    const Cargotoml = path.resolve(process.cwd(), `${contractName}`,'Cargo.toml')
    fs.readFile(Cargotoml, {encoding: 'utf8'},  (e:any,data:any) =>{
      if (e) { throw e };

      var _ = data
      .replace(/name = "{{project-name}}"/g, 'name = "terrain-counter-template"')
      .replace(/authors = \["{{authors}}"\]/g, 'authors = ["terrain-developer"]')
      
      fs.writeFile(Cargotoml, _, 'utf-8', function (err) {
          if (err) throw err;
      });
    });


    // -------------------------------------- Frontend
    cli.action.stop();
    process.chdir("..");

    cli.action.start("- frontend");
    if (flags.framework === "react") {
      await new Promise((resolve, reject) => {
        const file = fs.createWriteStream("frontend.zip");
        request
          .get(
            "https://github.com/terra-money/terrain-frontend-template/archive/refs/heads/main.zip"
          )
          .on("error", (error) => {
            reject(error);
          })
          .pipe(file)
          .on("finish", () => {
            cli.action.stop();
            resolve(null);
          });
      });
      const zip = new Zip("frontend.zip");
      zip.extractAllTo(".", true);
      fs.renameSync("terrain-frontend-template-main", "frontend");
      fs.removeSync("frontend.zip");
    } else {
      execSync(
        `npx copy-github-directory https://github.com/terra-money/wallet-provider/tree/main/templates/${flags.framework} frontend`,
      );
      process.chdir("frontend");
      fs.removeSync("sandbox.config.json");
    }

    cli.action.stop();
    fs.copySync(path.join(__dirname, "..", "template"), process.cwd());
  }
}
