import React, { Component, createRef } from 'react';

import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import {
  Button,
  notification,
  Popover,
  Input,
  Icon,
  Menu,
  Dropdown,
  Table,
  Tag,
} from 'antd';
import classnames from 'classnames';
import { getFile } from '@utils/utils';
import CmdModal from './cmd';
import PatchModalConnect, { PatchModal } from './patch';
import s, { IProjectLess } from './project.less';

const { remote, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const glob = require('glob');
const { exec } = require('child_process');
const { dialog } = remote;

const styles = s as Partial<IProjectLess>;
const onError = data => {
  console.log('stderr: ', data);
  notification.error({
    message: 'stderr',
    description: data,
  });
};
enum AddType {
  文件夹 = 'folder',
  扫描 = 'folders',
}

interface ProjectProps {
  dispatch: Dispatch;
  project: ModelTypes.model['project'];
}
interface ProjectState {
  search: string;
}
class Project extends Component<ProjectProps, ProjectState> {
  state = {
    search: '',
  };
  cmdModal = createRef<CmdModal>();
  patchModal = createRef<PatchModal>();
  private onAdd = e => {
    const { dispatch } = this.props;
    dialog.showOpenDialog(
      {
        properties: ['openDirectory'],
      },
      fileNames => {
        if (fileNames) {
          const {
            project: { list },
          } = this.props;
          const newList = list.concat();
          const targetPath = fileNames[0];
          const readPackage = (targetPath): Promise<ModelTypes.projectItem> => {
            const nameArr = path.normalize(targetPath).split(path.sep);
            const name = nameArr[nameArr.length - 1];
            return new Promise((resolve, reject) => {
              const packageFiles = glob.sync(
                path.join(targetPath, 'package.json'),
              );
              if (packageFiles.length) {
                getFile(packageFiles[0]).then(data => {
                  const packageData = JSON.parse(data);
                  resolve({
                    name: packageData.name || name,
                    type: 'npm',
                    path: path.dirname(packageFiles[0]),
                    port: undefined,
                    scripts: {
                      npm: Object.keys(packageData.scripts || {}),
                      cmd: [],
                    },
                  });
                });
              } else {
                resolve({
                  name,
                  type: 'folder',
                  path: path.normalize(targetPath),
                  port: undefined,
                  scripts: {
                    npm: [],
                    cmd: [],
                  },
                });
              }
            });
          };
          let packageFiles;
          switch (e.key) {
            case AddType.文件夹:
              readPackage(targetPath).then(item => {
                newList.unshift(item);
                dispatch({
                  type: 'project/update',
                  payload: {
                    list: newList,
                  },
                });
              });

              break;
            case AddType.扫描:
              packageFiles = glob.sync(path.join(targetPath, '*'));
              if (packageFiles.length) {
                const arr: Promise<ModelTypes.projectItem>[] = packageFiles
                  .filter(filedir => {
                    const stat = fs.lstatSync(filedir);
                    return stat.isDirectory();
                  })
                  .map(readPackage);
                Promise.all(arr).then(items => {
                  newList.unshift(...items);
                  dispatch({
                    type: 'project/update',
                    payload: {
                      list: newList,
                    },
                  });
                });
              }
              break;
          }
        }
      },
    );
  };
  private onRun = (cmdPath, key, e) => {
    if (e.key === 'custom') {
      const {
        project: { list },
        dispatch,
      } = this.props;
      const newList = list.concat();
      this.cmdModal.current.show({
        selected: list[Number(key)].scripts.cmd,
        onChnage: selected => {
          newList[Number(key)].scripts.cmd = selected;
          dispatch({
            type: 'project/update',
            payload: {
              list: newList,
            },
          });
        },
      });
      return;
    }
    // 执行命令行，如果命令不需要路径，或就是项目根目录，则不需要cwd参数：
    const workerProcess = exec(`start cmd /k ${e.key}`, { cwd: cmdPath });
    console.log(workerProcess);
    // 不受child_process默认的缓冲区大小的使用方法，没参数也要写上{}：workerProcess = exec(cmdStr, {})

    // 打印正常的后台可执行程序输出
    workerProcess.stdout.on('data', data => {
      console.log('stdout: ', data);
    });

    // 打印错误的后台可执行程序输出
    workerProcess.stderr.on('data', onError);

    // 退出之后的输出
    workerProcess.on('close', code => {
      console.log('out code：', code);
    });
  };
  private onRunSVN = (cmdPath, e) => {
    const cmdArr = ['log', 'update', 'commit'];
    if (cmdArr.includes(e.key)) {
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
    } else if (e.key === 'patch') {
      this.patchModal.current.show(cmdPath);
    }
  };
  private onRunCode = cmdPath => {
    const workerProcess = exec(`code -n ./`, { cwd: cmdPath });
    workerProcess.stdout.on('data', data => {
      console.log('stdout: ', data);
    });
    workerProcess.stderr.on('data', data => {
      console.log('stderr: ', data);
      this.onRunCodeNew(cmdPath);
    });
    workerProcess.on('close', code => {
      console.log('out code：', code);
    });
  };
  private onRunCodeNew = cmdPath => {
    const workerProcess = exec(`code-insiders -n ./`, { cwd: cmdPath });
    workerProcess.stdout.on('data', data => {
      console.log('stdout: ', data);
    });
    workerProcess.stderr.on('data', onError);
    workerProcess.on('close', code => {
      console.log('out code：', code);
    });
  };
  private onOpenFolder = cmdPath => {
    shell.showItemInFolder(path.join(cmdPath, 'package.json'));
  };
  private onChangePort = (key, e) => {
    if (isNaN(Number(e.target.value))) {
      notification.error({
        message: '端口号错误',
        description: '请输入正确的端口号',
      });
      return;
    }
    const {
      project: { list },
      dispatch,
    } = this.props;
    const newList = list.concat();
    newList[Number(key)].port = e.target.value;
    dispatch({
      type: 'project/update',
      payload: {
        list: newList,
      },
    });
  };
  private onOpenChrome = port => {
    shell.openExternal(`http://localhost${port ? `:${port}` : ''}`);
  };
  private onListChange = (key, e) => {
    const {
      project: { list },
      dispatch,
    } = this.props;
    const index = Number(key);
    let newList = list.concat();
    let target;
    switch (e.key) {
      case 'up':
        target = newList.splice(index, 1)[0];
        newList.splice(index - 1, 0, target);
        break;
      case 'down':
        target = newList.splice(index, 1)[0];
        newList.splice(index + 1, 0, target);
        break;
      case 'delete':
        newList = newList.filter((v, i) => i !== index);
        break;
    }
    dispatch({
      type: 'project/update',
      payload: {
        list: newList,
      },
    });
  };
  private onSearch = search => {
    this.setState({
      search,
    });
  };
  render() {
    const {
      project: { list, packageCode },
    } = this.props;
    const { search } = this.state;
    return (
      <div className={styles.wrap}>
        <div className={styles.toolWrap}>
          <Dropdown
            overlay={
              <Menu onClick={this.onAdd}>
                <Menu.Item key={AddType.文件夹}>
                  <Icon type="folder-add" />
                  文件夹
                </Menu.Item>
                <Menu.Item key={AddType.扫描}>
                  <Icon type="file-search" />
                  扫描文件夹
                </Menu.Item>
              </Menu>
            }
          >
            <Button type="primary">
              <Icon type="plus" />
            </Button>
          </Dropdown>
          <Input.Search
            placeholder="input search text"
            onSearch={this.onSearch}
            style={{
              width: '400px',
            }}
          />
        </div>
        <div className={styles.listWrap}>
          <Table
            showHeader={false}
            pagination={false}
            size="small"
            columns={[
              {
                title: 'Name',
                dataIndex: 'name',
                key: 'name',
              },
              {
                title: 'Path',
                dataIndex: 'path',
                key: 'path',
                render: (text, values) => {
                  return (
                    <span
                      className={styles.href}
                      onClick={this.onOpenFolder.bind(this, values.path)}
                    >
                      {path
                        .normalize(values.path)
                        .split(path.sep)
                        .slice(-3)
                        .join(path.sep)}
                    </span>
                  );
                },
              },
              {
                title: 'Type',
                key: 'type',
                dataIndex: 'type',
                render: type => (
                  <span>
                    <Tag color={type === 'npm' ? 'geekblue' : 'green'}>
                      {type}
                    </Tag>
                  </span>
                ),
              },
              {
                title: 'Action',
                key: 'key',
                dataIndex: 'key',
                width: 300,
                render: (text, { key, scripts, path, port = '' }) => (
                  <span>
                    <Button.Group>
                      <Dropdown
                        overlay={
                          <Menu onClick={this.onRun.bind(this, path, key)}>
                            <Menu.Item key={`custom`}>
                              <Icon type="unordered-list" />
                              命令管理
                            </Menu.Item>
                            {scripts.cmd.map(v => (
                              <Menu.Item key={`${v}`}>
                                <Tag color="green">custom</Tag>
                                {v}
                              </Menu.Item>
                            ))}
                            {scripts.npm.length && (
                              <Menu.Item key={`${packageCode} install`}>
                                <Tag color="geekblue">{packageCode}</Tag>
                                install
                              </Menu.Item>
                            )}
                            {scripts.npm.map(v => (
                              <Menu.Item key={`${packageCode} ${v}`}>
                                <Tag color="geekblue">{packageCode}</Tag>
                                {v}
                              </Menu.Item>
                            ))}
                          </Menu>
                        }
                      >
                        <Button type="primary" title="运行">
                          <Icon type="play-circle" />
                        </Button>
                      </Dropdown>
                      <Dropdown
                        overlay={
                          <Menu onClick={this.onRunSVN.bind(this, path)}>
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
                            <Menu.Item key="patch">
                              <Icon type="pull-request" />
                              补丁
                            </Menu.Item>
                          </Menu>
                        }
                      >
                        <Button type="primary">SVN</Button>
                      </Dropdown>
                      <Button
                        type="primary"
                        icon="code"
                        title="打开vscode"
                        onClick={this.onRunCode.bind(this, path)}
                      />
                      <Popover
                        placement="topRight"
                        content={
                          <div>
                            <Input
                              placeholder="请先输入端口号"
                              value={port}
                              onChange={this.onChangePort.bind(this, key)}
                            />
                          </div>
                        }
                        title="端口号"
                      >
                        <Button
                          type="primary"
                          icon="chrome"
                          title="在浏览器中浏览"
                          onClick={this.onOpenChrome.bind(this, port)}
                        />
                      </Popover>
                      <Dropdown
                        overlay={
                          <Menu onClick={this.onListChange.bind(this, key)}>
                            <Menu.Item key="up" disabled={Number(key) === 0}>
                              <Icon type="up" />
                              上移
                            </Menu.Item>
                            <Menu.Item
                              key="down"
                              disabled={Number(key) === list.length - 1}
                            >
                              <Icon type="down" />
                              下移
                            </Menu.Item>
                            <Menu.Item key="delete">
                              <Icon type="delete" />
                              删除
                            </Menu.Item>
                          </Menu>
                        }
                      >
                        <Button type="primary" icon="menu"></Button>
                      </Dropdown>
                    </Button.Group>
                  </span>
                ),
              },
            ]}
            dataSource={list
              .filter(
                v =>
                  v.name
                    .toLocaleLowerCase()
                    .indexOf(search.toLocaleLowerCase()) > -1 ||
                  v.path
                    .toLocaleLowerCase()
                    .indexOf(search.toLocaleLowerCase()) > -1,
              )
              .map((v, i) =>
                Object.assign({}, v, {
                  key: i,
                }),
              )}
          />
        </div>

        <CmdModal ref={this.cmdModal} />
        <PatchModalConnect ref={this.patchModal} />
      </div>
    );
  }
}

export default connect((state: ModelTypes.model) => ({
  project: state.project,
}))(Project);
