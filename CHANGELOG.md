# Change Log
All notable changes to the "go-reviver" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

This is a pre-release version. Features and behavior may change.

## [0.0.4] - April 24, 2025

### Added
- revive.lintLevel for "package" and "all"
- Updated README

### Removed
- Misc. left over debug logs

## [0.0.3] - November 21, 2024

### Fixed
- Handle config changes better.
- Add proper logging to Output tab.
- Updated README

### Added
- lintFlags and lintOnsave as reviver configuration.
- Lint Package command to manually trigger linting a package when lintOnSave is disabled.

### Removed
- Reliance on looking up Go extension configurations

## [0.0.2] - November 20, 2024

### Fixed
- Fixed a naming issue renaming golintwrap to reviver.

## [0.0.1] - November 19, 2024

### Added
- Initial extension files
