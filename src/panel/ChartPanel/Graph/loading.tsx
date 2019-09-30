import React ,{Component} from 'react';
import {Progress} from 'antd';
import s, { IChartLess } from './chart.less';

const styles = s as Partial<IChartLess>;
export default class Loading extends Component{
    state={
        progress: undefined,
    }
    public tick(progress){
        this.setState({
            progress
        });
    }
    render(){
        const {progress} = this.state;
        return progress ? (
            <div className={styles.loadingWrap}>
              <Progress type="dashboard" percent={Math.ceil(progress * 100)} />
            </div>
          ) : null;
    }

}