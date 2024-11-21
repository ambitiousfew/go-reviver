# go-reviver
A VSCode Linting extension to better support the Golang revive linter dynamically passing -config paths based on where your current VSCode workspace directory.

> WARNING: This is my first VSCode extension being built out of necessity for better supporting differing development environments where a shared linter configuration can be used.
> This extension is very much a WORK IN PROGRESS

## Background
Since the official Go extension library doesn't seem to support the ability to process the built-in VSCode variables inside of `go.lintFlags` allowing us to dynamically determine something like `-config /path/to/revive.toml` where VSCode may be running on Windows, Linux, or Mac. It creates a scenario where each developer on a team has to write their own user-level config with absolute paths. Absolute paths are not friendly for team development nor are they friendly for cross-platform development.

The simplest setup is to just place a **revive.toml** in your project root. But again, since `go.lintFlags` doesn't seem to support passing vscode built-in variables, it wont fill in your workspace root directory (_the absolute path the VSCode currently has opened in the window_) prior to running the revive linter.

Not only am I trying to support the simple setup behavior but I am also trying to support configuring per-project level linter configs mainly because I would prefer not to have my company revive linter config being applied to all projects outside of work-related code.

## Basic Configuration
Let me give a few examples below and describe what things mean and how it builds your dynamic path.

**.vscode/settings.json**
```json
"go.lintOnSave": "off",

"reviver.enable": true,
"reviver.lintFlags": [
    "-config",
    "${dirs:workspace,workspaceParent,userHome}/revive.toml"
],
"reviver.lintOnSave": true
```

In the above snippet we turn off `lintOnSave` for the official Go extensions package since Go Reviver will be handling lint on save unless you've turned it off as well, its on by default. We don't need both extensions trying to compete to run and process linter output.

Now the fun part: `${dirs:}`, if this special syntax is detected each special term following the `:` will be placed in an ordered array. These are the directories we will be searching for `revive.toml` in. The paths are built for you and the 3 terms listed have a special meaning and are currently the only ones supported.
- **workspace** - This is the workspace root AKA the folder you have opened in VSCode.
- **workspaceParent** - This is one parent directory up from the workspace root. This variable is more useful when you have a parent project that hosts multiple Go projects inside of it and you want your linter config sitting at the parent root while all sub projects can still refer to the same config.
- **userHome** - This is equivalent to `$HOME` on Mac/Linux or `%USERPROFILE%` on Windows.

You can place these in any order you want they run left to right and the first path to match the existing file wins.


### More Dynamic
Instead of hardcoding a filename we can use this special term `${filename}` as well.

**.vscode/settings.json**
```json
"go.lintOnSave": "off",

"reviver.enable": true,
"reviver.lintFlags": [
    "-config",
    "${dirs:workspace,workspaceParent,userHome}/${filename}"
],
"reviver.lintOnSave": true
```

All the same rules as before still apply for directory searching but now the filename will be determined by the workspace root folder name. So if you opened your code editor into a folder path such as: `/home/dev/code/mycompany/my-project` then `my-project.toml` would be the `${filename}`. It would search in this order:

1. `/home/dev/code/mycompany/my-project`
2. `/home/dev/code/mycompany`
3. `/home/dev/my-project`


### Per-project Linter Configuration
Documentation - Work in progress