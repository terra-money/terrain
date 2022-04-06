import { Command, flags } from "@oclif/command";
import { execSync } from "child_process";
import * as fs from "fs-extra";
import * as filesys from "fs";
import { cli } from "cli-ux";
import * as path from "path";
import * as request from "superagent";
import * as Zip from "adm-zip";

export default class CodeNew extends Command {
  static description = "Generate new contract.";

  static flags = {
    path: flags.string({
      description: "path to keep the contracts",
      default: "./contracts",
    }),
    version: flags.string({
      default: "0.16",
    }),
  };

  static args = [{ name: "name" }];

  async run() {
    const { args, flags } = this.parse(CodeNew);

    process.chdir(flags.path);

    cli.action.start("generating contract");

    // ------------------------------- Contract template
    // https://github.com/InterWasm/cw-template/archive/refs/heads/main.zip
    const repoName     = "cw-template"
    // const branch       = "main";
    const branch      = "0.16";
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
    filesys.readFile(Cargotoml, {encoding: 'utf8'},  (e:any,data:any) =>{
      if (e) { throw e };

      var _ = data
      .replace(/name = "{{project-name}}"/g, 'name = "terrain-counter-template"')
      .replace(/authors = \["{{authors}}"\]/g, 'authors = ["terrain-developer"]')
      
      filesys.writeFile(Cargotoml, _, 'utf-8', function (err) {
          if (err) throw err;
      });
    });

    cli.action.stop();
  }
}
