const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const requirementsDir = path.join(projectRoot, 'requirements');
const outputDir = __dirname;
const outputFile = path.join(outputDir, 'merged_requirements_files.txt');

function generateTree(dir, prefix = '') {
    const files = fs.readdirSync(dir);
    let tree = '';

    files.forEach((file, index) => {
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

function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);

    files.forEach(function(file) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getAllFiles(fullPath, arrayOfFiles);
        } else {
            arrayOfFiles.push(fullPath);
        }
    });

    return arrayOfFiles;
}

try {
    console.log('Generating requirements folder structure...');
    const folderTree = generateTree(requirementsDir);
    const architecturalMap = `# Requirements Folder Structure\n\n${folderTree}\n`;

    console.log('Finding all files in requirements folder...');
    const requirementFiles = getAllFiles(requirementsDir);
    let mergedContent = architecturalMap;

    console.log(`Found ${requirementFiles.length} files. Merging...`);
    requirementFiles.forEach(filePath => {
        const relativePath = path.relative(projectRoot, filePath);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        
        mergedContent += `\n// =================================================================================================\n`;
        mergedContent += `// FILE: ${relativePath.replace(/\\/g, '/')}\n`;
        mergedContent += `// =================================================================================================\n\n`;
        mergedContent += fileContent + "\n";
    });

    fs.writeFileSync(outputFile, mergedContent);
    console.log(`Successfully merged ${requirementFiles.length} files into ${outputFile}`);
} catch (error) {
    console.error('Error merging files:', error);
}
