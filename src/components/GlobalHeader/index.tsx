import React, { PureComponent } from 'react';
import { Menu, Icon, Spin, Dropdown, Avatar, Divider } from 'antd';
import { Link } from 'react-router-dom';
import _ from 'lodash';
import s, { IIndexLess } from './index.less';
const styles = s as Partial<IIndexLess>;
type IGlobalHeaderProps = {
  collapsed: IUser.Model['collapsed'];
  isMobile: boolean;
  currentUser: IUser.Model['info'];
  logo?: string;
  onCollapse: (collapsed: boolean) => void;
  onMenuClick: (params: { key: string }) => void;
};
interface IGlobalHeaderState {
  isMobile: boolean;
}
export default class GlobalHeader extends PureComponent<
  IGlobalHeaderProps,
  IGlobalHeaderState
> {
  constructor(props, context) {
    super(props, context);
    this.deb = _.debounce(this.triggerResizeEvent, 600);
  }
  deb: (() => void) & _.Cancelable;
  componentWillUnmount() {
    this.deb.cancel();
  }

  toggle = () => {
    const { collapsed, onCollapse } = this.props;
    onCollapse(!collapsed);
    this.triggerResizeEvent();
  };
  /* eslint-disable*/
  triggerResizeEvent() {
    const event = document.createEvent('HTMLEvents');
    event.initEvent('resize', true, false);
    window.dispatchEvent(event);
  }
  render() {
    const { currentUser, collapsed, isMobile, logo, onMenuClick } = this.props;
    const menu = (
      <Menu className={styles.menu} selectedKeys={[]} onClick={onMenuClick}>
        <Menu.Item disabled>
          <Icon type="user" />
          个人中心
        </Menu.Item>
        <Menu.Item disabled>
          <Icon type="setting" />
          设置
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item key="logout">
          <Icon type="logout" />
          退出登录
        </Menu.Item>
      </Menu>
    );
    return (
      <div className={styles.header}>
        {isMobile && [
          <Link to="/" className={styles.logo} key="logo">
            <img src={logo} alt="logo" width="32" />
          </Link>,
          <Divider type="vertical" key="line" />,
        ]}
        <Icon
          className={styles.trigger}
          type={collapsed ? 'menu-unfold' : 'menu-fold'}
          onClick={this.toggle}
        />
        <div className={styles.right}>
          {currentUser.name ? (
            <Dropdown overlay={menu}>
              <span className={`${styles.action} ${styles.account}`}>
                <Avatar
                  size="small"
                  className={styles.avatar}
                  //   src={currentUser.picture}
                >
                  {currentUser.name}
                </Avatar>
                <span className={styles.name}>{currentUser.name}</span>
              </span>
            </Dropdown>
          ) : (
            <Spin size="small" style={{ marginLeft: 8 }} />
          )}
        </div>
      </div>
    );
  }
}
