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
    project: {
      packageCode: 'yarn' | 'npm';
      svnDays: number;
      patchPath: string;
      list: projectItem[];
    };
  }
}
