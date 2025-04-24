export interface ProjectConfig {
  useStaticFilename: boolean;
  filename: string;
}

export type Projects = Map<string, ProjectConfig>;

/* * The ExtensionConfig interface is a used to define the configuration for the Reviver extension.
  * It is used to define the raw configuration for the entire extension.
  *
  * @interface ExtensionConfig
  * @property {boolean} enable - Indicates whether the Reviver extension is enabled.
  * @property {string} lintTool - The linter tool to be used (e.g., "revive").
  * @property {string[]} lintFlags - An array of flags to be passed to the linter.
  * @property {string} lintLevel - The level of linting to be performed (e.g., "all").
  * @property {ProjectConfig} fallback - The fallback project configuration object.
  * @property {Projects} projects - A map of project configurations.
  * @property {string} workspace - The path to the workspace directory.
  */
export interface ExtensionConfig {
  enable: boolean;
  lintTool: string;
  lintFlags: string[];
  lintLevel: string;
  fallback: ProjectConfig | undefined;
  projects: Projects | undefined;
  workspace: string;
}


/* * The ReviverConfig interface is a used to define the configuration for the Reviver extension.
  * It is an intentional subset of the ExtensionConfig interface, it is constructed from the raw ExtensionConfig.
  *
  * @interface ReviverConfig
  * @property {boolean} enabled - Indicates whether the Reviver extension is enabled.
  * @property {string} lintTool - The linter tool to be used (e.g., "revive").
  * @property {string[]} lintFlags - An array of flags to be passed to the linter.
  * @property {string} lintLevel - The level of linting to be performed (e.g., "all").
  * @property {ProjectConfig} project - The project configuration object.
  * @property {string} workspace - The path to the workspace directory.
  */
export interface ReviverConfig {
  enabled: boolean;
  lintTool: string;
  lintFlags: string[];
  lintLevel: string;
  project: ProjectConfig;
  workspace: string;
}
