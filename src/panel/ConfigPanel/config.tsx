import React, { Component } from 'react';
import { Button, Input, InputNumber, Radio, AutoComplete } from 'antd';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import classnames from 'classnames';
import $ from 'jquery';
import { getFile } from '@utils/utils';
import { apiTransfer } from '@services/api';
import s, { IConfigLess } from './config.less';
const pkg = require('../../../package.json');

const { remote } = require('electron');
const path = require('path');

const styles = s as Partial<IConfigLess>;


interface ConfigStateProps {
  project: ModelTypes.model['project'];
}
interface ConfigDispatchProps {
  dispatch: Dispatch;
}
interface ConfigOwnProps {}
type ConfigModalProps = ConfigStateProps & ConfigDispatchProps & ConfigOwnProps;

interface ConfigModalState {
  autoComplete: string[];
}
export class ConfigModal extends Component<
  Partial<ConfigModalProps>,
  ConfigModalState
> {
  state = {
    autoComplete: [],
  };
  autoCompleteSource: string[] = [];
  autoCompleteMap: { [key: string]: string } = {};
  componentDidMount() {
    const autoComplete = [];
    $(`.${styles.wrap} .${styles.block}`).each((i, dom) => {
      autoComplete.push(dom.dataset.name);
      this.autoCompleteMap[dom.dataset.name] = dom.id;
    });
    this.autoCompleteSource = autoComplete.concat();
    this.setState({
      autoComplete,
    });
  }
  onChangeProject = (key, value) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'project/update',
      payload: {
        [key]: value,
      },
    });
  };
  onChangeSearch = v => {
    this.setState({
      autoComplete: this.autoCompleteSource.filter(
        s => s.toLocaleLowerCase().indexOf(v.toLocaleLowerCase()) > -1,
      ),
    });
  };
  onSearch = v => {
    location.href = `#${this.autoCompleteMap[v]}`;
  };
  render() {
    const {
      project: { svnDays, packageCode },
    } = this.props;
    const { autoComplete } = this.state;
    return (
      <div className={styles.wrap}>
        <div className={classnames(styles.searchWrap)}>
          <AutoComplete
            dataSource={autoComplete}
            style={{ width: 200 }}
            onSelect={this.onSearch}
            onSearch={this.onChangeSearch}
            placeholder="Search..."
          />
        </div>
        <div id="version" data-name="版本" className={styles.block}>
          <label className={styles.title} htmlFor="">
            版本 {pkg.version}
          </label>
          <div className={styles.block}>
            <Button>检查更新</Button>
          </div>
        </div>
        <div id="project" data-name="项目" className={styles.block}>
          <label className={styles.title} htmlFor="">
            项目
          </label>
          <div id="svnDays" data-name="补丁SVN天数" className={styles.block}>
            <label className={styles.title} htmlFor="">
              补丁SVN天数
            </label>
            <InputNumber
              min={1}
              max={10}
              value={svnDays}
              onChange={this.onChangeProject.bind(this, 'svnDays')}
            />
          </div>
          <div id="packageCode" data-name="包管理" className={styles.block}>
            <label className={styles.title} htmlFor="">
              包管理
            </label>
            <Radio.Group
              onChange={e => {
                this.onChangeProject('packageCode', e.target.value);
              }}
              value={packageCode}
            >
              <Radio value="yarn">yarn</Radio>
              <Radio value="npm">npm</Radio>
              <Radio value="cnpm">cnpm</Radio>
            </Radio.Group>
          </div>
        </div>
      </div>
    );
  }
}
export default connect<ConfigStateProps, ConfigDispatchProps, ConfigOwnProps>(
  (state: ModelTypes.model) => ({
    project: state.project,
  }),
  null,
  null,
  { forwardRef: true },
)(ConfigModal);
