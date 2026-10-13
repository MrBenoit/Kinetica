# Releasing Kinetica

## Prepare

1. Update the version in `manifest.json`, `package.json` and `package-lock.json`. Add its minimum Obsidian version to `versions.json`.
2. Run `npm ci --ignore-scripts` and `npm run check` from a clean checkout.
3. Test creation, editing, playback and sliders in Obsidian. Check existing notes still open. Record any untested platforms in the release notes.
4. Commit the source and push `main`. Wait for the Check workflow to pass.

## Publish a GitHub release

Create a tag matching the manifest version exactly, such as `0.1.0`, without a `v` prefix. Create a GitHub release for that tag with a short description and known limitations.

Attach `dist/main.js`, `dist/manifest.json` and `dist/styles.css` as individual release assets. The auto-generated source archives are not enough for Obsidian installation. An optional zip can contain the same three files.

For this first beta, use the copy in [docs/release-notes-0.1.0.md](docs/release-notes-0.1.0.md).

## Submit to the community directory

Sign in at [community.obsidian.md](https://community.obsidian.md) with an Obsidian account and link the GitHub account that owns this repository. Add the plugin using the repository URL. The directory reads `manifest.json` from the default branch and expects release assets for its version.

Confirm the plugin ID is available. Address the automatic review feedback before requesting review. Approval is separate from publishing a GitHub release.

Use the current [Obsidian submission guide](https://docs.obsidian.md/Plugins/Releasing/Submit%20your%20plugin) and [plugin requirements](https://docs.obsidian.md/community-directory/submission-requirements-for-plugins) as the authority. Submission happens through the community directory, not an old pull request tutorial.

## Repository details

Description: Create step-by-step scenes and interactive function plots with sliders in Obsidian.

Suggested topics: `obsidian`, `obsidian-plugin`, `visualization`, `animation`, `interactive-graphs`, `education`, `typescript`.
