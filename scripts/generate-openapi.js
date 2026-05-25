const fs = require('fs');
const path = require('path');
const { generateOpenApiDocument } = require('../schemas/openapi');

const docsDir = path.join(__dirname, '..', 'docs');
fs.mkdirSync(docsDir, { recursive: true });
fs.writeFileSync(path.join(docsDir, 'openapi.json'), JSON.stringify(generateOpenApiDocument(), null, 2) + '\n');
