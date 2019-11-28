import React from 'react';
import { Icon, Avatar } from 'antd';
import { Link, Redirect, Route, Switch } from 'react-router-dom';
import classnames from 'classnames';
import ImageControl from '@utils/img';
import Login from '@panel/User/Login';
import Register from '@panel/User/Register';
import s, { IIndexLess } from './index.less';
const styles = s as Partial<IIndexLess>;
export interface IUserLayoutProps {
  history?: History;
  location?: Location;
  dispatch?: (param: object) => Promise<any>;
  match: {
    path: string;
    url: string;
    params: {
      url: 'login' | 'register';
    };
  };
}
export default function(props: IUserLayoutProps) {
  const { match } = props;
  return (
    <div className={styles.wrap}>
      <div className={styles.top}>
        <div className={styles.header}>
          <Link to="/">
            <img
              src={ImageControl.getAvatar('5d5d0c5e18de021b640fe14b')}
              alt="logo"
              width="32"
            />
            <span className={classnames(styles.title, styles.lightText)}>
              Management
            </span>
          </Link>
        </div>
        <div className={classnames(styles.desc, styles.lightText)}>By Bill</div>
      </div>
      <Switch>
        <Route path="/user/login" component={Login} exact />
        <Route path="/user/register" component={Register} exact />
        <Redirect exact from="/user" to="/user/login" />
      </Switch>
    </div>
  );
}
