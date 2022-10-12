import { prompt } from "../prompt";
import cosmscript from "../generate";
import { readSchemas } from "../utils";

export default async (argv) => {
  const questions = [
    {
      _: true,
      type: "path",
      name: "schema",
      message: "which directory contains the the Rust contracts?",
      default: "./schema",
    },
    {
      _: true,
      type: "path",
      name: "out",
      message: "where is the output directory?",
      default: "./ts",
    },
    {
      _: true,
      type: "string",
      name: "name",
      message: "contract name?",
    },
  ];

  console.log(argv);
  const { schema, out, name } = await prompt(questions, argv);
  const contractInfo = await readSchemas({ schemaDir: schema });
  await cosmscript(name, contractInfo.schemas, out);
};
