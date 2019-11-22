import React, { useState } from 'react';
import Exception from '@components/Exception';

export type IException = IG.IProps &{
    match:{
        params:{
            status:'403'|'404'|'500';
        }
    }
}
export default function(props:IException) {
  return (
    <Exception type={props.match.params.status} />
  );
}
