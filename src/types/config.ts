export interface ProjectConfig {
  useStaticFilename: boolean;
  filename: string;
}

export type Projects = Map<string, ProjectConfig>;

export interface ExtensionConfig {
  enable: boolean;
  lintTool: string;
  lintFlags: string[];
  fallback: ProjectConfig | undefined;
  projects: Projects | undefined;
  workspace: string;
}

export interface GoLintConfig {
  enabled: boolean;
  lintTool: string;
  lintFlags: string[];
  project: ProjectConfig;
  workspace: string;
}
