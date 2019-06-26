import React, { Component, createRef } from 'react';
import {
  Modal,
  Button,
  Dropdown,
  Menu,
  Icon,
  notification,
  Table,
  Input,
} from 'antd';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import moment from 'moment';
import X2JS from '@utils/x2js';
import s, { IPatchLess } from './patch.less';

const { remote, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const glob = require('glob');
const { exec } = require('child_process');
const { dialog } = remote;

const styles = s as Partial<IPatchLess>;

const onError = data => {
  console.log('stderr: ', data);
  notification.error({
    message: 'stderr',
    description: data,
  });
};
interface PatchStateProps {
  project: ModelTypes.model['project'];
}
interface PatchDispatchProps {
  dispatch: Dispatch;
}
interface PatchOwnProps {}
type PatchModalProps = PatchStateProps & PatchDispatchProps & PatchOwnProps;
interface DataItem {
  _revision: string;
  date: string;
  msg: string;
  author: string;
  paths: {
    path: {
      __text: string;
      _action: 'M' | 'D' | 'A';
      _kind: 'file' | 'folder';
    };
  };
}
interface PatchModalState {
  show: boolean;
  data: DataItem[];
  searchText: string;
  tableLoading: boolean;
  url: string;
  exportSpinner: boolean;
}
export class PatchModal extends Component<
  Partial<PatchModalProps>,
  PatchModalState
> {
  state = {
    show: false,
    data: [],
    searchText: '',
    tableLoading: false,
    url: '',
    exportSpinner: false,
  };
  x2js = new X2JS();
  searchInput = createRef<Input>();
  fromPath: string = '';
  componentDidUpdate() {
    const {
      project: { patchPath },
    } = this.props;
    if (!this.state.url) {
      this.getSvnUrl(patchPath);
    }
  }
  public show = (fromPath: string) => {
    this.setState({
      show: true,
    });
    this.getSvnList(fromPath);
    this.fromPath = fromPath;
  };
  private getSvnList(cmdPath: string) {
    const {
      project: { svnDays },
    } = this.props;
    let xmlStr = '';
    this.setState({
      tableLoading: true,
    });
    const workerProcess = exec(
      `svn log -r {${moment()
        .add(-svnDays, 'days')
        .format('YYYY-MM-DD')}}:{${moment()
        .add(1, 'days')
        .format('YYYY-MM-DD')}} -v --xml`,
      { cwd: cmdPath },
    );
    workerProcess.stdout.on('data', data => {
      xmlStr += data;
      console.log('stdout');
    });
    workerProcess.stderr.on('data', onError);
    workerProcess.on('close', code => {
      console.log('out code：', code);
      const xml = this.x2js.xml_str2json(xmlStr);
      xmlStr = '';
      this.setState({
        tableLoading: false,
      });
      if (xml && xml.log && xml.log.logentry) {
        this.setState({
          data: xml.log.logentry.length ? xml.log.logentry : [xml.log.logentry],
        });
      }
    });
  }
  private getSvnUrl(cmdPath: string) {
    let xmlStr = '';
    const workerProcess = exec(`svn info --xml`, { cwd: cmdPath });
    workerProcess.stdout.on('data', data => {
      xmlStr += data;
      console.log('stdout');
    });

    // 打印错误的后台可执行程序输出
    workerProcess.stderr.on('data', onError);

    // 退出之后的输出
    workerProcess.on('close', code => {
      console.log('out code：', code);
      const xml = this.x2js.xml_str2json(xmlStr);
      xmlStr = '';
      if (xml && xml.info) {
        this.setState({
          url: xml.info.entry.repository.root,
        });
      }
    });
  }
  private getColumns() {
    const { data, url, exportSpinner } = this.state;
    const userFilterArr = Array.from(new Set(data.map(v => v.author))).map(
      v => ({
        text: v,
        value: v,
      }),
    );

    return [
      {
        title: '版本',
        dataIndex: '_revision',
        width: 120,
        sorter: (a: DataItem, b: DataItem) =>
          Number(a._revision) - Number(b._revision),
      },
      {
        title: '时间',
        dataIndex: 'date',
        width: 200,
        sorter: (a: DataItem, b: DataItem) =>
          +new Date(a.date) - +new Date(b.date),
        render: (text: DataItem['date']) =>
          moment(text).format('MM-DD HH:mm:ss'),
      },
      {
        title: '说明',
        dataIndex: 'msg',
        filterDropdown: ({
          setSelectedKeys,
          selectedKeys,
          confirm,
          clearFilters,
        }) => (
          <div className="antdTable-dropdown">
            <Input
              ref={this.searchInput}
              placeholder="搜索..."
              value={selectedKeys[0]}
              onChange={e =>
                setSelectedKeys(e.target.value ? [e.target.value] : [])
              }
              onPressEnter={this.handleSearch(selectedKeys, confirm)}
            />
            <Button
              type="primary"
              onClick={this.handleSearch(selectedKeys, confirm)}
            >
              确定
            </Button>
            <Button onClick={this.handleReset(clearFilters)}>重置</Button>
          </div>
        ),
        filterIcon: filtered => (
          <Icon
            type="search"
          />
        ),
        onFilter: (value, record) =>
          record.msg.toLowerCase().includes(value.toLowerCase()),
        onFilterDropdownVisibleChange: visible => {
          if (visible) {
            setTimeout(() => {
              this.searchInput.current.focus();
            });
          }
        },
        render: (text: DataItem['msg'],info:DataItem) => {
          const { searchText } = this.state;
          return (
            <a href="javascript:;" onClick={this.onLook.bind(this, info._revision)}>
              {searchText ? (
                <span>
                  {text
                    .split(
                      new RegExp(`(?<=${searchText})|(?=${searchText})`, 'i'),
                    )
                    .map((fragment, i) =>
                      fragment.toLowerCase() === searchText.toLowerCase() ? (
                        <span key={i} className={styles.highlight}>
                          {fragment}
                        </span>
                      ) : (
                        fragment
                      ),
                    )}
                </span>
              ) : (
                text
              )}
            </a>
          );
        },
      },

      {
        title: '操作人',
        dataIndex: 'author',
        filters: userFilterArr,
        width: 100,
        onFilter: (value: DataItem['author'], record: DataItem) =>
          record.author === value,
      },

      {
        title: '操作',
        dataIndex: 'x',
        width: 120,
        render: (id, info: DataItem) => (
          <Button.Group>
            <Button
              key="look"
              title="查看更改"
              icon="diff"
              size="small"
              onClick={this.onLook.bind(this, info._revision)}
            />
            <Button
              disabled={!url}
              loading={exportSpinner}
              key="down"
              title="补丁"
              icon="download"
              size="small"
              onClick={this.onExport.bind(this, info._revision)}
            />
          </Button.Group>
        ),
      },
    ];
  }
  private handleReset = clearFilters => () => {
    clearFilters();
    this.setState({ searchText: '' });
  };
  private handleSearch = (selectedKeys, confirm) => () => {
    confirm();
    this.setState({ searchText: selectedKeys[0] });
  };
  private svnExport: (
    info: DataItem['paths']['path'],
    _revision: DataItem['_revision'],
  ) => Promise<{
    status: boolean;
    type: DataItem['paths']['path']['_action'];
    targetPath: string;
  }> = (info, _revision) => {
    const filePath = info.__text;
    const type = info._action;

    const {
      project: { patchPath },
    } = this.props;
    const { url } = this.state;
    let targetPath;
    let workerProcess;
    let filePathArr = path.normalize(filePath).split(path.sep);
    return new Promise(resolve => {
      if (type === 'M') {
        let fileSliceIndex;
        path
          .normalize(filePath)
          .split(path.sep)
          .some((p, i) => {
            if (p) {
              const isE = fs.existsSync(
                path.join(path.normalize(patchPath), ...filePathArr.slice(i)),
              );
              if (isE) {
                fileSliceIndex = i;
                return true;
              }
            }
            return false;
          });
        if (fileSliceIndex !== undefined) {
          filePathArr = filePathArr.slice(fileSliceIndex);
          targetPath = path.join(patchPath, ...filePathArr);
          fs.unlinkSync(targetPath);
          workerProcess = exec(
            `svn export -r ${_revision} ${url}${filePath} ${targetPath}`,
            { cwd: this.fromPath },
          );
        } else {
          resolve({
            status: false,
            type,
            targetPath: targetPath || filePath,
          });
        }
      } else if (type === 'A') {
        let fileSliceIndex;
        path
          .normalize(filePath)
          .split(path.sep)
          .some((p, i) => {
            if (p) {
              const isE = fs.existsSync(
                path.join(
                  path.normalize(patchPath),
                  ...filePathArr.slice(i, filePathArr.length - 1),
                ),
              );
              if (isE) {
                fileSliceIndex = i;
                return true;
              }
            }
            return false;
          });
        if (fileSliceIndex !== undefined) {
          filePathArr = filePathArr.slice(fileSliceIndex);
          targetPath = path.join(patchPath, ...filePathArr);
        } else {
          targetPath = patchPath;
        }
        workerProcess = exec(
          `svn export -r ${_revision} ${url}${filePath} ${targetPath}`,
          { cwd: this.fromPath },
        );
      }
      if (workerProcess) {
        workerProcess.stdout.on('data', data => {
          console.log('stdout', data);
        });
        workerProcess.stderr.on('data', () => {
          resolve({
            status: false,
            type,
            targetPath: targetPath || filePath,
          });
        });
        workerProcess.on('close', () => {
          resolve({
            status: true,
            type,
            targetPath: targetPath || filePath,
          });
        });
      } else {
        resolve({
          status: false,
          type,
          targetPath: targetPath || filePath,
        });
      }
    });
  };
  private onOpenFolder = cmdPath => {
    shell.showItemInFolder(path.join(cmdPath, 'package.json'));
  };
  private onSetPath = () => {
    dialog.showOpenDialog(
      {
        properties: ['openDirectory'],
      },
      fileNames => {
        if (fileNames) {
          const { dispatch } = this.props;
          const targetPath = fileNames[0];
          this.getSvnUrl(targetPath);
          dispatch({
            type: 'project/update',
            payload: {
              patchPath: targetPath,
            },
          });
        }
      },
    );
  };
  private onRunSVN = (cmdPath, e) => {
    const workerProcess = exec(
      `TortoiseProc.exe /path:"./" /command:${e.key}`,
      { cwd: cmdPath },
    );
    workerProcess.stdout.on('data', data => {
      console.log('stdout: ', data);
    });

    workerProcess.stderr.on('data', onError);

    // 退出之后的输出
    workerProcess.on('close', code => {
      console.log('out code：', code);
    });
  };
  private onLook = _revision => {
    const { data } = this.state;
    const target = data.find(v => v._revision === _revision);
    if (target) {
      const paths =
        target.paths.path.length === undefined
          ? [target.paths.path]
          : target.paths.path;
      Modal.info({
        title: '修改',
        width: '60vw',
        content: (
          <div className={styles.changeWrap}>
            {paths.map((v, i) => (
              <div
                key={i}
                style={{
                  color:
                    v._action === 'A'
                      ? '#52c41a'
                      : v._action === 'D'
                      ? '#f5222d'
                      : '#1890ff',
                }}
              >
                <span className={styles.highlight}>
                  {v._action === 'A' && <Icon type="plus-square" />}
                  {v._action === 'D' && <Icon type="delete" />}
                  {v._action === 'M' && <Icon type="copy" />}
                </span>
                {v.__text}
              </div>
            ))}
          </div>
        ),
        onOk() {},
      });
    }
  };
  private onExport = _revision => {
    const {} = this.props;
    const { data } = this.state;
    const target = data.find(v => v._revision === _revision);
    if (target) {
      const paths: DataItem['paths']['path'][] =
        target.paths.path.length === undefined
          ? [target.paths.path]
          : target.paths.path;
      this.setState({
        exportSpinner: true,
      });
      Promise.all(paths.map(info => this.svnExport(info, _revision))).then(
        rs => {
          this.setState({
            exportSpinner: false,
          });
        },
      );
    }
  };
  private handleCancel = () => {
    this.setState({
      show: false,
      searchText: '',
    });
    this.fromPath = '';
  };
  private handleOK = () => {
    const {
      project: { patchPath },
    } = this.props;
    this.onRunSVN(patchPath, { key: 'commit' });
  };
  render() {
    const { show, data, tableLoading, exportSpinner } = this.state;
    const {
      project: { patchPath },
    } = this.props;
    return (
      <Modal
        title="补丁管理"
        visible={show}
        width="90vw"
        onCancel={this.handleCancel}
        onOk={this.handleOK}
        okButtonProps={{
          loading: exportSpinner,
        }}
        cancelText="关闭"
        okText="提交"
      >
        <div className={styles.wrap}>
          <div className={styles.toolWrap}>
            <div>
              {patchPath ? (
                <span
                  className={styles.href}
                  onClick={this.onOpenFolder.bind(this, patchPath)}
                >
                  {path
                    .normalize(patchPath)
                    .split(path.sep)
                    .slice(-3)
                    .join(path.sep)}
                </span>
              ) : (
                <span className={styles.href}>请先设置补丁路径</span>
              )}
            </div>
            <div>
              <Button.Group>
                <Button type="primary" onClick={this.onSetPath}>
                  设置
                </Button>
                <Dropdown
                  disabled={!patchPath}
                  overlay={
                    <Menu onClick={this.onRunSVN.bind(this, patchPath)}>
                      <Menu.Item key="log">
                        <Icon type="file-text" />
                        日志
                      </Menu.Item>
                      <Menu.Item key="update">
                        <Icon type="sync" />
                        更新
                      </Menu.Item>
                      <Menu.Item key="commit">
                        <Icon type="upload" />
                        提交
                      </Menu.Item>
                    </Menu>
                  }
                >
                  <Button type="primary">SVN</Button>
                </Dropdown>
              </Button.Group>
            </div>
          </div>
          <div className={styles.listWrap}>
            <Table
              rowKey="_revision"
              showHeader
              pagination={false}
              size="small"
              columns={this.getColumns()}
              dataSource={data}
              loading={tableLoading}
              locale={{
                filterConfirm: '确定',
                filterReset: '重置',
                emptyText: '暂无数据',
              }}
              scroll={{
                y: 'calc(100vh - 450px)',
              }}
            />
          </div>
        </div>
      </Modal>
    );
  }
}
export default connect<PatchStateProps, PatchDispatchProps, PatchOwnProps>(
  (state: ModelTypes.model) => ({
    project: state.project,
  }),
  null,
  null,
  { forwardRef: true },
)(PatchModal);
