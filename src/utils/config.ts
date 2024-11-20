import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';

import { currentWorkingDirectory, findFirstAccessibleFile } from './fs';
import { ExtensionConfig, GoLintConfig, ProjectConfig, Projects } from "../types/config";


export function getExtensionConfig(defaultLinter: string): ExtensionConfig{
	const goExtConfig = vscode.workspace.getConfiguration('go');
	const linter = goExtConfig.get('lintTool', defaultLinter);
	const linterFlags = goExtConfig.get('lintFlags', [] as string[]);

  const config = vscode.workspace.getConfiguration('golintwrap');
  const workspaceRoot = currentWorkingDirectory();
  const projectConfigs = config.get('projects') || undefined;

  let projects: Projects = new Map<string, ProjectConfig>();
  if(projectConfigs) {
    for(const [projectName, projectConfig] of Object.entries(projectConfigs)) {
      projects.set(projectName, projectConfig as ProjectConfig);
    }
  }

  return {
    enable: config.get('enable') as boolean,
		lintTool: linter,
    lintFlags: linterFlags,
    fallback: config.get('fallback', {}) as ProjectConfig,
    projects: projects,
    workspace: workspaceRoot
  };
}

export function configHasChanged(e: vscode.ConfigurationChangeEvent): boolean {
	return e.affectsConfiguration('go.lintFlags') || e.affectsConfiguration('go.lintTool') || e.affectsConfiguration('golintwrap');
}

export async function processConfig(rawConfig: ExtensionConfig): Promise<GoLintConfig> {
  const projectName = path.basename(rawConfig.workspace);
  let projectConfig = rawConfig.projects?.get(projectName) || rawConfig.fallback;

  if(!projectConfig) {
    // if we still dont have a project config, try to generate the path from the workspace directory.
    // ultimate fallback when there are no configs to use at all.
    projectConfig = {
      useStaticFilename: false,
      filename: projectName + '.toml'
    }
  }
  // figure out the filename if fallback is disabled
  const filename = projectConfig.useStaticFilename ? projectConfig.filename : projectName + '.toml';

	// whether the linter should enabled based on us valid processing 
	let enabled: boolean = false;

  let processedFlags: string[] = [];
	// process ${filename} first
	for(let flag of rawConfig.lintFlags) {
		if(flag.indexOf('${filename}') !== -1) {
			flag = flag.replace(/\${filename}/g, filename);
		}

		if(flag.indexOf('${') === -1) {
			// didnt find any variables, just push the flag into the args without processing
			processedFlags.push(flag);
			continue;
		}

		// look for ${dirs: prefix
		const dirsStartIndex = flag.indexOf('${dirs:');
		if(dirsStartIndex === -1) {
			// no prefix found, just push the flag into the args without processing
			continue;
		}

		const lastIndex = flag.lastIndexOf('}');
		if (lastIndex === -1) {
			// no closing brace found, just push the flag into the args without processing
			continue;
		}

		// found a variable, process it
		let configPaths: string[] = [];
		// slice off the ${dirs:} prefix and the trailing }
		const dirName = flag.substring(dirsStartIndex+7, lastIndex);
		// split the comma separated list of directories
		const dirs = dirName.split(',');

		const remainingPath = flag.substring(lastIndex + 1);

		for(let dir of dirs) {
			dir = dir.trim();
			console.log(dir);
			switch(dir) {
				case 'workspace':
					configPaths.push(path.join(rawConfig.workspace, remainingPath));
					break;
				case 'workspaceParent':
					configPaths.push(path.join(path.dirname(rawConfig.workspace), remainingPath));
					break;
				case 'userHome':
					switch(os.platform()) {
						case 'win32':
							configPaths.push(path.join(process.env.USERPROFILE || '', remainingPath));
							break;
						default:
							configPaths.push(path.join(process.env.HOME || '', remainingPath));
							break;
					}
					break;
			}
		}

		if(configPaths.length === 0) {
			// no valid directories found, just push the flag into the args without processing
			console.log("No valid directories found for: ", dirName);
			continue;
		}	

		
		let foundPath = await findFirstAccessibleFile(configPaths);
		console.log("the found path: ", foundPath);
		if(foundPath) {
			processedFlags.push(foundPath);
			enabled = true;
		}else {
			console.error("No config file found for: ", configPaths);
			foundPath = configPaths[configPaths.length - 1];
			processedFlags.push(foundPath);
		}
	}

	return new Promise(resolve => {
		resolve({
			enabled: enabled,
      lintTool: rawConfig.lintTool,
      lintFlags: processedFlags,
      workspace: rawConfig.workspace,
      project: projectConfig
    } as GoLintConfig);
	});
}