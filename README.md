# Gemini API Key Rotation

This script allows you to rotate through multiple Gemini API keys to manage your daily quotas.

## Setup

1.  **Add your API keys:** Open the `api_keys.json` file and replace the placeholder keys with your actual Gemini API keys.

    ```json
    {
      "keys": [
        "YOUR_API_KEY_1",
        "YOUR_API_KEY_2",
        "YOUR_API_KEY_3"
      ]
    }
    ```

## Usage

The `rotate_keys.js` script exports a `getNextKey()` function that returns the next available API key in a sequential order.

To use it in your project, you can import it like this:

```javascript
const { getNextKey } = require('./rotate_keys');

const apiKey = getNextKey();

if (apiKey) {
  // Use the apiKey in your Gemini API calls
  console.log('Using API Key:', apiKey);
} else {
  console.error('No API keys found.');
}
```

## Example

Here's a simple example of how you might use it in a script that makes multiple API calls:

```javascript
const { getNextKey } = require('./rotate_keys');

function makeApiCall() {
  const apiKey = getNextKey();
  if (apiKey) {
    console.log(`Making API call with key: ${apiKey}`);
    // Your API call logic here
  } else {
    console.error('Could not make API call. No API keys available.');
  }
}

// Make multiple API calls
makeApiCall();
makeApiCall();
makeApiCall();
makeApiCall(); // This will loop back to the first key
```

To run this example, you could save it as a file (e.g., `example.js`) and run `node example.js` in your terminal.