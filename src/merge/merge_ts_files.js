const fs = require("fs");
const path = require("path");

// Define the source directory to search for .ts files.
// It's set to the parent directory of the script's location.
const srcDir = path.join(__dirname, "..");

// Define the name and path for the final merged file.
const outputFile = path.join(__dirname, "merged_src.ts");

// An array to hold the paths of all .ts files found.
const filesToMerge = [];

/**
 * A simple recursive function to find all .ts files within a given directory.
 * @param {string} dir - The directory to start searching from.
 */
function findTsFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Exclude common non-source directories like 'test', '.json', or hidden folders.
      if (
        entry.name !== "test" &&
        entry.name !== ".json" &&
        !entry.name.startsWith(".")
      ) {
        findTsFiles(fullPath);
      }
    } else if (entry.isFile() && entry.name.endsWith(".ts")) {
      // If a .ts file is found, add its full path to our array.
      filesToMerge.push(fullPath);
    }
  }
}

try {
  // Start the process by finding all target files.
  findTsFiles(srcDir);

  // If no .ts files were found, report it and exit.
  if (filesToMerge.length === 0) {
    console.log("No TypeScript files found to merge.");
    return;
  }

  // This is the main header for the generated file.
  const headerContent = `
// =================================================================================
// WARNING: This is an auto-generated file created by merge_ts_files.js
//
// This file is a concatenation of all .ts files found in the project.
// It is intended for quick review or analysis, not for compilation, as it
// does not resolve module dependencies, imports, or exports correctly.
// Editing this file directly is not recommended.
// =================================================================================


`;

  // To ensure the file is empty at the start, we use writeFileSync.
  // This command creates the file if it doesn't exist or completely
  // clears and overwrites it if it does, writing the initial header.
  fs.writeFileSync(outputFile, headerContent, "utf-8");

  // Loop through each file that was found.
  for (const file of filesToMerge) {
    const relativePath = path.relative(__dirname, file);
    const content = fs.readFileSync(file, "utf-8");

    // Create a content block for each file, including headers and footers.
    const fileContentBlock = `// ==========================================================================
// START OF: ${relativePath}
// ==========================================================================

${content}

// ==========================================================================
// END OF: ${relativePath}
// ==========================================================================

`;

    // Append the content block for the current file to the output file.
    fs.appendFileSync(outputFile, fileContentBlock, "utf-8");
  }

  // Log a success message to the console with the results.
  console.log(
    `✅ Successfully merged ${filesToMerge.length} TypeScript files into: ${outputFile}`
  );
  console.log("Files included in the merge:");
  filesToMerge.forEach((f) => console.log(`- ${path.relative(__dirname, f)}`));
} catch (error) {
  // If any error occurs during the process, log it to the console.
  console.error("❌ An error occurred while merging the files:", error);
}
