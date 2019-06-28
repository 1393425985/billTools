import React, { Component } from 'react';
import { Button, Input, InputNumber, Radio, AutoComplete,notification,Progress  } from 'antd';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import classnames from 'classnames';
import $ from 'jquery';
import { getFile } from '@utils/utils';
import { apiTransfer } from '@services/api';
import s, { IConfigLess } from './config.less';
const pkg = require('../../../build/package.json');

const { remote,ipcRenderer  } = require('electron');
const path = require('path');

const styles = s as Partial<IConfigLess>;


interface ConfigStateProps {
  project: ModelTypes.model['project'];
  version: ModelTypes.model['version'];
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
  private autoCompleteSource: string[] = [];
  private autoCompleteMap: { [key: string]: string } = {};
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
  componentWillReceiveProps(nextProps:Partial<ConfigModalProps>){
    if(nextProps.version.step!==this.props.version.step){
      if(nextProps.version.step===0){
        notification.error({
          message: '更新失败',
          description: '请稍后再试',
        });
      }else if(nextProps.version.step===2 && nextProps.version.progress===undefined){
        notification.success({
          message: '当前为最新版本',
          description: '请稍后再试',
        });
      }
    }
  }
  private onChangeProject = (key, value) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'project/update',
      payload: {
        [key]: value,
      },
    });
  };
  private onChangeSearch = v => {
    this.setState({
      autoComplete: this.autoCompleteSource.filter(
        s => s.toLocaleLowerCase().indexOf(v.toLocaleLowerCase()) > -1,
      ),
    });
  };
  private onSearch = v => {
    location.href = `#${this.autoCompleteMap[v]}`;
  };
  private onCheckUpdate = ()=>{
    ipcRenderer.send('checkVersion');
  }
  render() {
    const {
      project: { svnDays, packageCode },
      version:{step,progress}
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
          <div>
            <Button loading={progress!==undefined || step===1} onClick={this.onCheckUpdate}>{step===1?'正在检查更新':progress!==undefined?'正在下载更新':'检查更新'}</Button>
            {progress&&<Progress percent={Number(progress.toFixed(0))} status="active" />}
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
    version: state.version
  }),
  null,
  null,
  { forwardRef: true },
)(ConfigModal);
