### **Premises Management**

## **(Generic)**

- While a premise is being edited, when the user saves it, the system shall parse the content for snippet definitions and update the snippets cache accordingly.

## **(Ubiquitous)**

- The system shall store premises in a dedicated premises table with an id, name, and content.
- The system shall provide a "Create Premise" button in the sidepanel interface.
- The system shall provide a "Save Premise" button in the sidepanel interface.
- The system shall provide an "Open Premise" button in the sidepanel interface.
- The system shall provide a "Preview Premise" button in the sidepanel interface.
- The system shall register the premise commands in VS Code's command palette.

## **(State driven)**

- While the application is rendering content that includes a <ref>, the system shall query the snippets cache to find the corresponding content.

## **(Event driven)**

- When a user executes a "createPremise" command, the system shall create a new entry in the premises table and open an editor for the new premise.
- When a user executes an "openPremiseByName" command, the system shall show a quick pick list of existing premises and open the selected premise for editing.
- When a user executes a "previewPremise" command, the system shall render the premise content in a webview panel with snippet references resolved.
- When a user saves a premise, the system shall update the corresponding row in the premises table.
- When a user clicks the "Create Premise" button in the sidepanel, the system shall execute the createPremise command.
- When a user clicks the "Open Premise" button in the sidepanel, the system shall execute the openPremiseByName command.
- When a user clicks the "Preview Premise" button in the sidepanel, the system shall execute the previewPremise command.
- When a user clicks the "Save Premise" button in the sidepanel, the system shall execute the savePremise command.

## **(Optional feature)**

## **(Unwanted behaviour)**

- If a user tries to save a premise with a name that already exists, then the system shall show an error message.
- If a snippet reference points to an ID that does not exist in the snippets cache, then the system shall render an error message like "[Snippet not found]".

## **(Complex)**

- While a user is editing a premise that contains the definition <snippet id="newtons-law">F = ma</snippet>, when the user saves the premise, the system shall add or update the snippet in the cache where the snippet_id is "newtons-law" and the content is "F = ma".
