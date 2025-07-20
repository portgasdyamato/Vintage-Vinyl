# Backend Notes

## Using cookies.txt for yt-dlp Authentication
 
- Place your `cookies.txt` file in this directory for yt-dlp authentication with YouTube.
- **Do NOT commit this file to git or share it publicly.**
- Add `backend/cookies.txt` to your `.gitignore` to prevent accidental commits.
- If deploying to Railway or another server, you must manually upload `cookies.txt` after each deployment if it is not in the repo.
- Export cookies in Netscape format using a browser extension (see main README for details). 