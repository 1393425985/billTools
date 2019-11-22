import React from 'react';
import {
  Row,
  Col,
  Form,
  Input,
  Button,
  Select,
  Divider,
  Radio,
  Empty,
  Icon,
  Checkbox,
  Alert,
} from 'antd';
import { Link } from 'react-router-dom';
import { FormComponentProps } from 'antd/lib/form';
import { connect,DispatchProp } from 'react-redux';
import classnames from 'classnames';
import s, { IIndexLess } from './index.less';
const styles = s as Partial<IIndexLess>;

type ILoginProps = {
  userStore: IUser.Model;
  loginLoading: boolean;
} & IG.IProps & DispatchProp & FormComponentProps & {};
class LoginPanel extends React.PureComponent<ILoginProps> {
  private handleSubmit = e => {
    e.preventDefault();
    const { form, dispatch } = this.props;
    form.validateFields(
      (
        err,
        values: {
          remember: boolean;
          tel: string;
          pwd: string;
        },
      ) => {
        if (!err) {
          console.log(values);
          dispatch({
            type: 'saga/user/login',
            payload: values,
          });
        } else {
          console.log(err);
        }
      },
    );
  };
  public render() {
    const { form, userStore, loginLoading } = this.props;
    const { getFieldDecorator } = form;
    const lastLogin: {
      pwd: string;
      tel: string;
      remember: boolean;
    } = JSON.parse(
      localStorage.getItem('loginInfo') ||
        '{"tel":"","pwd":"","remember":false}',
    );
    return (
      <div className={styles.wrap}>
        <Form onSubmit={this.handleSubmit} layout="horizontal" hideRequiredMark>
          <Form.Item>
            {getFieldDecorator('tel', {
              initialValue: lastLogin.tel,
              rules: [
                {
                  required: true,
                  message: 'Please enter username!',
                },
              ],
            })(
              <Input
                size="large"
                prefix={<Icon type="user" className={styles.prefixIcon} />}
                placeholder="username"
              />,
            )}
          </Form.Item>
          <Form.Item>
            {getFieldDecorator('pwd', {
              initialValue: lastLogin.pwd,
              rules: [
                {
                  required: true,
                  message: 'Please enter password!',
                },
              ],
            })(
              <Input
                size="large"
                type="password"
                prefix={<Icon type="lock" className={styles.prefixIcon} />}
                placeholder="password"
              />,
            )}
          </Form.Item>
          <Form.Item>
            {getFieldDecorator('remember', {
              valuePropName: 'checked',
              initialValue: lastLogin.remember,
            })(
              <Checkbox>
                <span className={styles.darkenText}>记住密码</span>
              </Checkbox>,
            )}
            <a
              className={classnames(styles.right, styles.differenceText)}
              href=""
            >
              忘记密码
            </a>
            {!userStore.loginInfo.status && userStore.loginInfo.msg && (
              <Alert
                style={{ marginBottom: 24 }}
                message={userStore.loginInfo.msg}
                type="error"
                showIcon
              />
            )}
            <Button
              type="primary"
              htmlType="submit"
              className={styles.submit}
              loading={loginLoading}
            >
              登录
            </Button>
            <Link
              className={classnames(styles.right, styles.differenceText)}
              to="/user/register"
            >
              注册账户
            </Link>
          </Form.Item>
        </Form>
      </div>
    );
  }
}

export default connect(({ user, loading }: any) => ({
  userStore: user,
  loginLoading: loading['saga/user/login'],
}))(Form.create()(LoginPanel));
