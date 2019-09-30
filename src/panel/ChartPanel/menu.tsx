import React, { useState } from 'react';
import { Menu, Icon } from 'antd';
import s, { IMenuLess } from './menu.less';
import Graph from './Graph';
import Group from './Group';
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
            <span>关系图</span>
          </Menu.Item>
          <Menu.Item key="2">
            <Icon type="pie-chart" />
            <span>分组图</span>
          </Menu.Item>
        </Menu>
      </div>
      <div>
        {selectedKeys.includes('1') && <Graph />}
        {selectedKeys.includes('2') && <Group />}
      </div>
    </div>
  );
}
