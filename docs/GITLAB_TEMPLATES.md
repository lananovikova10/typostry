# GitLab Templates Integration

This document explains how to set up and use the GitLab templates feature in Typostry.

## Configuration

To use the GitLab templates feature, you need to configure the following environment variables in your `.env.local` file:

```
NEXT_PUBLIC_GITLAB_REPO_URL=https://gitlab.com/your-repo-path
NEXT_PUBLIC_GITLAB_TOKEN=your_gitlab_access_token
```

### Required Environment Variables

1. `NEXT_PUBLIC_GITLAB_REPO_URL` - The URL of the GitLab repository where your templates are stored.
   - Example: `https://gitlab.com/tgdp/templates`
   - The repository should contain markdown files with names following the pattern `template_*.md`

2. `NEXT_PUBLIC_GITLAB_TOKEN` - A GitLab personal access token with read access to the repository.
   - You can create a token in GitLab by going to Settings > Access Tokens
   - Required scopes: `read_api`, `read_repository`

## How It Works

The templates feature works as follows:

1. The application makes a request to the `/api/gitlab/templates` API route
2. The API route reads the environment variables and makes a request to the GitLab API
3. The templates are returned as a JSON array and displayed in the template selector modal
4. When a template is selected, its content is fetched from GitLab and inserted into the editor

## API Route

The application includes an API route at `/api/gitlab/templates` that serves as a proxy between the frontend and the GitLab API. This route:

1. Uses the configured environment variables to authenticate with GitLab
2. Fetches the list of templates from the repository
3. Returns the templates as a JSON array to the frontend

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

# GitLab API configuration
NEXT_PUBLIC_GITLAB_REPO_URL=https://gitlab.com/tgdp/templates
NEXT_PUBLIC_GITLAB_TOKEN=glpat-abcdefghijklmnopqrstuvwxyz

# Other configurations...
```

## Troubleshooting

If you encounter issues with the GitLab templates feature:

1. Check that your environment variables are correctly set in `.env.local`
2. Verify that your GitLab token has the required permissions
3. Check the browser console for any error messages
4. Ensure the repository URL is correct and accessible
5. Verify that the repository contains markdown files with names following the pattern `template_*.md`

If the issue persists, you can check the network tab in your browser's developer tools to see the request to `/api/gitlab/templates` and its response.