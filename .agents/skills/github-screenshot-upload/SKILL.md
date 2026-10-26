---
name: github-screenshot-upload
description: Programmatically upload screenshots and media to GitHub's user-attachments CDN using the GitHub CLI auth token. Use whenever a PR or issue description needs embedded images.
---

# Uploading real screenshots into a GitHub PR/issue body

GitHub renders inline images in issues and pull requests using its `https://github.com/user-attachments/assets/<uuid>` CDN endpoint. In private repositories, embedding `raw.githubusercontent.com` URLs fails because GitHub's camo proxy cannot authenticate to private content. `user-attachments` URLs inherit the repository's access controls and render cleanly inline.

You do **not** need Playwright, a headless browser, or browser session cookies to upload attachments. GitHub provides a direct upload endpoint at `https://uploads.github.com/user-attachments/assets` that accepts standard GitHub CLI authentication (`gh auth token`).

**Requirement:** All PRs that impact the frontend must have screenshots attached to the PR description. Follow the steps below to upload and embed them.

## Uploading via `curl` and `gh`

### 1. Single file upload

Run this from within the repository root or worktree:

```bash
REPO_ID=$(gh api repos/{owner}/{repo} --jq .id)
TOKEN=$(gh auth token)
FILE_PATH="/path/to/screenshot.png"
FILE_NAME=$(basename "$FILE_PATH")

URL=$(curl -s "https://uploads.github.com/user-attachments/assets?name=${FILE_NAME}&content_type=image/png&repository_id=${REPO_ID}" \
  -X POST \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Accept: application/json" \
  --data-binary "@${FILE_PATH}" | jq -r .url)

echo "Uploaded: $URL"
```

The response is a JSON object `{"url":"https://github.com/user-attachments/assets/<uuid>"}`.

### 2. Batch upload multiple screenshots

To upload multiple images (e.g., from a QA run) and format them into Markdown:

```bash
REPO_ID=$(gh api repos/{owner}/{repo} --jq .id)
TOKEN=$(gh auth token)

for FILE_PATH in /path/to/screenshots/*.png; do
  FILE_NAME=$(basename "$FILE_PATH")
  URL=$(curl -s "https://uploads.github.com/user-attachments/assets?name=${FILE_NAME}&content_type=image/png&repository_id=${REPO_ID}" \
    -X POST \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Accept: application/json" \
    --data-binary "@${FILE_PATH}" | jq -r .url)
  echo "- ![${FILE_NAME}](${URL})"
done
```

### 3. Supported content types

Pass the matching `content_type` query parameter:
- PNG: `image/png`
- JPEG: `image/jpeg`
- GIF: `image/gif`
- WebP: `image/webp`
- MP4 / MOV: `video/mp4` or `video/quicktime`

## Embedding in PR / Issue Body

Include the returned URLs in the PR body Markdown table or list:

```markdown
## Screenshots

| View | Screenshot |
| --- | --- |
| **Home feed** | ![Home feed](https://github.com/user-attachments/assets/...) |
| **Item view** | ![Item view](https://github.com/user-attachments/assets/...) |
```

Then update the PR:

```bash
gh pr edit <PR_NUMBER> --body-file pr_body.md
# or
gh pr edit <PR_NUMBER> --body "..."
```
