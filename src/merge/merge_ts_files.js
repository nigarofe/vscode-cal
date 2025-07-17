const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..');
const outputFile = path.join(__dirname, 'merged_src.ts');
const filesToMerge = [];

// A simple recursive function to find all .ts files
function findTsFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            // Exclude common non-source directories, add any others if needed
            if (entry.name !== 'test' && entry.name !== '.json' && !entry.name.startsWith('.')) {
                findTsFiles(fullPath);
            }
        } else if (entry.isFile() && entry.name.endsWith('.ts')) {
            filesToMerge.push(fullPath);
        }
    }
}

try {
    findTsFiles(srcDir);

    if (filesToMerge.length === 0) {
        console.log("No TypeScript files found in the 'src' directory.");
        return;
    }

    let mergedContent = `
// =================================================================================
// WARNING: This is an auto-generated file created by merge_ts_files.js
//
// This file is a concatenation of all .ts files found in the 'src' directory.
// It is intended for quick review or analysis, not for compilation, as it
// does not resolve module dependencies, imports, or exports correctly.
// Editing this file directly is not recommended.
// =================================================================================


`;

    for (const file of filesToMerge) {
        const relativePath = path.relative(__dirname, file);
        const content = fs.readFileSync(file, 'utf-8');
        mergedContent += `// ==========================================================================
`;
        mergedContent += `// START OF: ${relativePath}
`;
        mergedContent += `// ==========================================================================

`;
        mergedContent += content + '\n\n';
        mergedContent += `// ==========================================================================
`;
        mergedContent += `// END OF: ${relativePath}
`;
        mergedContent += `// ==========================================================================

`;
    }

    fs.writeFileSync(outputFile, mergedContent);

    console.log(`✅ Successfully merged ${filesToMerge.length} TypeScript files into: ${outputFile}`);
    console.log('Files included in the merge:');
    filesToMerge.forEach(f => console.log(`- ${path.relative(__dirname, f)}`));

} catch (error) {
    console.error('❌ An error occurred while merging the files:', error);
}
