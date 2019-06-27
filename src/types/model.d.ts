declare namespace ModelTypes {
  export interface projectItem {
    name: string;
    type: 'npm' | 'folder';
    path: string;
    port: string;
    scripts: {
      npm: string[];
      cmd: string[];
    };
  }
  export interface model {
    version: {
      step: 0 | 1 | 2 | 3;
      progress: number;
    };
    project: {
      packageCode: 'yarn' | 'npm';
      svnDays: number;
      patchPath: string;
      list: projectItem[];
    };
  }
}
