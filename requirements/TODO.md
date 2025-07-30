# TODO: Premises Management Implementation

## 1. Database Layer
- [ ] Ensure a `premises` table exists with `id`, `name`, and `content` fields (already in schema).
- [ ] Extend the Cache to include premises in the snippet parsing process.

## 2. Cache Layer  
- [ ] Extend `Cache.ts` to load and parse premises content for snippet definitions.
- [ ] Update `buildSnippetCache()` to include premises alongside questions.
- [ ] Update `rebuildCache()` to reload premises when cache is refreshed.

## 3. Commands
- [ ] Implement a `createPremise` command:
    - [ ] Creates a new entry in the `premises` table.
    - [ ] Opens an editor for the new premise.
- [ ] Implement a `savePremise` command:
    - [ ] Updates the corresponding row in the `premises` table.
    - [ ] Triggers cache rebuild to update snippet cache with new premise content.
    - [ ] If a premise name already exists, show an error message.

## 4. Rendering & State
- [ ] When rendering content with `<ref>`, query the snippets cache (via `getSnippetById()`) for the referenced snippet and render its content.
    - [ ] If the snippet does not exist, render `[Snippet not found]`.

## 5. Error Handling
- [ ] On saving a premise with a duplicate name, show an error message.
- [ ] On rendering a `<ref>` to a missing snippet, show `[Snippet not found]`.

## 6. Example
- [ ] When saving a premise containing `<snippet id="newtons-law">F = ma</snippet>`, ensure the snippet cache contains `snippet_id = 'newtons-law'` with `content = 'F = ma'` after cache rebuild.

---

**Note:**
- Update extension activation and command registration as needed.
- Add/modify UI and webview logic to support premise editing and snippet rendering.
- Add tests for all new features and error cases.
