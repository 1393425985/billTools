declare namespace ICache {
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
  export interface colorItem {
    color: string;
    name: string;
  }
  export interface bezierItem {
    name: string;
    info: {
      x: number;
      y: number;
    }[];
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
    color: {
      list: colorItem[];
    };
    bezier: {
      list: bezierItem[];
    };
  }
  export interface config {
    creator: IUser.UserInfo['id'];
    type: 'config';
    data: Partial<model>;
  }
  export type getConfigRs = IG.RS<config>;
}
