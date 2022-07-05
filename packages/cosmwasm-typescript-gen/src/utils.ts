import { sync as glob } from 'glob';
import { readFileSync } from 'fs';
import { cleanse } from './cleanse';
import { compile } from 'json-schema-to-typescript';
import { parser } from "./parse";

export const readSchemas = ({
    schemaDir, argv, clean = true
}) => {
    const fn = clean ? cleanse : (str) => str;
    const files = glob(schemaDir + '/**/*.json');
    const schemas = files.map(file => JSON.parse(readFileSync(file, 'utf-8')));
    if (argv.packed) {
        if (schemas.length !== 1) {
            throw new Error('packed option only supports one file');
        }
        return Object.values(fn(schemas[0]));
    }
    return fn(schemas);
};

export const findQueryMsg = (schemas) => {
    const QueryMsg = schemas.find(schema => schema.title === 'QueryMsg');
    return QueryMsg;
};

export const findResponses = (schemas) => {
    return schemas.filter(schema => schema.title.includes('Response')).map(i => i.title);
};

export const findExecuteMsg = (schemas) => {
    const ExecuteMsg = schemas.find(schema =>
        schema.title === 'ExecuteMsg' ||
        schema.title === 'ExecuteMsg_for_Empty' || // if cleanse is used, this is never
        schema.title === 'ExecuteMsgForEmpty'
    );
    return ExecuteMsg;
};

export const findAndParseTypes = async (schemas) => {
    const Types = schemas;
    const allTypes = [];
    for (const typ in Types) {
        if (Types[typ].definitions) {
            for (const key of Object.keys(Types[typ].definitions)) {
                // set title
                Types[typ].definitions[key].title = key;
            }
        }
        const result = await compile(Types[typ], Types[typ].title);
        allTypes.push(result);
    }
    const typeHash = parser(allTypes);
    return typeHash;
}