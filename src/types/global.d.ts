declare namespace IG {
  export interface IProps {
    history?: History;
    location?: Location;
    match?: any;
  }
  export interface RS<data> {
    msg: string;
    success: boolean;
    data: data;
  }
}
