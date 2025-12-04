# Music Library Update Workflow

This project uses a **Git Submodule** (`assets_for_my_website`) to manage the music library. This keeps the main repository light and allows for separate management of large media files.

## How to Add New Music

1.  **Add Files to the Media Repo**:
    *   Go to the separate repository: `https://github.com/Shuvam-Banerji-Seal/assets_for_my_website`
    *   Upload your new music files to the `Music` directory.
    *   Commit and push your changes to that repository.

2.  **Update the Submodule in This Project**:
    *   Open a terminal in this project's root directory.
    *   Run the following command to pull the latest changes from the media repo:
        ```bash
        git submodule update --remote --merge
        ```

3.  **Generate the Manifest**:
    *   Run the script to scan the new files and update `music-library.json`:
        ```bash
        npm run generate:music
        ```

4.  **Commit and Push**:
    *   Commit the updated submodule reference and the new `music-library.json`:
        ```bash
        git add assets_for_my_website public/music-library.json
        git commit -m "Update music library"
        git push origin main
        ```

## Automatic Deployment
Once you push to `main`, the GitHub Actions workflow will:
1.  Pull the latest LFS files for the submodule.
2.  Build the site.
3.  Deploy the updated music player.

> **Note**: The `generate:music` script automatically handles the creation of CDN URLs for production playback.
