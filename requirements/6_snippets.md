### **Snippets**

## **(Generic)**
* The system shall support reusable content snippets that can be defined in questions and referenced elsewhere.
* Snippets shall be identified by unique string identifiers.

## **(Ubiquitous)**
* The system shall build and maintain a snippet cache containing all snippet definitions from all questions.
* The system shall process snippet definitions and references during question rendering.

## **(State driven)**
* While the snippet cache is being built, the system shall scan all question content (proposition, step-by-step, and answer sections) for snippet definitions.
* While a snippet cache exists, the system shall use cached snippet content for resolving references.

## **(Event driven)**
* When the question cache is rebuilt, the system shall rebuild the snippet cache.
* When a question is previewed, the system shall resolve all snippet references in the content.
* When snippet content is rendered, the system shall unwrap snippet definitions to display only the inner content.

## **(Optional feature)**

## **(Unwanted behaviour)**
* If a snippet reference points to a non-existent snippet ID, then the system shall display the error message "[Snippet '{snippet_id}' not found]" in place of the reference.
* If duplicate snippet IDs are found during cache building, then the system shall overwrite the previous snippet with the same ID and log a warning message.
* If a snippet definition contains malformed syntax, then the system shall not include it in the snippet cache.

## **(Complex)**
* While a question contains the snippet definition `<snippet id="newtons-law">F = ma</snippet>` in its step-by-step section, when the snippet cache is built, the system shall store the content "F = ma" with the identifier "newtons-law".
* While a question contains the reference `<ref id="newtons-law" />` in its proposition, when the question is previewed, the system shall replace the reference with the content "F = ma" from the snippet cache.
* While a question contains both snippet definitions and references, when the question is rendered, the system shall first resolve all references with cached content, then unwrap all snippet definitions to show only their inner content.
* While processing question content for rendering, when a snippet definition `<snippet id="formula">E = mc²</snippet>` is encountered, the system shall display only "E = mc²" in the rendered output without the snippet tags.
* While the snippet cache contains 5 snippets, when the cache is rebuilt, the system shall log "Snippet cache built with 5 items."
