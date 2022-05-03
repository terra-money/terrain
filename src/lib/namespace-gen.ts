import { compileFromFile } from 'json-schema-to-typescript';
import * as fs from 'fs';
import * as path from 'path';

/**
 * This is a work in progress and we should decide how this factors into the Terrain workflow:
 * - to create namespace when generating a fronted template
 * - as a custom command to execute
 * 1. Point at this at a contract folder ==> $CONTRACT_NAME.
 * 2. Generate a namespace file with the declarations corresponding to cosmwasm schema files.
 * 3. Write to specified directory or add to the common Terrain namespace.
 * //----------------------------------------------------------------------
 * We should decide how to structure this inside Terrain:
 * if we decide to keep all contracts' declarations under a common namespace, say DTerrain,
 * then the user could also share namespaces in multi-contract code for example.
 */

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
    contractPath : string): Promise<string> => {

    const schemaDir      = path.resolve(contractPath, 'schema')
    const schemaFiles    = fs.readdirSync(schemaDir)

    let   tsDeclarations = schemaFiles.map(
        (file) => compileFromFile(path.resolve(schemaDir, file),
        {
            bannerComment        : `//This type was automatically generated from ***${file}*** file in the ${schemaDir}.`,
            strictIndexSignatures: true,
            unknownAny           : false,
        }))

    const tsDecWrapInNamespace = (declarations: string) =>
                                 (contractName: string) => `

// Read more about CosmWasm schema: https://github.com/CosmWasm/cosmwasm/tree/main/packages/schema.
// Pattern  "[k: string]: any | undefined;" signfifies a field/value can be left empty. 
export namespace ${contractName} {\n${declarations}}`;

    return Promise.all(tsDeclarations)
        .then((_) => _.reduce((prev: string, acc: string) => { return acc.concat("\n", prev) },""))
        .then(contractDeclarations => tsDecWrapInNamespace(contractDeclarations)(namespaceName));
}
export default namespaceGen;



