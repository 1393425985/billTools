import React, { Fragment } from 'react';
import { connect, DispatchProp } from 'react-redux';
import { Switch, Redirect, Route } from 'react-router-dom';
import { Layout, Spin } from 'antd';
import classNames from 'classnames';
import GlobalHeader from '@components/GlobalHeader';
import SiderMenu from '@components/SiderMenu';
import logo from '@assets/logo.svg';
import ProjectPanel from '@panel/ProjectPanel';
import ColorPanel from '@panel/ColorPanel';
import BezierPanel from '@panel/BezierPanel';
import ConfigPanel from '@panel/ConfigPanel';
import TransferPanel from '@panel/TransferPanel';
import ChartPanel from '@panel/ChartPanel';

import { getMenuData } from './menu';
import s, { IIndexLess } from './index.less';
const { Content, Header } = Layout;
/**
 * 根据菜单取得重定向地址.
 */
const redirectData = [];
const getRedirect = item => {
  if (item && item.children) {
    if (item.children[0] && item.children[0].path) {
      redirectData.push({
        from: `${item.path}`,
        to: `${item.children[0].path}`,
      });
      item.children.forEach(children => {
        getRedirect(children);
      });
    }
  }
};

getMenuData().forEach(getRedirect);
const styles = s as Partial<IIndexLess>;
type IBaseLayoutProps = {
  userStore: IUser.Model;
} & IG.IProps &
  DispatchProp & {};
interface IBaseLayoutState {}
class BaseLayout extends React.PureComponent<
  IBaseLayoutProps,
  IBaseLayoutState
> {
  state = {};
  updateConfigTimer: any;
  componentDidMount() {
    const { userStore, dispatch } = this.props;
    if (userStore.isOnline && !userStore.loginInfo.status) {
      dispatch({
        type: 'saga/user/loginLast',
      });
    }
    this.updateConfigTimer = setInterval(() => {
      dispatch({
        type: 'saga/user/updateConfig',
      });
    }, 60000);
    window.addEventListener('offline', this.handleOffLine);
    window.addEventListener('online', this.handleOnLine);
  }
  componentWillUnmount() {
    if (this.updateConfigTimer) {
      clearInterval(this.updateConfigTimer);
      this.updateConfigTimer = undefined;
    }
    window.removeEventListener('offline', this.handleOffLine);
    window.removeEventListener('online', this.handleOnLine);
  }
  private handleOnLine = () => {
    this.props.dispatch({
      type: 'saga/user/changeIsOnline',
      payload: true,
    });
  };
  private handleOffLine = () => {
    this.props.dispatch({
      type: 'saga/user/changeIsOnline',
      payload: false,
    });
  };
  private handleMenuCollapse = collapsed => {
    this.props.dispatch({
      type: 'saga/user/changeCollapsed',
      payload: collapsed,
    });
  };
  private handleMenuClick = ({ key }) => {};
  render() {
    const { userStore, location, match } = this.props;
    const { collapsed, info, isOnline } = userStore;
    const layout = info ? (
      <Layout style={{ width: '100%', height: '100%' }}>
        <SiderMenu
          logo={logo}
          menuData={getMenuData().filter(v => (isOnline ? true : v.offline))}
          collapsed={collapsed}
          location={location}
          isMobile={false}
          onCollapse={this.handleMenuCollapse}
        />
        <Layout>
          <Header style={{ padding: 0 }}>
            <GlobalHeader
              logo={logo}
              currentUser={info}
              collapsed={collapsed}
              isMobile={false}
              onCollapse={this.handleMenuCollapse}
              onMenuClick={this.handleMenuClick}
            />
          </Header>
          <Content style={{ height: '100%' }}>
            {redirectData.map(item => (
              <Redirect key={item.from} exact from={item.from} to={item.to} />
            ))}
            <Switch>
              <Route path="/project" component={ProjectPanel} exact />
              <Route path="/config" component={ConfigPanel} exact />
              {isOnline ? (
                <Fragment>
                  <Route path="/color" component={ColorPanel} exact />
                  <Route path="/bessel" component={BezierPanel} exact />
                  <Route path="/i18n" component={TransferPanel} exact />
                  <Route path="/chart" component={ChartPanel} exact />
                </Fragment>
              ) : null}
            </Switch>
            <Redirect from="/" to="/project" exact />
          </Content>
        </Layout>
      </Layout>
    ) : (
      <div className={styles.spinWrap}>
        <Spin spinning size="large" tip="页面正在准备中"></Spin>
      </div>
    );

    return layout;
  }
}
export default connect(({ user }: any) => ({ userStore: user }))(BaseLayout);
