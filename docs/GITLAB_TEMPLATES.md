# GitLab Templates Integration

This document explains how to set up and use the GitLab templates feature in Typostry.

## Configuration

The current implementation reads templates directly from a public GitLab repository. The only supported configuration is:

```
NEXT_PUBLIC_GITLAB_REPO_URL=https://gitlab.com/your-repo-path
```

### Required Environment Variable

1. `NEXT_PUBLIC_GITLAB_REPO_URL` - The URL of the public GitLab repository where your templates are stored.
   - Example: `https://gitlab.com/tgdp/templates`
   - The repository should contain markdown files with names following the pattern `template_*.md`

## How It Works

The templates feature works as follows:

1. The application fetches the public repository tree from GitLab.
2. Matching markdown templates are displayed in the template selector modal.
3. When a template is selected, its content is fetched from GitLab and inserted into the editor.

### API Response Format

The API returns a JSON array of template objects with the following structure:

```json
[
  {
    "id": "123",
    "name": "template_api-reference.md",
    "type": "blob",
    "path": "api-reference/template_api-reference.md"
  },
  {
    "id": "456",
    "name": "template_how-to.md",
    "type": "blob",
    "path": "how-to/template_how-to.md"
  }
]
```

## Template Structure

Templates should be markdown files with names following the pattern `template_*.md`. For example:

- `template_api-reference.md`
- `template_how-to.md`
- `template_tutorial.md`

The template name displayed in the UI is derived from the filename by:
1. Removing the `template_` prefix
2. Removing the `.md` extension
3. Converting hyphens to spaces
4. Capitalizing the first letter of each word

For example, `template_api-reference.md` becomes "Api Reference".

## Example `.env.local` Configuration

```
# Basic app configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# GitLab repository configuration
NEXT_PUBLIC_GITLAB_REPO_URL=https://gitlab.com/tgdp/templates

# Other configurations...
```

## Troubleshooting

If you encounter issues with the GitLab templates feature:

1. Check that your environment variables are correctly set in `.env.local`
2. Check the browser console for any error messages
3. Ensure the repository URL is correct and accessible
4. Verify that the repository contains markdown files with names following the pattern `template_*.md`

If the issue persists, check the network tab in your browser's developer tools to inspect the GitLab API requests.
