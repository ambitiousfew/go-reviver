# go-reviver
A VSCode Linting extension to better support the Golang revive linter dynamically passing -config while still leveraging the official Go extension settings.

> WARNING: This is my first VSCode extension being built out of necessity for better supporting differing development environments where a shared linter configuration can be used.
> This extension is very much a WORK IN PROGRESS

## Background
Since the official Go extension library doesn't seem to support the ability to process the built-in VSCode variables inside of `go.lintFlags` allowing us to dynamically determine something like `-config /path/to/revive.toml` where VSCode may be running on Windows, Linux, or Mac. It creates a scenario where each developer on a team has to write their own user-level config with absolute paths. Absolute paths are not friendly for team development nor are they friendly for cross-platform development.

The simplest setup is to just place a **revive.toml** in your project root. But again, since `go.lintFlags` doesn't seem to support passing built-ins it wont fill in your workspace root directory (_the absolute path the VSCode currently has opened in the window_) prior to running the revive linter.

Not only am I trying to support the simple setup behavior but I am also trying to support configuring per-project level linter configs mainly because I would prefer not to have my company revive linter config being applied to projects outside of work-related code.

## Basic Configuration
Since this linter extension is more of a wrapper, it expects that you are using the official Go Extension as we process `go.lintTool` and the `go.lintFlags` array with some extension specific additional settings.


Let me give a few examples below and describe what things mean and how it builds your dynamic path.

**.vscode/settings.json**
```json
"go.lintTool": "revive",
"go.lintFlags": [
    "-config",
    "${dirs:workspace,workspaceParent,userHome}/revive.toml"
],
"go.lintOnSave": "off",

"reviver.enable": true,
"reviver.lintLevel": "package"
```

In the above snippet we have our normal Go extension `lintTool` and `lintFlags` as well as `lintOnSave` turned off. Since Go Reviver extension is expecting to run the linter executable itself and process the output, we dont need `lintOnSave` to be enabled on the official Go extension, its already assumed to lintOnSave when flipping `reviver.enable` to `true`. We also dont want these two competing to attempt linting with the same binary.

Now the fun part: `${dirs:}`, if this special syntax is detected each special term following the `:` will be placed in an ordered array. These are the directories we will be searching for `revive.toml` in. The paths are built for you and the 3 terms listed have a special meaning and are currently the only ones supported.
- **workspace** - This is the workspace root AKA the folder you have opened in VSCode.
- **workspaceParent** - This is one parent directory up from the workspace root. This variable is more useful when you have a parent project that hosts multiple Go application/libraries within it and you want to use the same parent project linter config.
- **userHome** - This is equivalent to `$HOME` on Mac/Linux or `%USERPROFILE%` on Windows.

You can place these in any order you want they run left to right and the first path to match the existing file wins.


### More Dynamic
Instead of hardcoding a filename we can use this special term `${filename}` as well.

**.vscode/settings.json**
```json
"go.lintTool": "revive",
"go.lintFlags": [
    "-config",
    "${dirs:workspace,workspaceParent,userHome}/${filename}"
],
"go.lintOnSave": "off",

"reviver.enable": true,
"reviver.lintLevel": "package"
```

All the same rules as before still apply for directory searching but now the filename will be determined by the workspace root folder name. So if you opened your code editor into a folder path such as: `/home/dev/code/mycompany/my-project` then `my-project.toml` would be the `${filename}`. It would search in this order:

1. `/home/dev/code/mycompany/my-project`
2. `/home/dev/code/mycompany`
3. `/home/dev/my-project`


### Per-project Linter Configuration
Documentation - Work in progress