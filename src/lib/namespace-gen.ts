import * as fs from 'fs';
import { compileFromFile } from 'json-schema-to-typescript';
import * as path from 'path';

const hl = (_: string) => `\x1b[35m${_}\x1b[0m`;

/**
 * Given a CosmWasm smart contract directory with a schema folders, generate type declrataions
 * corresponding to the json schema.
 * @param {number} namespaceName Name to assign to the containing file and the namespace.
 * under which the declaraction are exported.
 * @param {number} contractPath path to the CosmWasm smart contract. This ought to contain
 * a 'schema' folder.
 * @returns {string}  the generated declarations.
 */
const namespaceGen = async (
  namespaceName: string,
  contractPath: string,
): Promise<string> => {
  const schemaDir = path.resolve(contractPath, 'schema');
  const schemaFiles = fs.readdirSync(schemaDir);

  const tsDeclarations = schemaFiles.map(
    (file) => compileFromFile(
      path.resolve(schemaDir, file),
      {
        bannerComment: `//This type was automatically generated from ***${file}*** file in the ${schemaDir}.`,
        strictIndexSignatures: true,
        unknownAny: false,
      },
    ),
  );

  const tsDecWrapInNamespace = (declarations: string) => (contractName: string) => `

// Read more about CosmWasm schema: https://github.com/CosmWasm/cosmwasm/tree/main/packages/schema.
// Pattern  "[k: string]: any | undefined;" signfifies a field/value can be left empty. 
export namespace ${contractName} {\n${declarations}}`;

  const alldecs: string[] = [];
  (await Promise.all(tsDeclarations)).map((d) => alldecs.push(d));

  /**
           * For every generated typedef:
           * 1. Locate 'export' line
           * 2. Excise words reserved by TypeScript between the 'export' and the its name.
           * 3. Assert that there are no duplicate exports.
           * */
  const REG = /^(?![/|*]).*\b(export)\b.*$/gm;
  let IDENTIFIERS: Array<string> = [];

  alldecs.map((declaration) => {
    const exports = declaration.match(REG) || [];
    const _ = exports.map(
      (line: string) => line.replace(/(object|enum|type|interface|package|abstract|class|function|default)/gm, '')
        .trim()
        .split(/\s+/)[1],
    );
    IDENTIFIERS = [...IDENTIFIERS, ..._];
    return null;
  });

  // If there are duplicates -- locate them and throw.
  if (IDENTIFIERS.length !== new Set(IDENTIFIERS).size) {
    const dupes = IDENTIFIERS.filter(((s) => (v) => s.has(v) || !s.add(v))(new Set()));
    console.error(`[Terrain]:${hl(schemaDir)} has duplicate identifiers declated: [${hl(dupes.join(','))}].\nMake sure ${hl('cargo schema')} creates unique types.`);
    throw new SyntaxError();
  }

  return Promise.all(tsDeclarations)
    .then((_) => _.reduce((prev: string, acc: string) => acc.concat('\n', prev), ''))
    .then((contractDeclarations) => tsDecWrapInNamespace(contractDeclarations)(namespaceName));
};
export default namespaceGen;
