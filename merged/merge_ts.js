const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const srcDir = path.join(projectRoot, 'src');
const outputDir = __dirname;
const outputFile = path.join(outputDir, 'merged_ts_files.txt');

const ignoreDirs = new Set(['.git', 'node_modules', '.vscode-test', 'out', 'merged', '.vscode']);

function generateTree(dir, prefix = '') {
    const files = fs.readdirSync(dir);
    let tree = '';

    files.forEach((file, index) => {
        if (ignoreDirs.has(file)) {
            return;
        }

        const fullPath = path.join(dir, file);
        const isLast = index === files.length - 1;
        const connector = isLast ? '└───' : '├───';
        
        tree += `${prefix}${connector}${file}\n`;

        if (fs.statSync(fullPath).isDirectory()) {
            const newPrefix = prefix + (isLast ? '    ' : '│   ');
            tree += generateTree(fullPath, newPrefix);
        }
    });

    return tree;
}

function getAllTsFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);

    files.forEach(function(file) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getAllTsFiles(fullPath, arrayOfFiles);
        } else {
            if (file.endsWith('.ts')) {
                arrayOfFiles.push(fullPath);
            }
        }
    });

    return arrayOfFiles;
}

try {
    console.log('Generating folder structure...');
    const folderTree = generateTree(projectRoot);
    const architecturalMap = `# Project Folder Structure\n\n${folderTree}\n`;

    console.log('Finding all .ts files...');
    const tsFiles = getAllTsFiles(srcDir);
    let mergedContent = architecturalMap;

    console.log(`Found ${tsFiles.length} .ts files. Merging...`);
    tsFiles.forEach(filePath => {
        const relativePath = path.relative(projectRoot, filePath);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        
        mergedContent += `\n// =================================================================================================\n`;
        mergedContent += `// FILE: ${relativePath.replace(/\\/g, '/')}\n`;
        mergedContent += `// =================================================================================================\n\n`;
        mergedContent += fileContent + "\n";
    });

    fs.writeFileSync(outputFile, mergedContent);
    console.log(`Successfully merged ${tsFiles.length} .ts files into ${outputFile}`);
} catch (error) {
    console.error('Error merging files:', error);
}
