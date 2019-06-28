import React, { useState } from 'react';
import { Menu, Icon } from 'antd';
import ProjectPanel from '../ProjectPanel';
import ColorPanel from '../ColorPanel';
import BezierPanel from '../BezierPanel';
import ConfigPanel from '../ConfigPanel';
import TransferPanel from '../TransferPanel';
import s, { IMenuLess } from './menu.less';
const styles = s as Partial<IMenuLess>;

export default function() {
  const [selectedKeys, setSelectedKeys] = useState(['1']);
  return (
    <div className={styles.wrap}>
      <div>
        <Menu
          defaultSelectedKeys={selectedKeys}
          mode="inline"
          theme="dark"
          inlineCollapsed
          onSelect={({ selectedKeys }) => {
            setSelectedKeys(selectedKeys);
          }}
        >
          <Menu.Item key="1">
            <Icon type="desktop" />
            <span>启动器</span>
          </Menu.Item>
          <Menu.Item key="2">
            <Icon type="pie-chart" />
            <span>颜色</span>
          </Menu.Item>
          <Menu.Item key="3">
            <Icon type="inbox" />
            <span>贝塞尔</span>
          </Menu.Item>
          <Menu.Item key="4">
            <Icon type="appstore" />
            <span>国际化</span>
          </Menu.Item>
          <Menu.Item key="99">
            <Icon type="setting" />
            <span>设置</span>
          </Menu.Item>
        </Menu>
      </div>
      <div>
        {selectedKeys.includes('1') && <ProjectPanel />}
        {selectedKeys.includes('2') && <ColorPanel />}
        {selectedKeys.includes('3') && <BezierPanel />}
        {selectedKeys.includes('4') && <TransferPanel />}
        {selectedKeys.includes('99') && <ConfigPanel />}
      </div>
    </div>
  );
}
