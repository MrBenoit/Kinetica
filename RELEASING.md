# Releasing Kinetica

## Prepare

1. Update the version in `manifest.json`, `package.json` and `package-lock.json`. Add its minimum Obsidian version to `versions.json`.
2. Run `npm ci --ignore-scripts` and `npm run check` from a clean checkout.
3. Test creation, editing, playback and sliders in Obsidian. Check existing notes still open. Record any untested platforms in the release notes.
4. Commit the source and push `main`. Wait for the Check workflow to pass.

## Publish a GitHub release

Write `docs/release-notes-<version>.md`, commit it with the version updates and push `main`. Push a tag matching the manifest version exactly, without a `v` prefix.

The Release workflow checks the metadata, runs all checks and generates provenance attestations for the three plugin files and both HTML viewer files. It publishes the viewer files in a separate `html-<version>` prerelease, then uploads the three plugin files to the numbered draft and publishes it as latest. A retry can resume a draft, but refuses to replace a published release. Fix an already published version by releasing a new version.

Download the assets and verify their attestations with `gh attestation verify main.js --repo MrBenoit/Kinetica`. Repeat for `styles.css` and `manifest.json`. Also verify `kinetica.js` and `kinetica-example.html`. Download these two assets from the matching HTML prerelease. Keeping web downloads separate leaves only supported plugin files in the latest release. The source archives are supplied by GitHub.

## Submit to the community directory

Sign in at [community.obsidian.md](https://community.obsidian.md) with an Obsidian account and link the GitHub account that owns this repository. Add the plugin using the repository URL. The directory reads `manifest.json` from the default branch and expects release assets for its version.

Confirm the plugin ID is available. Address the automatic review feedback before requesting review. Approval is separate from publishing a GitHub release.

Use the current [Obsidian submission guide](https://docs.obsidian.md/Plugins/Releasing/Submit%20your%20plugin) and [plugin requirements](https://docs.obsidian.md/community-directory/submission-requirements-for-plugins) as the authority. Submission happens through the community directory, not an old pull request tutorial.

## Repository details

Description: Create step-by-step scenes and interactive function plots with sliders in Obsidian.

Suggested topics: `obsidian`, `obsidian-plugin`, `visualization`, `animation`, `interactive-graphs`, `education`, `typescript`.
