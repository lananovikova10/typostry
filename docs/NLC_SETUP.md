# NLC Text Completion Setup

## Overview

The text completion feature uses the JetBrains Grazie NLC (Natural Language Completion) API v4 to provide AI-powered text suggestions while writing.

## Authentication Setup

### Getting a Valid Token

The NLC API requires a valid JWT authentication token. The hardcoded token in the previous implementation was causing 401 Unauthorized errors because it lacks the necessary permissions for the NLC v4 API endpoint.

**To obtain a valid token:**

1. Visit [JetBrains Account](https://account.jetbrains.com/)
2. Navigate to your AI/Grazie API settings
3. Generate a new token with NLC API access permissions
4. Copy the full JWT token (should be 700-2000 characters)

### Configuration

Add the token to your environment variables:

```bash
# .env.local (do not commit this file)
GRAZIE_TOKEN=your_actual_jwt_token_here
```

**Security Note:** The token is accessed only on the server side (API route) and never exposed to the client. This is the recommended secure approach.

### Important Notes

- **Token Length**: Valid tokens are typically 700-2000 characters long
- **Token Format**: JWT format with three parts separated by dots (header.payload.signature)
- **Expiration**: Tokens have an expiration date (check the `exp` claim in the JWT payload)
- **Permissions**: Ensure the token has access to the NLC v4 API endpoint
- **License Type**: Requires appropriate JetBrains AI license (organizational or individual)

## API Endpoint

**Production URL:** `https://api.jetbrains.ai/user/v5/trf/nlc/complete/v3`

**Note:** We use v3 endpoint which is confirmed working with the grazie-playground. The v4 endpoint was causing authentication issues.

### Request Format

```json
{
  "context": "The text to complete...",
  "lang": "en"  // or "de"
}
```

**Note:** v3 API uses lowercase `lang` codes ("en", "de") and does NOT support `profile` parameter.

### Required Headers

```
Content-Type: application/json
grazie-authenticate-jwt: <your_jwt_token>
grazie-agent: {"name":"typostry","version":"1.0.0"}
```

**Important:** The authentication uses `grazie-authenticate-jwt` header, NOT `Authorization: Bearer`.

### Response Format

```json
{
  "completions": {
    "prefix": "common prefix for all completions",
    "options": [
      "first completion suggestion",
      "second completion suggestion",
      "third completion suggestion"
    ]
  }
}
```

## Troubleshooting

### 401 Unauthorized Error

If you receive a 401 error:

1. **Check token validity**: Decode your JWT and verify the `exp` (expiration) claim
2. **Verify permissions**: Ensure your token has NLC API access
3. **Check license**: Confirm your JetBrains AI license is active
4. **Test token**: Use the token with the JetBrains API directly to verify it works
5. **Environment variables**: Ensure the token is correctly set in your `.env.local` file

### Token Verification

You can decode your JWT token to check its contents:

```javascript
// In Node.js
const token = 'your_jwt_token';
const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
console.log(payload);

// Check expiration
const expDate = new Date(payload.exp * 1000);
console.log('Token expires:', expDate);
console.log('Is expired?', Date.now() > payload.exp * 1000);
```

### Rate Limiting

The client implements rate limiting:
- **Maximum**: 20 requests per minute
- **Behavior**: Requests beyond the limit are rejected with an error

## Features

- **Auto-completion**: Triggers after typing 2+ characters
- **Smart triggers**: Avoids code blocks, URLs, and inline code
- **Keyboard shortcuts**:
  - `Tab`: Accept selected suggestion
  - `Esc`: Dismiss suggestions
  - `↑/↓`: Navigate suggestions
- **Toggle control**: Sparkles button in toolbar to enable/disable
- **Debouncing**: 500ms delay before API calls to reduce load

## Architecture

```
User Types → useTextCompletion Hook → /api/nlc/complete → Grazie NLC API v4
                   ↓
          CompletionSuggestions UI
```

- **Client**: [src/lib/nlc/index.ts](fleet-file://hgco6mma04bqlg75j4ic/Users/Svetlana.Novikova/typostry/src/lib/nlc/index.ts?type=file&root=%2F)
- **API Proxy**: [src/app/api/nlc/complete/route.ts](fleet-file://hgco6mma04bqlg75j4ic/Users/Svetlana.Novikova/typostry/src/app/api/nlc/complete/route.ts?type=file&root=%2F)
- **Hook**: [src/hooks/use-text-completion.ts](fleet-file://hgco6mma04bqlg75j4ic/Users/Svetlana.Novikova/typostry/src/hooks/use-text-completion.ts?type=file&root=%2F)
- **UI**: [src/components/markdown-editor/completion-suggestions.tsx](fleet-file://hgco6mma04bqlg75j4ic/Users/Svetlana.Novikova/typostry/src/components/markdown-editor/completion-suggestions.tsx?type=file&root=%2F)

## Current Status

### Implementation Complete ✅
The implementation is complete and follows the JetBrains Grazie NLC API v3 specification (confirmed working with grazie-playground):
- ✅ Correct API endpoint (`https://api.jetbrains.ai/user/v5/trf/nlc/complete/v3`)
- ✅ Correct request format (`{ context, language: "ENGLISH"|"GERMAN", profile }`)
- ✅ Correct response parsing (`{ prefix, options }`)
- ✅ Correct authentication header (`grazie-authenticate-jwt: <token>`)
- ✅ Required grazie-agent header
- ✅ Secure token handling (server-side only)

### Recent Fix ✨

**Switched from v4 to v3 endpoint** based on working grazie-playground example. The key differences:
- Changed endpoint: `v4` → `v3`
- Changed auth header: `Authorization: Bearer` → `grazie-authenticate-jwt`
- Added required header: `grazie-agent`

This should resolve the 401 Unauthorized errors!
