import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';

import { currentWorkingDirectory, findFirstAccessibleFile } from './fs';
import { ExtensionConfig, ReviverConfig, ProjectConfig, Projects } from "../types/config";


export function getExtensionConfig(): ExtensionConfig{
  const config = vscode.workspace.getConfiguration('reviver');
	const linterFlags = config.get<string[]>('lintFlags', []);
	const linterLevel = config.get<string>('lintLevel', 'all');
  const workspaceRoot = currentWorkingDirectory();
  const projectConfigs = config.get<ProjectConfig|undefined>('projects');

  let projects: Projects = new Map<string, ProjectConfig>();
  if(projectConfigs) {
    for(const [projectName, projectConfig] of Object.entries(projectConfigs)) {
      projects.set(projectName, projectConfig as ProjectConfig);
    }
  }

  return {
    enable: config.get<boolean>('enable', false),
		lintTool: 'revive',
    lintFlags: linterFlags,
		lintLevel: linterLevel,
    fallback: config.get<ProjectConfig>('fallback', {} as ProjectConfig),
    projects: projects,
    workspace: workspaceRoot
  };
}

export function configHasChanged(e: vscode.ConfigurationChangeEvent): boolean {
	return e.affectsConfiguration("go.lintOnSave") || e.affectsConfiguration('reviver');
}

export async function processConfig(rawConfig: ExtensionConfig): Promise<ReviverConfig> {
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
	let enabled: boolean = true;

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
		// split the comma separated list of directories: workspace,workspaceParent,userHome
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

		// using the config paths, try to find the first accessible file in the list
		let foundPath = await findFirstAccessibleFile(configPaths);
		if(foundPath) {
			processedFlags.push(foundPath);
			enabled = true;
		}else {
			enabled = false;
			break;
		}
	}

	return new Promise(resolve => {
		resolve({
			enabled: enabled,
      lintTool: rawConfig.lintTool,
      lintFlags: processedFlags,
			lintLevel: rawConfig.lintLevel,
      workspace: rawConfig.workspace,
      project: projectConfig
    } as ReviverConfig);
	});
}