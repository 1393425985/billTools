//外部接收的配置
'use strict';
if(this && this.root && this.root.container){
  this.root.container.classList.add('managementReport');
}
var endTime = '{outEndTime}',
  startTime = '{outStartTime}',
  period = '{period}',
  lan = '{lan}' || 'zh',
  periodStartTime = Number('{periodStartTime}') || 0,
  projectId = Number('{projectId}') || 724;
//自定义配置
lan = 'en';
var CONFIG = {
  MONEY_UNIT_I18N: {
    zh: '￥',
    en: '$'
  },
  CHARTHEIGHT: 7, //图表高度
  TEXTHEIGHT: 2, //文字控件高度
  USE_NEW_DIAGNOSIS: 0, //是否使用新表
  FORMAT_TIME: false, //是否格式化时间
  CUSTOM_FORMAT: timeFormatChange('mm-dd hh:ii:ss'), //时间格式
  NoReport_TEXT:
    lan == 'zh' ? '当前报表尚未生成' : 'The report has not been generated',
  GOTO_OLD_REPORT_TIME: '2018-03-01 00:00:00',
  START_WITH_SPACE: false, //是否缩进
  PAGEBREAK_LEVEL1: false, //大章节是否分页
  PAGEBREAK_LEVEL2: false, //小章节是否分页
  ISREADONLY: true //是否隐藏按钮
};

//周报开始时间
var weekStartTime = moment(startTime)
    .add({ days: 7, hours: 1 })
    .format('YYYY-MM-DD HH:mm:ss'),
  lastWeekStartTime = moment(weekStartTime)
    .subtract({ days: 7 })
    .format('YYYY-MM-DD HH:mm:ss'),
  historyWeekStartTime = moment(startTime)
    .subtract({ minutes: 5 })
    .format('YYYY-MM-DD HH:mm:ss'),
  historyWeekEndTime = moment(startTime)
    .add({ days: 6, hours: 23, minutes: 55 })
    .format('YYYY-MM-DD HH:mm:ss'),
  historyLastWeekStartTime = moment(historyWeekStartTime)
    .subtract({ days: 7 })
    .format('YYYY-MM-DD HH:mm:ss');
var promise0 = $.Deferred(),
  promiseChildren = [],
  webapiChildren = [];
var Price = 0;
//报表未生成
var isNoReport = (function() {
  var isOK = false;
  if (moment(startTime).isBefore(CONFIG.GOTO_OLD_REPORT_TIME)) {
    isOK = true;
  }
  var reportGenTime = moment(startTime).add({ days: 7, hours: 1 - 14 }); // 1 - 14，表示报表是项目当地时间周一凌晨1点生成，但是要减去项目当地时区（+10）和服务器时区（-4）的差，即14小时
  if (moment().isBefore(reportGenTime)) {
    isOK = true;
  }
  return isOK;
})();

if (isNoReport) {
  var layouts = [
    {
      id: ObjectId(),
      modal: {
        type: 'ReportContainer',
        isReadonly: CONFIG.ISREADONLY,
        option: {
          layouts: [
            {
              id: ObjectId(),
              modal: {
                type: 'Html',
                isReadonly: CONFIG.ISREADONLY,
                option: {
                  css: '',
                  html:
                    '<p style="width:100%;text-align:center;font-size:16px;display:block;color:#ffbf00;margin-top:16px;">' +
                    CONFIG.NoReport_TEXT +
                    '</p>',
                  js: ''
                }
              },
              spanC: 12,
              spanR: 1
            }
          ]
        }
      },
      spanC: 12,
      spanR: 6
    }
  ];
  promise0.resolve(layouts);
  return promise0;
}

//国际化
var moneyUnit = CONFIG.MONEY_UNIT_I18N[lan];

var strMapI18n = {
  zh: {
    0: '本周运维回顾',
    1: '概览',
    2: '设备健康',
    3: '能耗',
    4: '最大需量MD',
    5: '工单',
    6: '下周建议',
    7: '修复故障',
    8: '调整运行策略',
    9: '工单监管',
    10: '附录',
    11: '能耗',
    12: '故障统计',
    13: '健康率趋势',
    14: '本周AdOPT为您发现合计' + moneyUnit + '{num}的费用节省机会。',
    15:
      '过去一周本项目的电能消耗为{num1}kWh，折合电费' +
      moneyUnit +
      '{num2}。环比上周{str1}{num3}%。与历史最佳相比上升了{num5}%，仍有' +
      moneyUnit +
      '{num6}的节能空间，其中{str}。',
    16: '{num1}%来自于{str1}，{num2}%来自于{str2}和{num3}%来自于{str3}',
    17: '',
    18: '费用节省',
    19: '，',
    20: '本月目前最大需量为{num1}kVA，占申报额度的{num2}%，根据历史数据预计下月最大需量为{num3}kVA，建议下月降低申报额度至{num4}kVA{str}。',
    21: '过去一周新建工单{num1}条，工单完成率{num2}%，{str1}{str2}',
    22: '仍有进步空间。',
    23: '请保持。',
    24: '上升',
    25: '下降',
    26: '参考运行策略优化建议，可以带来' + moneyUnit + '{num}的费用节省。',
    27: '比上期上升，',
    28: '和上期相同，',
    29: '比上期下降，',
    30: '暖通达标率',
    31: '给排水',
    32: 'BA',
    33: '高低压配电系统',
    34: '加强监管，提升工单完成率。',
    35: '月能耗',
    36: '周能耗',
    37: '周能耗趋势',
    38: '上上周',
    39: '上周',
    40: '周一',
    41: '周二',
    42: '周三',
    43: '周四',
    44: '周五',
    45: '周六',
    46: '周日',
    47: '本周故障',
    48: '相关设备',
    49: '频次',
    50: '上周故障',
    51: '健康率趋势',
    52: '，可以节省能耗{num5}kVA',
    53: '比上周{str1}了{num3}%。',
    54: '和上周一样。',
    55: '第{num}周',
    56: '本周未检测到故障',
    57: '上周未检测到故障',
    58: '上升了',
    59: '下降了',
    60: 'rises by',
    61: 'lowers by',
    62: 'increases by',
    63: 'reduces by',
    64: '和',
    65: '、',
    66: 'Faults',
    67: 'Related Equipment',
    68: 'Depreciation($/Month)',
    69: 'Thermal comfort',
    70: 'remains unchanged',
    71: 'Daily Chiller Energy Use',
    72: 'Daily Plant Energy Use'
  },
  en: {
    0: 'Weekly Operation Review',
    1: 'Overview',
    2: 'Equipment health',
    3: 'Energy',
    4: 'Maximum demand',
    5: 'Work order',
    6: 'Advice for Next Week',
    7: 'Fix faults',
    8: 'Adjust operation strategy',
    9: 'Strengthen the supervision of work orders',
    10: 'Appendix',
    11: 'Energy Use',
    12: 'Faults',
    13: 'Equipment Health',
    14:
      'In this week, AdOPT has found ' +
      moneyUnit +
      '{num} of saving potential for you.',
    15:
      'Electricity consumption for last week is {num1}kWh, equivalent to ' +
      moneyUnit +
      '{num2} electricity bill. {str1} {num3}% from last week. Up {num5}% from the best ever, there are still ' +
      moneyUnit +
      '{num6} of energy savings, {str}.',
    16: '{num1}% of which come from {str1}, {num2}% of which come from {str2} and {num3}% of which come from {str3}',
    17: '',
    18: 'Saving Potential',
    19: ',',
    20: 'The current maximum demand this month is {num1}kVA, accounting for {num2}% of the quota. According to historical data, the maximum demand for next month is {num3}kVA. It is recommended to reduce the declaration limit to {num4}kVA next month{str}.',
    21: 'In the past week, {num1} new work orders were created, the completion rate of work orders was {num2}%,{str1}{str2}',
    22: 'There is still room for improvement.',
    23: 'Please keep the good condition.',
    24: 'over',
    25: 'decrease',
    26:
      'Take the advice of Strategy Optimization to achieve an annual saving potential of ' +
      moneyUnit +
      '{num}.',
    27: 'Increased over the previous period, ',
    28: 'Same as the previous period, ',
    29: 'Decreased over the previous period, ',
    30: 'HVAC',
    31: 'WaterSystem',
    32: 'BA',
    33: 'ElecSystem',
    34: 'Strengthen the supervision of work orders to increase the completion rate. ',
    35: 'Monthly Electricity Consumption',
    36: 'Weekly Electricity Consumption',
    37: 'Daily Energy Use',
    38: 'The Week Before Last',
    39: 'Last Week',
    40: 'Mon.',
    41: 'Tues.',
    42: 'Wed.',
    43: 'Thur.',
    44: 'Fri.',
    45: 'Sat.',
    46: 'Sun.',
    47: 'Faults last week',
    48: 'Related Equipment',
    49: 'Frequency',
    50: 'Faults the week before last',
    51: 'Equipment Health',
    52: ', which will save {num5}kVA of energy consumption',
    53: ' an increase of {num3}% {str1} last week. ',
    54: ' same as the last week. ',
    55: '{num}th',
    56: 'No faults detected in this week.',
    57: 'No faults detected in last week.',
    58: 'Up',
    59: 'Down',
    60: 'rises by',
    61: 'lowers by',
    62: 'increases by',
    63: 'reduces by',
    64: ' and ',
    65: ', ',
    66: 'Faults',
    67: 'Related Equipment',
    68: 'Depreciation($/Month)',
    69: 'Thermal comfort',
    70: 'remains unchanged',
    71: 'Daily Chiller Energy Use',
    72: 'Daily Plant Energy Use'
  }
};
var pointsMapI18n = {
  zh: {
    0: 'proj_saving_potential',
    1: 'equipmente_health_conclude',
    2: 'Accum_PlantEG_GroupEnergy',
    3: 'Accum_PlantEG_GroupCost',
    4: 'Weekly_EnergyReport_EnergyDiag_Data',
    5: 'MD_maxUsage',
    6: 'MD_maxUsageDeclareRate',
    7: 'WeekOrderNum',
    8: 'WeekOrderCompleteRate',
    9: 'KPI_week_achieve_rate',
    10: 'fix_faults_conclude',
    11: 'Weekly_EnergyReport_EnergyOpt_Data',
    12: 'MD_forecast',
    13: 'MD_declaredLimit',
    14: 'MD_energysaving',
    15: 'Accum_PlantEG_GroupEnergy',
    16: 'Accum_PlantEG_GroupEnergy',
    17: 'Accum_PlantEG_GroupEnergy',
    18: 'WeekFaultStatisticEnergyList',
    19: 'Equip_IntactRate',
    20: 'equipmente_health_W',
    21: 'Accum_PlantEG_GroupEnergy',
    22: 'Undercool_Rate',
    23: 'Room_Count',
    24: 'Overheat_Rate',
    25: 'equipmente_health_W',
    26: 'Accum_PlantElec_GroupEnergy',
    27: 'elecPrice',
    28: 'WeeklyEnergy',
    29: 'MD_maxUsage',
    30: 'MD_declaredLimit',
    31: 'MD_forecast_month',
    32: 'ProjDiagnoss_EnergySave_W',
    33: 'Accum_ChillerGroup_GroupEnergy_D',
    34: 'EM_CHWP_1_TPC_D',
    35: 'EM_CCWP_1_TPC_D',
    36: 'EM_CT_1_TPC_D',
    37: 'EM_CCWP_2_TPC_D',
    38: 'EM_HHWP_1_TPC_D',
    39: 'EM_CH_L12_1_TPC_D',
    40: 'EM_CH_L12_2_TPC_D',
    41: 'EM_CH_L12_3_TPC_D',
  },
  en: {
    0: 'proj_saving_potential_en',
    1: 'equipmente_health_conclude_en',
    2: 'Accum_PlantEG_GroupEnergy',
    3: 'Accum_PlantEG_GroupCost',
    4: 'Weekly_EnergyReport_EnergyDiag_Data',
    5: 'MD_maxUsage',
    6: 'MD_maxUsageDeclareRate',
    7: 'WeekOrderNum',
    8: 'WeekOrderCompleteRate',
    9: 'KPI_week_achieve_rate',
    10: 'fix_faults_conclude_en',
    11: 'Weekly_EnergyReport_EnergyOpt_Data',
    12: 'MD_forecast',
    13: 'MD_declaredLimit',
    14: 'MD_energysaving',
    15: 'Accum_PlantEG_GroupEnergy',
    16: 'Accum_PlantEG_GroupEnergy',
    17: 'Accum_PlantEG_GroupEnergy',
    18: 'WeekFaultStatisticEnergyList_en',
    19: 'Equip_IntactRate',
    20: 'equipmente_health_W',
    21: 'Accum_PlantEG_GroupEnergy',
    22: 'Undercool_Rate',
    23: 'Room_Count',
    24: 'Overheat_Rate',
    25: 'equipmente_health_W',
    26: 'Accum_PlantElec_GroupEnergy',
    27: 'elecPrice',
    28: 'WeeklyEnergy',
    29: 'MD_maxUsage',
    30: 'MD_declaredLimit',
    31: 'MD_forecast_month',
    32: 'ProjDiagnoss_EnergySave_W',
    33: 'Accum_ChillerGroup_GroupEnergy_D',
    34: 'EM_CHWP_1_TPC_D',
    35: 'EM_CCWP_1_TPC_D',
    36: 'EM_CT_1_TPC_D',
    37: 'EM_CCWP_2_TPC_D',
    38: 'EM_HHWP_1_TPC_D',
    39: 'EM_CH_L12_1_TPC_D',
    40: 'EM_CH_L12_2_TPC_D',
    41: 'EM_CH_L12_3_TPC_D',
  }
};

var strMap = strMapI18n[lan],
  pointsMap = pointsMapI18n[lan];

// 样式
var hFs = ".bFs{font-weight:700;color:rgba(0,0,0,1);}\n",
  sFs = ".sFs{font-weight:normal;color:rgba(0,0,0,0.75);}\n",
  wrapS = "#wrap{padding-left:18px;}\n",
  tableS = ".tableWrap {width:100%;padding:0 16px;} table { table-layout: fixed; width:100%;} table td { word-wrap: break-word;font-weight:normal;color:rgba(0,0,0,0.75);}\n";
var getCss = function(ex){
  return hFs + sFs + wrapS + tableS + ex;
}
var getObjectValue = function(obj, names) {
  var arr = names.split('.');
  var rs = obj;
  for (var i = 0, len = arr.length; i < len; i++) {
    var name = arr[i];
    var nameMatch = name.match(/^\[(\d+)\]$/);
    if (nameMatch) {
      name = Number(nameMatch[1]);
    }
    if (rs[name] == undefined || rs[name] == null) {
      return undefined;
    } else {
      rs = rs[name];
    }
  }
  return rs;
};
var getAndStr = function(arr) {
  if (arr.length) {
    if (arr.length == 1) {
      return arr[0];
    } else {
      return (
        arr.splice(0, arr.length - 1).join(strMap[65]) +
        strMap[64] +
        arr[arr.length - 1]
      );
    }
  } else {
    return '';
  }
};
var getEtcStr = function(arr,num) {
  if (arr.length) {
    if (arr.length == 1) {
      return arr[0];
    } else if(arr.length <= num) {
      return (
        arr.splice(0, arr.length - 1).join(strMap[65]) +
        strMap[64] +
        arr[arr.length - 1]
      );
    }else{
      return arr.splice(0, num).join(strMap[65]) + ' etc'
    }
  } else {
    return '';
  }
};
var getHistoryMoment = function(arrDs, arrMoment) {
    arrDs = arrDs || [];
    arrMoment = arrMoment || [weekStartTime];
    if (!$.isArray(arrDs)) {
      arrDs = [arrDs];
    }
    arrDs = arrDs.map(function(v) {
      return '@' + projectId + '|' + v;
    });
    if (!$.isArray(arrMoment)) {
      arrMoment = [arrMoment];
    }
    return WebAPI.post('/data/get_history/at_moment', [
      { arrDs: arrDs, arrMoment: arrMoment, format: 'd1' }
    ]);
  },
  getRealTimeData = function(arrDs) {
    arrDs = arrDs || [];
    if (!$.isArray(arrDs)) {
      arrDs = [arrDs];
    }
    arrDs = arrDs.map(function(v) {
      return '@' + projectId + '|' + v;
    });
    return WebAPI.post('/analysis/startWorkspaceDataGenPieChart', {
      dsItemIds: arrDs
    });
  },
  getHistoryData2 = function(arrDs,timeStart,timeEnd,timeFormat) {
    arrDs = arrDs || [];
    if (!$.isArray(arrDs)) {
      arrDs = [arrDs];
    }
    arrDs = arrDs.map(function(v) {
      return '@' + projectId + '|' + v;
    });
    return WebAPI.post('/analysis/startWorkspaceDataGenHistogram', {
      dsItemIds: arrDs,
      timeEnd: timeEnd||moment(endTime).format('YYYY-MM-DD HH:mm:ss'),
      timeFormat: timeFormat || "d1",
      timeStart: timeStart||moment(startTime).format('YYYY-MM-DD HH:mm:ss')
    });
  },
  getHistoryData = function(arrDs,timeStart,timeEnd,timeFormat){
    arrDs = arrDs || [];
    if (!$.isArray(arrDs)) {
      arrDs = [arrDs];
    }
    return WebAPI.post('/get_history_data_padded', {
      pointList: arrDs,
      timeStart: timeStart,
      timeEnd: timeEnd,
      timeFormat: timeFormat,
      prop: {},
      projectId: projectId
    });
  },
  getChartHistory = function() {
    var p = $.Deferred(),
      pC = [],
      c = [];
    c.push(
      getHistoryData(pointsMap[15],moment(startTime).subtract({ year: 1 }).startOf('year').format('YYYY-MM-DD HH:mm:ss'),moment(startTime).add({ year: 1 }).startOf('year').format('YYYY-MM-DD HH:mm:ss'),'M1').done(function(rs) {
          var data1 = [[], []];
          if (rs && rs[0] && rs[0].history) {
            var arr1 = [],
              arr2 = [];
            rs[0].history.forEach(function(v, i) {
              if (i > 23) {
                return;
              }
              var t =
                (rs[0].history[i + 1] && rs[0].history[i + 1].value) || null;
              if (i < 12) {
                arr1.push(t - v.value);
              } else {
                arr2.push(t - v.value);
              }
            });
            data1 = [arr1, arr2];
          }
          pC[0].resolve(data1);
        })
        .fail(function() {
          var data1 = [[], []];
          pC[0].resolve(data1);
        })
    );
    var lastYearWeekEndTime = moment(historyWeekEndTime)
        .subtract({ year: 1 })
        .day(moment(historyWeekEndTime).format('dddd'))
        .format('YYYY-MM-DD HH:mm:ss'),
      lastYearWeekStartTime = moment(lastYearWeekEndTime)
        .subtract({ days: 7 })
        .format('YYYY-MM-DD HH:mm:ss');
    c.push(
      getHistoryMoment(
        [pointsMap[16]],
        [lastYearWeekStartTime, lastYearWeekEndTime]
      )
        .done(function(rs) {
          var data1 = null;
          if (rs && rs[0]) {
            data1 = (rs[0].list[0] && rs[0].list[0].data) || 0;
            if (rs[0].list[1] && rs[0].list[1].data) {
              data1 = rs[0].list[1].data - data1;
            } else {
              data1 = null;
            }
          }
          pC[1].resolve(data1);
        })
        .fail(function() {
          var data1 = null;
          pC[1].resolve(data1);
        })
    );

    c.push(
        getHistoryData(pointsMap[17],moment(startTime).subtract({ day: 7 }).format('YYYY-MM-DD 00:00:00'),moment(startTime).add({ day: 7 }).format('YYYY-MM-DD 00:00:00'),'d1').done(function(rs) {
          var data1 = [[], []];
          if (rs && rs[0] && rs[0].history) {
            var arr1 = [],
              arr2 = [];
            rs[0].history.forEach(function(v, i) {
              if (i > 13) {
                return;
              }
              var t = (rs[0].history[i + 1] && rs[0].history[i + 1].value) || 0;
              if (i < 7) {
                arr1.push(t - v.value);
              } else {
                arr2.push(t - v.value);
              }
            });
            data1 = [arr1, arr2];
          }
          pC[2].resolve(data1);
        })
        .fail(function() {
          var data1 = [[], []];
          pC[2].resolve(data1);
        })
    );
    for (var i = 0; i < c.length; i++) {
      pC.push($.Deferred());
    }
    $.when.apply(this, pC).done(function(data1, data2, data3) {
      p.resolve([data1, data2, data3]);
    });
    p.abort = function() {
      c.forEach(function(v) {
        v.abort();
      });
    };
    return p;
  },
  getHeathHistory = function() {
    var p = $.Deferred(),
      pC = [],
      c = [];
    var times = [];
    for (var i = 0; i < 7; i++) {
      times.push(
        moment(startTime)
          .add({ day: i })
          .format('YYYY-MM-DD')
      );
    }
    times.forEach(function(time, i) {
      c.push(
        WebAPI.get(
          '/diagnosis_v2/getEquipmentAvailability?lang=' +
            lan +
            '&projectId=' +
            projectId +
            '&startTime=' +
            time +
            '+00%3A00%3A00&endTime=' +
            time +
            '+23%3A59%3A59'
        )
          .done(function(rs) {
            var data1 = [];
            if (rs.data && rs.data.length) {
              data1 = rs.data;
            }
            pC[i].resolve(data1);
          })
          .fail(function() {
            var data1 = [];
            pC[i].resolve(data1);
          })
      );
    });

    for (var i = 0; i < c.length; i++) {
      pC.push($.Deferred());
    }
    $.when
      .apply(this, pC)
      .done(function(data1, data2, data3, data4, data5, data6, data7) {
        var map = {},
          names = [];
        data1.forEach(function(v, i) {
          names.push(v.className);
          map[v.className] = map[v.className] || [];
          map[v.className].push(Number(v.intactRate.replace('%', '')));
        });
        data2.forEach(function(v, i) {
          map[v.className] = map[v.className] || [];
          map[v.className].push(Number(v.intactRate.replace('%', '')));
        });
        data3.forEach(function(v, i) {
          map[v.className] = map[v.className] || [];
          map[v.className].push(Number(v.intactRate.replace('%', '')));
        });
        data4.forEach(function(v, i) {
          map[v.className] = map[v.className] || [];
          map[v.className].push(Number(v.intactRate.replace('%', '')));
        });
        data5.forEach(function(v, i) {
          map[v.className] = map[v.className] || [];
          map[v.className].push(Number(v.intactRate.replace('%', '')));
        });
        data6.forEach(function(v, i) {
          map[v.className] = map[v.className] || [];
          map[v.className].push(Number(v.intactRate.replace('%', '')));
        });
        data7.forEach(function(v, i) {
          map[v.className] = map[v.className] || [];
          map[v.className].push(Number(v.intactRate.replace('%', '')));
        });
        p.resolve({
          names: names,
          map: map
        });
      });
    p.abort = function() {
      c.forEach(function(v) {
        v.abort();
      });
    };
    return p;
  };

var getText = function(v, o, className) {
  v = v || '';
  o = o || {};
  className = className || '';
  var indextStyle = '';
  if (!CONFIG.START_WITH_SPACE) {
    indextStyle = ' style="padding-left:18px;text-indent:0;"';
  }
  return '<p' + indextStyle + ' class="'+ className +'">' + v.formatEL(o) + '</p>';
};
var getChapterContainer1 = function() {
  var finalPromise = $.Deferred(),
    promiseArr = [],
    items = [];
  items.push(
    getHistoryMoment([pointsMap[20]], [weekStartTime, lastWeekStartTime])
      .done(function(rs) {
        var weekHeath = 0,
          lastWeekHeath = 0,
          ratio = 0,
          key = strMap[70];

        if (rs && rs.length) {
          weekHeath = getObjectValue(rs[0], 'list.[0].data.[0]') || weekHeath;
          lastWeekHeath =
            getObjectValue(rs[0], 'list.[0].data.[1]') || lastWeekHeath;
        }
        if (weekHeath > lastWeekHeath) {
          ratio = (weekHeath - lastWeekHeath) / lastWeekHeath * 100;
          key = strMap[60];
        } else if (weekHeath < lastWeekHeath) {
          ratio = -(weekHeath - lastWeekHeath) / lastWeekHeath * 100;
          key = strMap[61];
        } else {
          ratio = 0;
          key = strMap[70];
        }
        promiseArr[0].resolve({
          ratio: ratio.toFixed(1) + '%',
          key: key
        });
      })
      .fail(function(rs) {
        promiseArr[0].resolve({
          ratio: '0.0%',
          key: strMap[70]
        });
      })
  );

  items.push(
    WebAPI.post('/diagnosis_v2/getEntityFaults/group/v2', {
      projectId: projectId,
      startTime: startTime,
      endTime: endTime,
      entityIds: [],
      keywords: '',
      faultIds: [],
      classNames: [],
      pageNum: 1,
      pageSize: 100000,
      lan: lan,
      group: ['faultId'],
      sort: []
    })
      .done(function(rs) {
        var heathArr = rs.data.data.filter(function(v) {
          return v.consequence == 'Equipment Health';
        });
        heathArr.sort(function(item1, item2) {
          return item2.grade - item1.grade;
        });
        WebAPI.post('/diagnosis_v2/getEntityFaults/group', {
          projectId: projectId,
          startTime: startTime,
          endTime: endTime,
          entityIds: [],
          keywords: '',
          faultIds: heathArr.map(function(v) {
            return v.faultId;
          }),
          classNames: [],
          pageNum: 1,
          pageSize: 100000,
          lan: lan,
          group: ['faultId', 'entityId'],
          sort: [{ key: 'time', order: 'desc' }]
        })
          .done(function(rs) {
            var map = {};
            if (rs.data && rs.data.data) {
              rs.data.data.forEach(function(v) {
                map[v.faultId] = map[v.faultId] || {};
                v.list.forEach(function(b) {
                  map[v.faultId][b.entityName] = map[v.faultId][b.entityName]
                    ? map[v.faultId][b.entityName] + 1
                    : 1;
                });
              });
              var rsMap = {};
              var faultMap = {};
              heathArr.forEach(function(v, i) {
                var arr = [];
                for (var k in map[v.faultId]) {
                  arr.push([k, map[v.faultId][k]]);
                }
                rsMap[v.faultId] = arr;
                faultMap[v.faultId] = v.faultName;
              });
              promiseArr[1].resolve({
                consequenceMap:rsMap,
                faultMap: faultMap
              });
            } else {
              promiseArr[1].resolve({consequenceMap:{},faultMap:{}});
            }
          })
          .fail(function() {
            promiseArr[1].resolve({consequenceMap:{},faultMap:{}});
          });
      })
      .fail(function(rs) {
        promiseArr[1].resolve({});
      })
  );

  items.push(
    getHistoryData(pointsMap[21],moment(startTime).subtract({ days: 7 }).format('YYYY-MM-DD HH:mm:ss'),moment(endTime).format('YYYY-MM-DD HH:mm:ss'),'d1').done(function(rs) {
        var weekEnergy = 0,
          lastWeekEnergy = 0,
          ratio = 0,
          key = strMap[70];
        if (rs && rs.length) {
          weekEnergy =
            getObjectValue(rs[0], 'history.[13].value') || weekEnergy;
          lastWeekEnergy =
            getObjectValue(rs[0], 'history.[6].value') || lastWeekEnergy;
        }
        if (weekEnergy > lastWeekEnergy) {
          ratio = (weekEnergy - lastWeekEnergy) / lastWeekEnergy * 100;
          key = strMap[62];
        } else if (weekEnergy < lastWeekEnergy) {
          ratio = -(weekEnergy - lastWeekEnergy) / lastWeekEnergy * 100;
          key = strMap[63];
        } else {
          (ratio = 0), (key = strMap[70]);
        }
        promiseArr[2].resolve({
          ratio: ratio.toFixed(1) + '%',
          key: key
        });
      })
      .fail(function(rs) {
        promiseArr[2].resolve({
          ratio: '0.0%',
          key: strMap[70]
        });
      })
  );

  items.push(
    WebAPI.post('/algo/energy_compare', {
      proj_id: projectId,
      pivot: [
        moment(startTime).format('YYYY-MM-DD HH:mm:ss'),
        moment(endTime).format('YYYY-MM-DD HH:mm:ss')
      ], // 需要分析的时间段
      ref: [
        moment(startTime)
          .subtract({ days: 7 })
          .format('YYYY-MM-DD HH:mm:ss'),
        moment(endTime)
          .subtract({ days: 7 })
          .format('YYYY-MM-DD HH:mm:ss')
      ] // 选择用来对比的时间段
    })
      .done(function(rs) {
        promiseArr[3].resolve({
          str: rs
        });
      })
      .fail(function() {
        promiseArr[3].resolve({});
      })
  );
  items.push(
    getHistoryMoment(
      [pointsMap[22], pointsMap[23], pointsMap[24]],
      [weekStartTime, lastWeekStartTime]
    )
      .done(function(rs) {
        var weekUndercool = 0,
          lastWeekUndercool = 0,
          weekCount = 0,
          lastWeekCount = 0,
          weekOverheat = 0,
          lastWeekOverheat = 0;
        if (rs && rs.length) {
          weekUndercool =
            getObjectValue(rs[0], 'list.[0].data.[0]') || weekUndercool;
          lastWeekUndercool =
            getObjectValue(rs[0], 'list.[0].data.[1]') || lastWeekUndercool;
          weekCount = getObjectValue(rs[0], 'list.[1].data.[0]') || weekCount;
          lastWeekCount =
            getObjectValue(rs[0], 'list.[1].data.[1]') || lastWeekCount;
          weekOverheat =
            getObjectValue(rs[0], 'list.[2].data.[0]') || weekOverheat;
          lastWeekOverheat =
            getObjectValue(rs[0], 'list.[2].data.[1]') || lastWeekOverheat;
        }

        promiseArr[4].resolve({
          undercool: Math.round(weekUndercool * weekCount),
          overheat: Math.round(weekOverheat * weekCount),
          undercoolC: (weekUndercool * 100).toFixed(1) + '%',
          overheatC: (weekOverheat * 100).toFixed(1) + '%'
        });
      })
      .fail(function(rs) {
        promiseArr[4].resolve({
          undercool: 0,
          overheat: 0,
          undercoolC: '0.0%',
          overheatC: '0.0%'
        });
      })
  );
  items.push(
    getHistoryMoment([pointsMap[25]], [weekStartTime])
      .done(function(rs) {
        var ratio = 0;
        if (rs && rs.length) {
          ratio = getObjectValue(rs[0], 'list.[0].data.[0]') || ratio;
        }
        promiseArr[5].resolve({
          ratio: ratio.toFixed(1) + '%'
        });
      })
      .fail(function(rs) {
        promiseArr[5].resolve({
          ratio: '0%'
        });
      })
  );
  items.push(
    WebAPI.post('/diagnosis_v2/getRoiInfo', {
      projectId: projectId,
      startTime: startTime,
      endTime: endTime,
      lang: lan,
      sort: [{ key: 'lifecost', order: 'desc' }],
      pageSize: 10000,
      pageNum: 1,
      calcMode: 'month',
      group: 'faultId'
    })
      .done(function(rs) {
        var data = getObjectValue(rs, 'data.lineItems') || [];
        var faultNameArr = data.map(function(v) {
          return [v.faultName, v.entityName, v.lifeCost.toFixed(1), v.faultId];
        });
        var energyDescData = data.concat([]).sort(function(a,b){b.energy - a.energy});
        var faultNameArrEnergyDesc = energyDescData.map(function(v){
          return v.faultName;
        });
        var infoMap = {};
        data.forEach(function(v){
          infoMap[v.faultId] = v;
        });
        promiseArr[6].resolve({
          faultNameArr: faultNameArr,
          faultNameArrEnergyDesc: faultNameArrEnergyDesc,
          infoMap: infoMap
        });
      })
      .fail(function(rs) {
        promiseArr[6].resolve({
          faultNameArr: [],
          faultNameArrEnergyDesc: [],
          infoMap:{}
        });
      })
  );
  items.push(
    getHistoryMoment(
      [pointsMap[26], pointsMap[27], pointsMap[28], pointsMap[32]],
      [weekStartTime,lastWeekStartTime]
    )
      .done(function(rs) {
        var energy = 0,
          price = 0,
          weeklyEnergy = JSON.stringify({ total: 0, group: {} }),
          energySave = 0;
        if (rs && rs.length) {
          energy = (getObjectValue(rs[0], 'list.[0].data.[0]') || energy) - (getObjectValue(rs[0], 'list.[0].data.[1]') || energy);
          price = getObjectValue(rs[0], 'list.[1].data.[0]') || price;
          weeklyEnergy = JSON.parse(
            getObjectValue(rs[0], 'list.[2].data.[0]') || weeklyEnergy
          );
          energySave = getObjectValue(rs[0], 'list.[3].data.[0]') || energySave;
          Price = price;
        }
        promiseArr[7].resolve({
          energy: energy.toFixed(1) + 'kWh',
          price: moneyUnit + (energy * price).toFixed(1),
          savingEnergy: (weeklyEnergy.total * 52).toFixed(1) + 'kWh',
          savingPrice: moneyUnit + (weeklyEnergy.total * price * 52).toFixed(1),
          energySave: moneyUnit + energySave.toFixed(1)
        });
      })
      .fail(function(rs) {
        promiseArr[7].resolve({
          energy: '0.0kWh',
          price: moneyUnit + '0.0',
          savingEnergy: '0.0kWh',
          savingPrice: moneyUnit + '0.0',
          energySave: moneyUnit + '0.0'
        });
      })
  );
  items.push(
    getHistoryMoment(
      [pointsMap[29], pointsMap[30], pointsMap[31]],
      [
        moment(startTime)
          .startOf('month')
          .add({ hours: 1 })
          .format('YYYY-MM-DD HH:mm:ss'),
        weekStartTime
      ]
    )
      .done(function(rs) {
        var maxUsage = 0,
          declaredLimit = 0,
          forecast = 0;
        if (rs && rs.length) {
          maxUsage = getObjectValue(rs[0], 'list.[0].data.[1]') || maxUsage;
          declaredLimit =
            getObjectValue(rs[0], 'list.[1].data.[1]') || declaredLimit;
          forecast = getObjectValue(rs[0], 'list.[2].data.[0]') || forecast;
        }
        promiseArr[8].resolve({
          maxUsage: maxUsage.toFixed(1) + 'kVA',
          declaredLimit: (maxUsage / declaredLimit * 100).toFixed(1) + '%',
          forecast: forecast + 'kVA'
        });
      })
      .fail(function(rs) {
        promiseArr[8].resolve({
          maxUsage: '0.0kVA',
          declaredLimit: '0%',
          forecast: '0kVA'
        });
      })
  );
  items.push(
    getHistoryData([pointsMap[22],pointsMap[24]],moment(startTime).subtract({ days: 7 }).format('YYYY-MM-DD HH:mm:ss'),moment(endTime).format('YYYY-MM-DD HH:mm:ss'),'d1').done(function(rs) {
        var weekCoolData = [],
          lastWeekCoolData = [],
          weekHeatData = [],
          lastWeekHeatData = [],
          weekTime = [],
          lastWeekTime = [],
          coolD = 0,
          heatD= 0;
        if (rs && rs.length) {
          var weekCool = getObjectValue(rs[0], 'history').slice(7,14),
            lastWeekCool = getObjectValue(rs[0], 'history').slice(0,7),
            weekHeat = getObjectValue(rs[1], 'history').slice(7,14),
            lastWeekHeat = getObjectValue(rs[1], 'history').slice(0,7);
          weekCoolData = weekCool.map(function(v){
            return v.value*100;
          });
          lastWeekCoolData = lastWeekCool.map(function(v){
            return v.value*100;
          });
          weekHeatData = weekHeat.map(function(v){
            return v.value*100;
          });
          lastWeekHeatData = lastWeekHeat.map(function(v){
            return v.value*100;
          });
          weekTime = weekCool.map(function(v){
            return v.time;
          });
          lastWeekTime = lastWeekCool.map(function(v){
            return v.time;
          });
          var weekCoolAvg = weekCoolData.reduce(function(last,v){return last+v},0)/7,
            lastWeekCoolAvg = lastWeekCoolData.reduce(function(last,v){return last+v},0)/7,
            weekHeatAvg = weekHeatData.reduce(function(last,v){return last+v},0)/7,
            lastWeekHeatAvg = lastWeekHeatData.reduce(function(last,v){return last+v},0)/7;
            coolD = (weekCoolAvg - lastWeekCoolAvg)/lastWeekCoolAvg;
            heatD = (weekHeatAvg - lastWeekHeatAvg)/lastWeekHeatAvg;
        }
        promiseArr[9].resolve({
          weekCoolData: weekCoolData,
          lastWeekCoolData: lastWeekCoolData,
          weekHeatData: weekHeatData,
          lastWeekHeatData: lastWeekHeatData,
          weekTime: weekTime,
          lastWeekTime: lastWeekTime,
          coolD: coolD,
          heatD: heatD
        });
      })
      .fail(function(rs) {
        promiseArr[9].resolve({
          weekCoolData: [],
          lastWeekCoolData: [],
          weekHeatData: [],
          lastWeekHeatData: [],
          weekTime: [],
          lastWeekTime: [],
          coolD: 0,
          heatD: 0
        });
      })
  );
  for (var i = 0; i < items.length; i++) {
    promiseArr.push($.Deferred());
  }
  $.when
    .apply(this, promiseArr)
    .done(function(d1, d2, d3, d4, d5, d6, d7, d8, d9, d10) {
      finalPromise.resolve({
        '1-1': [d1, d2, d3, d4, d5, d7],
        '1-2': [d6, d7, d2],
        '1-3': [d8, d9, d7],
        '1-4': [d5, d10]
      });
    });
  finalPromise.abort = function() {
    items.forEach(function(v) {
      v.abort();
    });
  };
  return finalPromise;
};
var getChapterContainer3 = function() {
  var finalPromise = $.Deferred(),
    promiseArr = [],
    items = [];
  var diffDays = moment(endTime).diff(moment(startTime), 'days');

  var getROIOptions = function(time1, time2){
    return {
      "projectId":projectId,
      "startTime":time1,
      "endTime":time2,
      "lang":lan,
      "sort":[{"key":"lifecost","order":"desc"},{"key":"energy","order":"desc"}],
      "pageSize":1000,
      "pageNum":1,
      "calcMode":"year",
      "group":"faultId"
    }
  };
  var getGroupOptions = function(time1, time2){
    return {
      projectId: projectId,
      startTime: time1,
      endTime: time2,
      entityIds: [],
      keywords: '',
      faultIds: [],
      classNames: [],
      pageNum: 1,
      pageSize: 100000,
      lan: lan,
      group: ['faultId'],
      sort: []
    }
  }
  
  items.push(
    WebAPI.post('/diagnosis_v2/getRoiInfo',getROIOptions(startTime, endTime))
    .done(function(rs) {
      var data = [];
      if (rs.status == 'OK' && rs.data && rs.data.total) {
        data = rs.data.lineItems.map(function(v){
          return {
            className:v.className,
            energy:v.energy,
            faultName:v.faultName,
            lifeCost:v.lifeCost,
            faultId:v.faultId
          }
        })
      }
      promiseArr[0].resolve({
        data: data
      });
    })
    .fail(function(rs) {
      promiseArr[0].resolve({
        data: []
      });
    })
  );
  items.push(
    WebAPI.post('/diagnosis_v2/getRoiInfo',getROIOptions(moment(startTime).subtract({ days: 7 }).format('YYYY-MM-DD HH:mm:ss'),moment(endTime).subtract({ days: 7 }).format('YYYY-MM-DD HH:mm:ss')))
    .done(function(rs) {
      var data = [];
      if (rs.status == 'OK' && rs.data && rs.data.total) {
        data = rs.data.lineItems.map(function(v){
          return {
            className:v.className,
            energy:v.energy,
            faultName:v.faultName,
            lifeCost:v.lifeCost,
            faultId:v.faultId
          }
        })
      }
      promiseArr[1].resolve({
        data: data
      });
    })
    .fail(function(rs) {
      promiseArr[1].resolve({
        data: []
      });
    })
  );
  items.push(
    WebAPI.post('/diagnosis_v2/getEntityFaults/group/v2',getGroupOptions(startTime, endTime))
    .done(function(rs) {
      var map = {};
      if (rs.status == 'OK' && rs.data && rs.data.total) {
        rs.data.data.forEach(function(v){
          map[v.faultId] = {
            entityNum: v.entityNum,
            consequence: v.consequence
          }
        })
      }
      promiseArr[2].resolve({
        map: map
      });
    })
    .fail(function(rs) {
      promiseArr[2].resolve({
        map: {}
      });
    })
  );
  items.push(
    WebAPI.post('/diagnosis_v2/getEntityFaults/group/v2',getGroupOptions(moment(startTime).subtract({ days: 7 }).format('YYYY-MM-DD HH:mm:ss'),moment(endTime).subtract({ days: 7 }).format('YYYY-MM-DD HH:mm:ss')))
    .done(function(rs) {
      var map = {};
      if (rs.status == 'OK' && rs.data && rs.data.total) {
        rs.data.data.forEach(function(v){
          map[v.faultId] = {
            entityNum: v.entityNum,
            consequence: v.consequence
          }
        })
      }
      promiseArr[3].resolve({
        map: map
      });
    })
    .fail(function(rs) {
      promiseArr[3].resolve({
        map: {}
      });
    })
  );
  items.push(
    getHistoryData2(
        [pointsMap[33],pointsMap[34],pointsMap[35],pointsMap[36],pointsMap[37],pointsMap[38]],
        moment(startTime).format('YYYY-MM-DD 23:55:00'),
        moment(endTime).format('YYYY-MM-DD 23:55:00'),
        'd1'
      ).done(function(rs) {
        var data1 = [],
        data2 = [],
        data3 = [],
        data4 = [],
        data5 = [],
        data6 = [];
      if (rs &&  rs.list) {
        var tempMap = {};
        rs.list.forEach(function(v){
            tempMap[v.dsItemId.replace('@' + projectId + '|','')] = v.data;
        })
        data1 = tempMap[pointsMap[33]] || data1;
        data2 = tempMap[pointsMap[34]] || data2;
        data3 = tempMap[pointsMap[35]] || data3;
        data4 = tempMap[pointsMap[36]] || data4;
        data5 = tempMap[pointsMap[37]] || data5;
        data6 = tempMap[pointsMap[38]] || data6;
      }
      promiseArr[4].resolve([data1,data2,data3,data4,data5,data6]);
    })
    .fail(function(rs) {
      promiseArr[4].resolve([[],[],[],[],[],[]]);
    })
  );
  items.push(
    getHistoryData2(
        [pointsMap[39],pointsMap[40],pointsMap[41]],
        moment(startTime).format('YYYY-MM-DD 23:55:00'),
        moment(endTime).format('YYYY-MM-DD 23:55:00'),
        'd1'
      ).done(function(rs) {
        var data1 = [],
        data2 = [],
        data3 = [];
      if (rs &&  rs.list) {
        var tempMap = {};
        rs.list.forEach(function(v){
            tempMap[v.dsItemId.replace('@' + projectId + '|','')] = v.data;
        })
        data1 = tempMap[pointsMap[39]] || data1;
        data2 = tempMap[pointsMap[40]] || data2;
        data3 = tempMap[pointsMap[41]] || data3;
      }
      promiseArr[5].resolve([data1,data2,data3]);
    })
    .fail(function(rs) {
      promiseArr[5].resolve([[],[],[]]);
    })
  );
  
  for (var i = 0; i < items.length; i++) {
    promiseArr.push($.Deferred());
  }
  
  $.when.apply(this, promiseArr).done(function(d1, d2, d3, d4,d5,d6) {
    finalPromise.resolve({
      '3-1': [],
      '3-2': [d5],
      '3-3': [d6],
      '3-4': [d1, d2, d3, d4]
    });
  });
  finalPromise.abort = function() {
    items.forEach(function(v) {
      v.abort();
    });
  };
  return finalPromise;
};
webapiChildren.push(
  //周一数据
  getHistoryMoment([
    pointsMap[0],
    pointsMap[1],
    pointsMap[4],
    pointsMap[10],
    pointsMap[11],
    pointsMap[12],
    pointsMap[13],
    pointsMap[14],
    pointsMap[19]
  ])
    .done(function(rs) {
      var data1 = '{}',
        data2 = '',
        data3 = '{"total_waste":0,"detail":[]}',
        data4 = '',
        data5 = '{"saving": 0}',
        data6 = 0,
        data7 = 0,
        data8 = 0,
        data9 = '{}';
      if (rs && rs[0]) {
        data1 = (rs[0].list[0] && rs[0].list[0].data[0]) || data1;
        data2 = (rs[0].list[1] && rs[0].list[1].data[0]) || data2;
        data3 = (rs[0].list[2] && rs[0].list[2].data[0]) || data3;
        data4 = (rs[0].list[3] && rs[0].list[3].data[0]) || data4;
        data5 = (rs[0].list[4] && rs[0].list[4].data[0]) || data5;
        data6 = (rs[0].list[5] && rs[0].list[5].data[0]) || data6;
        data7 = (rs[0].list[6] && rs[0].list[6].data[0]) || data7;
        data8 = (rs[0].list[7] && rs[0].list[7].data[0]) || data8;
        data9 = (rs[0].list[8] && rs[0].list[8].data[0]) || data9;
      }

      promiseChildren[0].resolve([
        JSON.parse(data1),
        data2,
        JSON.parse(data3),
        data4,
        JSON.parse(data5),
        data6,
        data7,
        data8,
        JSON.parse(data9)
      ]);
    })
    .fail(function() {
      var data1 = '{}',
        data2 = '',
        data3 = '{"total_waste":0,"detail":[]}',
        data4 = '',
        data5 = '{"saving": 0}',
        data6 = 0,
        data7 = 0,
        data8 = 0,
        data9 = '{}';
      promiseChildren[0].resolve([
        JSON.parse(data1),
        data2,
        JSON.parse(data3),
        data4,
        JSON.parse(data5),
        data6,
        data7,
        data8,
        JSON.parse(data9)
      ]);
    })
);
webapiChildren.push(
  //周日对比数据
  getHistoryMoment(
    [pointsMap[2], pointsMap[3]],
    [historyLastWeekStartTime, historyWeekStartTime, historyWeekEndTime]
  )
    .done(function(rs) {
      var data1 = [0, 0, 0],
        data2 = [0, 0, 0];
      if (rs && rs[0]) {
        data1 = (rs[0].list[0] && rs[0].list[0].data) || data1;
        data2 = (rs[0].list[1] && rs[0].list[1].data) || data2;
      }
      promiseChildren[1].resolve([data1, data2]);
    })
    .fail(function() {
      var data1 = [0, 0, 0],
        data2 = [0, 0, 0];
      promiseChildren[1].resolve([data1, data2]);
    })
);
if (moment(startTime).isBefore(moment().startOf('month'))) {
  webapiChildren.push(
    //月结尾数据
    getHistoryMoment(
      [pointsMap[5], pointsMap[6]],
      moment(startTime)
        .endOf('month')
        .format('YYYY-MM-DD HH:55:00')
    )
      .done(function(rs) {
        var data1 = 0,
          data2 = 0;
        if (rs && rs[0]) {
          data1 = (rs[0].list[0] && rs[0].list[0].data[0]) || data1;
          data2 = (rs[0].list[1] && rs[0].list[1].data[0]) || data2;
        }
        promiseChildren[2].resolve([data1, data2]);
      })
      .fail(function() {
        var data1 = 0,
          data2 = 0;
        promiseChildren[2].resolve([data1, data2]);
      })
  );
} else {
  webapiChildren.push(
    //月实时数据
    getRealTimeData([pointsMap[5], pointsMap[6]])
      .done(function(rs) {
        var data1 = 0,
          data2 = 0;
        if (rs && rs.dsItemList) {
          data1 = (rs.dsItemList[0] && rs.dsItemList[0].data) || data1;
          data2 = (rs.dsItemList[1] && rs.dsItemList[1].data) || data2;
        }
        promiseChildren[2].resolve([data1, data2]);
      })
      .fail(function() {
        var data1 = 0,
          data2 = 0;
        promiseChildren[2].resolve([data1, data2]);
      })
  );
}
webapiChildren.push(
  //周一对比数据
  getHistoryMoment(
    [pointsMap[7], pointsMap[8], pointsMap[9], pointsMap[18]],
    [weekStartTime, lastWeekStartTime]
  )
    .done(function(rs) {
      var data1 = [0, 0],
        data2 = [0, 0],
        data3 = [
          '{"info":[{"cate":"HVAC","hasKpi":"False","achRate":"None"},{"cate":"waterSystem","hasKpi":"False","achRate":"None"},{"cate":"BA","hasKpi":"False","achRate":"None"},{"cate":"elecSystem","hasKpi":"False","achRate":"None"}]}',
          '{"info":[{"cate":"HVAC","hasKpi":"False","achRate":"None"},{"cate":"waterSystem","hasKpi":"False","achRate":"None"},{"cate":"BA","hasKpi":"False","achRate":"None"},{"cate":"elecSystem","hasKpi":"False","achRate":"None"}]}'
        ];
      if (rs && rs[0]) {
        data1 = (rs[0].list[0] && rs[0].list[0].data) || data1;
        data2 = (rs[0].list[1] && rs[0].list[1].data) || data2;
        data3 = (rs[0].list[2] && rs[0].list[2].data) || data3;
      }
      promiseChildren[3].resolve([data1, data2, data3]);
    })
    .fail(function() {
      var data1 = [0, 0],
        data2 = [0, 0],
        data3 = [
          '{"info":[{"cate":"HVAC","hasKpi":"False","achRate":"None"},{"cate":"waterSystem","hasKpi":"False","achRate":"None"},{"cate":"BA","hasKpi":"False","achRate":"None"},{"cate":"elecSystem","hasKpi":"False","achRate":"None"}]}',
          '{"info":[{"cate":"HVAC","hasKpi":"False","achRate":"None"},{"cate":"waterSystem","hasKpi":"False","achRate":"None"},{"cate":"BA","hasKpi":"False","achRate":"None"},{"cate":"elecSystem","hasKpi":"False","achRate":"None"}]}'
        ];
      promiseChildren[3].resolve([data1, data2, data3]);
    })
);
webapiChildren.push(
  getChartHistory()
    .done(function(data1) {
      var data = data1 || [];
      promiseChildren[4].resolve(data);
    })
    .fail(function() {
      var data = [];
      promiseChildren[4].resolve(data);
    })
);
webapiChildren.push(
  getHeathHistory()
    .done(function(data1) {
      var data = data1 || [];
      promiseChildren[5].resolve(data);
    })
    .fail(function() {
      var data = [];
      promiseChildren[5].resolve(data);
    })
);
webapiChildren.push(
  getChapterContainer1()
    .done(function(data) {
      promiseChildren[6].resolve(data);
    })
    .fail(function() {
      var data = {
        '1-1': [],
        '1-2': [],
        '1-3': [],
        '1-4': []
      };
      promiseChildren[6].resolve(data);
    })
);
webapiChildren.push(
  getChapterContainer3()
    .done(function(data) {
      promiseChildren[7].resolve(data);
    })
    .fail(function() {
      var data = {
        '3-1': [],
        '3-2': [],
        '3-3': [],
        '3-4': []
      };
      promiseChildren[7].resolve(data);
    })
);

for (var i = 0; i < webapiChildren.length; i++) {
  promiseChildren.push($.Deferred());
}
$.when
  .apply(this, promiseChildren)
  .done(function(data1, data2, data3, data4, data5, data6, data7, data8) {
    var chapterContainer1 = (function() {
      var container1 = (function(data) {
        if(!data.length){
          return;
        }
        var index = 1,
          faultNames = [],
          html = '',
          faultIds = [];
        for (var k in data[1].consequenceMap) {
          faultNames.push(data[1].faultMap[k]);
          faultIds.push(k);
        }
        if (faultIds.filter(function(v){return data[5].infoMap[v] && data[5].infoMap[v].lifeCost>0}).length) {
          html += 
            (getText('1. Equipment health',{},'bFs') + 
            getText('Equipment health {str1} compared to the week before last{str2}. Major faults that damage equipment are as follows.',{},'sFs') +
            getText('a) {p}',{},'sFs'))
            .formatEL(
            {
              str1:
                data[0].ratio == '0.0%'
                  ? data[0].key
                  : '{key} {ratio}'.formatEL({
                      key: data[0].key,
                      ratio: data[0].ratio
                    }),
              str2:
                data[0].ratio == '0.0%'
                  ? ''
                  : ' due mostly to an increase in equipment faults',
              p: faultIds.filter(function(v){return data[5].infoMap[v] && data[5].infoMap[v].lifeCost>0})
                .map(function(v, i) {
                  return 'There exists {name} with {value}.'.formatEL({
                    name: data[1].faultMap[v],
                    value: getEtcStr(
                      data[1].consequenceMap[v].map(function(b) {
                        return b[0];
                      }),3
                    )
                  });
                })
                .join('\n')
            }
          );
          index++;
        }
        html += 
          (getText('{index}. Energy',{},'bFs')+
          getText('{str}',{},'sFs')).formatEL(
          {
            index: index++,
            str: data[3].str ? ' ' + data[3].str : '.'
          }
        );
        var thermalComfort = '';
        if (data[4].undercool > 0 && data[4].overheat > 0) {
          thermalComfort =
            '{undercool} rooms were overcooled and {overheat} were overheated last week.';
        } else if (data[4].undercool > 0) {
          thermalComfort = '{undercool} rooms were overcooled last week.';
        } else if (data[4].overheat > 0) {
          thermalComfort = '{overheat} rooms were overheated last week.';
        } else {
          thermalComfort =
            'None of the rooms were overcooled or overheated last week.';
        }
        html += (getText('{index}. Thermal comfort',{},'bFs')+getText('{thermalComfort}',{},'sFs')).formatEL(
          {
            index: index,
            thermalComfort: thermalComfort.formatEL({
              undercool: data[4].undercool,
              overheat: data[4].overheat
            })
          }
        );
        return {
          id: ObjectId(),
          modal: {
            option: {
              chapterDisplay: '',
              chapterSummary: { css: '', html: '', js: '' },
              chapterTitle: strMap[1],
              layouts: [
                {
                  id: ObjectId(),
                  modal: {
                    option: {
                      css:getCss(),
                      html: (getText('Major issues are outlined as below:',{},'sFs')+
                            '<div id="wrap">\
                              {html}\
                            </div>\
                            ').formatEL(
                        {
                          html: html
                        }
                      ),
                      js: ''
                    },
                    type: 'Html',
                    isReadonly: CONFIG.ISREADONLY
                  },
                  spanC: 12,
                  spanR: 1
                }
              ],
              isPageBreak: CONFIG.PAGEBREAK_LEVEL2
            },
            isReadonly: CONFIG.ISREADONLY,
            type: 'ChapterContainer'
          },
          spanC: 12,
          spanR: 4
        };
      })(data7['1-1']);
      var container2 = (function(data) {
        if(!data.length){
          return;
        }
        data[1].faultNameArr = data[1].faultNameArr.filter(function(v) {
          return data[1].infoMap[v[3]].consequence ==='Equipment Health';
        });
        var faultNameArrFilter = data[1].faultNameArr.filter(function(v) {
          return v[2] != '0.0';
        });
        var tableStr = '<table><thead><tr><th>{th1}</th><th>{th2}</th><th>{th3}</th></tr></thead><tbody>{tbody}</tbody></table>'.formatEL(
          {
            th1: strMap[66],
            th2: strMap[67],
            th3: strMap[68],
            tbody: faultNameArrFilter
              .map(function(v) {
                return '<tr><td>{name}</td><td>{entityName}</td><td>{lifeCost}</td></tr>'.formatEL(
                  {
                    name: v[0],
                    entityName: getEtcStr(data[2].consequenceMap[v[3]].map(function(v){return v[0]}),3),
                    lifeCost: v[2]
                  }
                );
              })
              .join('')
          }
        );
        return {
          id: ObjectId(),
          modal: {
            option: {
              chapterDisplay: '',
              chapterSummary: { css: '', html: '', js: '' },
              chapterTitle: strMap[2],
              layouts: [
                {
                  id: ObjectId(),
                  modal: {
                    option: {
                      css: getCss(),
                      html: ('\
                              '+getText('Equipment health scored {ratio} over last week.',{},'sFs')+'\
                              {str}\
                              <div class="tableWrap">{tableStr}</div>\
                            ').formatEL(
                        {
                          ratio: data[0].ratio,
                          str: data[1].faultNameArr.length
                            ? getText('Faults that potentially damage equipment have been detected, such as {str}. {str2}',{
                              str: getAndStr(
                                data[1].faultNameArr
                                  .slice(0, 2)
                                  .map(function(v) {
                                    return v[0];
                                  })
                              ),
                              str2: faultNameArrFilter.length ? 'They are resulting in equipment depreciation as below unless they are amended.':''
                            },'sFs')
                            : '',

                          tableStr: faultNameArrFilter.length ? tableStr : ''
                        }
                      ),
                      js: ''
                    },
                    type: 'Html',
                    isReadonly: CONFIG.ISREADONLY
                  },
                  spanC: 12,
                  spanR: 1
                }
              ],
              isPageBreak: CONFIG.PAGEBREAK_LEVEL2
            },
            isReadonly: CONFIG.ISREADONLY,
            type: 'ChapterContainer'
          },
          spanC: 12,
          spanR: 4
        };
      })(data7['1-2']);
      var container3 = (function(data) {
        if(!data.length){
          return;
        }
        return {
          id: ObjectId(),
          modal: {
            option: {
              chapterDisplay: '',
              chapterSummary: { css: '', html: '', js: '' },
              chapterTitle: strMap[3],
              layouts: [
                {
                  id: ObjectId(),
                  modal: {
                    option: {
                      css: getCss(),
                      html: ('\
                              '+getText('The building consumed {energy} electricity last week, equivalent to {price} in costs.',{},'sFs')+'\
                              {mostEnergyTxt}\
                              {advises}\
                              {md}\
                            ').formatEL(
                        {
                          energy: data[0].energy,
                          price: data[0].price,
                          mostEnergyTxt: data[0].energySave == (moneyUnit + '0.0')?'':getText('Faults that potentially waste energy have been detected, such as {faultNmae}. They are resulting in additional annual cost of {cost} unless they are amended.',{
                            faultNmae: data[2].faultNameArrEnergyDesc[0],
                            cost:data[0].energySave
                          },'sFs'),
                          advises:
                            data[0].savingEnergy == '0.0kWh'
                              ? ''
                              : getText('AdOPT advises annual saving of {savingEnergy}, or {savingPrice}, in electricity use of the chiller plant if the optimal sequence recommended last week is adopted.',{
                                savingEnergy: data[0].savingEnergy,
                                    savingPrice: data[0].savingPrice
                              },'sFs'),
                          md:
                            data[1].maxUsage == '0.0kVA'
                              ? ''
                              : getText('Maximum demand of this month is {maxUsage}, accounting for {declaredLimit} of the quota.',{
                                maxUsage: data[1].maxUsage,
                                    declaredLimit: data[1].declaredLimit,
                                    forecast: data[1].forecast
                              },'sFs')
                        }
                      ),
                      js: ''
                    },
                    type: 'Html',
                    isReadonly: CONFIG.ISREADONLY
                  },
                  spanC: 12,
                  spanR: 1
                }
              ],
              isPageBreak: CONFIG.PAGEBREAK_LEVEL2
            },
            isReadonly: CONFIG.ISREADONLY,
            type: 'ChapterContainer'
          },
          spanC: 12,
          spanR: 4
        };
      })(data7['1-3']);
      var container4 = (function(data) {
        if(!data.length){
          return;
        }
        // weekCoolData: [],
        //   lastWeekCoolData: [],
        //   weekHeatData: [],
        //   lastWeekHeatData: [],
        //   weekTime: [],
        //   lastWeekTime: [],
        //   coolD: 0,
        //   heatD: 0
        var coolD = data[1].coolD,
          heatD = data[1].heatD,
          coolCompare = 'remains unchanged',
          heatCompare = 'remains unchanged';
        if(Number(coolD.toFixed(1))>0){
          coolCompare = 'increases by {coolD}%';
        }else if(Number(coolD.toFixed(1))<0){
          coolCompare = 'decreases by {coolD}%';
          coolD = -coolD;
        }
        if(Number(heatD.toFixed(1))>0){
          heatCompare = 'increases by {heatD}%';
        }else if(Number(heatD.toFixed(1))<0){
          heatCompare = 'decreases by {heatD}%';
          heatD = -heatD;
        }
        coolCompare = coolCompare.formatEL({
          coolD:coolD.toFixed(1)
        });
        heatCompare = heatCompare.formatEL({
          heatD:heatD.toFixed(1)
        });
        var weekArr = [
          strMap[40],
          strMap[41],
          strMap[42],
          strMap[43],
          strMap[44],
          strMap[45],
          strMap[46]
        ];
        return {
          id: ObjectId(),
          modal: {
            option: {
              chapterDisplay: '',
              chapterSummary: { css: '', html: '', js: '' },
              chapterTitle: strMap[69],
              layouts: [
                {
                  id: ObjectId(),
                  modal: {
                    option: {
                      css: getCss(),
                      html: ('\
                              '+getText('{undercoolStr}',{},'sFs')
                               +getText('{overheatStr}',{},'sFs')+'\
                              {str}\
                            ').formatEL(
                        {
                          undercoolStr:
                            data[0].undercool == 0
                              ? 'None of the rooms were overcooled last week.'
                              : '{undercool} rooms, {undercoolC} of the total, were overcooled last week. Compared to the week before last, the average overcooling rate {coolCompare}.'.formatEL(
                                  {
                                    undercool: data[0].undercool,
                                    undercoolC: data[0].undercoolC,
                                    coolCompare: coolCompare
                                  }
                                ),
                          overheatStr:
                            data[0].overheat == 0
                              ? 'None of the rooms were overheated last week.'
                              : '{overheat} rooms, {overheatC} of the total, were overheated last week. Compared to the week before last, the average overheating rate {heatCompare}.'.formatEL(
                                  {
                                    overheat: data[0].overheat,
                                    overheatC: data[0].overheatC,
                                    heatCompare: heatCompare
                                  }
                                ),
                          str:
                            data[0].undercool == 0 && data[0].overheat == 0
                              ? ''
                              : getText('Due to resulted thermal discomfort in {sum} rooms, there would be increasing risks of tenant complaints.',{
                                sum: data[0].undercool + data[0].overheat
                              },'sFs')
                        }
                      ),
                      js: ''
                    },
                    type: 'Html',
                    isReadonly: CONFIG.ISREADONLY
                  },
                  spanC: 12,
                  spanR: 1
                },
                {
                  id: ObjectId(),
                  modal: {
                    option: {
                      chartOptions:JSON.stringify({
                        title:{
                          text:'Overcooling Rate'
                        },
                        tooltip:{
                          trigger: 'axis',
                          formatter:'{a0}: {c0}%<br />{a1}: {c1}%'
                        },
                        legend:{
                          data:[strMap[39],strMap[38]]
                        },
                        calculable: true,
                        xAxis: [{boundaryGap:true,type:'category',data:weekArr}],
                        yAxis: [{type:'value'}],
                        series: [{
                          name: strMap[39],
                          type:'line',
                          data:data[1].weekCoolData.map(function(v){return v.toFixed(2)}),
                          markLine: {
                            data: [
                                {type: 'average', name: 'average'}
                            ]
                          }
                        },{
                          name: strMap[38],
                          type:'line',
                          data:data[1].lastWeekCoolData.map(function(v){return v.toFixed(2)}),
                          markLine: {
                            data: [
                                {type: 'average', name: 'average'}
                            ]
                          }
                        }]
                      }),
                      chartType: 'line',
                      isExportData: false,
                      legend: [],
                      pointsSet: [],
                      timeFormat: 'm5',
                      timePeriod: 'lastDay'
                    },
                    points: [],
                    type: 'Chart',
                    variables: {},
                    isReadonly: CONFIG.ISREADONLY
                  },
                  spanC: 6,
                  spanR: CONFIG.CHARTHEIGHT
                },
                {
                  id: ObjectId(),
                  modal: {
                    option: {
                      chartOptions:JSON.stringify({
                        title:{
                          text:'Overheating Rate'
                        },
                        tooltip:{
                          trigger: 'axis',
                          formatter:'{a0}: {c0}%<br />{a1}: {c1}%'
                        },
                        legend:{
                          data:[strMap[39],strMap[38]]
                        },
                        calculable: true,
                        xAxis: [{boundaryGap:true,type:'category',data:weekArr}],
                        yAxis: [{type:'value'}],
                        series: [{
                          name: strMap[39],
                          type:'line',
                          data:data[1].weekHeatData.map(function(v){return v.toFixed(2)}),
                          markLine: {
                            data: [
                                {type: 'average', name: 'average'}
                            ]
                          }
                        },{
                          name: strMap[38],
                          type:'line',
                          data:data[1].lastWeekHeatData.map(function(v){return v.toFixed(2)}),
                          markLine: {
                            data: [
                                {type: 'average', name: 'average'}
                            ]
                          }
                        }]
                      }),
                      chartType: 'line',
                      isExportData: false,
                      legend: [],
                      pointsSet: [],
                      timeFormat: 'm5',
                      timePeriod: 'lastDay'
                    },
                    points: [],
                    type: 'Chart',
                    variables: {},
                    isReadonly: CONFIG.ISREADONLY
                  },
                  spanC: 6,
                  spanR: CONFIG.CHARTHEIGHT
                }
              ],
              isPageBreak: CONFIG.PAGEBREAK_LEVEL2
            },
            isReadonly: CONFIG.ISREADONLY,
            type: 'ChapterContainer'
          },
          spanC: 12,
          spanR: 4
        };
      })(data7['1-4']);
      var l = [];
      [container1, container2, container3, container4].forEach(function(v) {
        if (v) {
          l.push(v);
        }
      });

      return {
        id: ObjectId(),
        modal: {
          option: {
            chapterDisplay: '',
            chapterSummary: { css: '', html: '', js: '' },
            chapterTitle: strMap[0],
            isPageBreak: CONFIG.PAGEBREAK_LEVEL1,
            layouts: l
          },
          isReadonly: CONFIG.ISREADONLY,
          type: 'ChapterContainer'
        },
        spanC: 12,
        spanR: 4
      };
    })();
    var chapterContainer2 = (function() {
      var container1 = (function() {
        var text = getText(data1[3],{},'sFs');
        return {
          id: ObjectId(),
          modal: {
            option: {
              chapterDisplay: '',
              chapterSummary: { css: '', html: '', js: '' },
              chapterTitle: strMap[7],
              layouts: [
                {
                  id: ObjectId(),
                  modal: {
                    option: {
                      css: getCss(),
                      html: text,
                      js: ''
                    },
                    type: 'Html',
                    isReadonly: CONFIG.ISREADONLY,
                  },
                  spanC: 12
                }
              ],
              isPageBreak: CONFIG.PAGEBREAK_LEVEL2
            },
            isReadonly: CONFIG.ISREADONLY,
            type: 'ChapterContainer'
          },
          spanC: 12,
          spanR: 1
        };
      })();
      var container2 = (function() {
        var text = getText(strMap[26], {
          num: data1[4].saving*52
        },'sFs');
        if (data1[4].saving == 0) {
          text = getText('HVAC system works well.',{},'sFs');
        }
        return {
          id: ObjectId(),
          modal: {
            option: {
              chapterDisplay: '',
              chapterSummary: { css: '', html: '', js: '' },
              chapterTitle: strMap[8],
              layouts: [
                {
                  id: ObjectId(),
                  modal: {
                    option: {
                      css: getCss(),
                      html: text,
                      js: ''
                    },
                    type: 'Html',
                    isReadonly: CONFIG.ISREADONLY
                  },
                  spanC: 12
                }
              ],
              isPageBreak: CONFIG.PAGEBREAK_LEVEL2
            },
            isReadonly: CONFIG.ISREADONLY,
            type: 'ChapterContainer'
          },
          spanC: 12,
          spanR: 4
        };
      })();
      var container3 = (function() {
        // var text = getText(strMap[34]);
        // if (data4[1][0] == 1) {
        //   return undefined;
        // }
        var text = getText('Digital workflow is enabled, but has not been used.',{},'sFs');
        return {
          id: ObjectId(),
          modal: {
            option: {
              chapterDisplay: '',
              chapterSummary: { css: '', html: '', js: '' },
              chapterTitle: 'Work order supervision',//strMap[9],
              layouts: [
                {
                  id: ObjectId(),
                  modal: {
                    option: {
                      css: getCss(),
                      html: text,
                      js: ''
                    },
                    type: 'Html',
                    isReadonly: CONFIG.ISREADONLY
                  },
                  spanC: 12
                }
              ],
              isPageBreak: CONFIG.PAGEBREAK_LEVEL2
            },
            isReadonly: CONFIG.ISREADONLY,
            type: 'ChapterContainer'
          },
          spanC: 12,
          spanR: 4
        };
      })();
      var l = [container1, container2];
      if (container3) {
        l.push(container3);
      }
      return {
        id: ObjectId(),
        modal: {
          option: {
            chapterDisplay: '',
            chapterSummary: { css: '', html: '', js: '' },
            chapterTitle: strMap[6],
            isPageBreak: CONFIG.PAGEBREAK_LEVEL1,
            layouts: l
          },
          isReadonly: CONFIG.ISREADONLY,
          type: 'ChapterContainer'
        },
        spanC: 12,
        spanR: 4
      };
    })();
    var chapterContainer3 = (function() {
    var weekArr = [
        strMap[40],
        strMap[41],
        strMap[42],
        strMap[43],
        strMap[44],
        strMap[45],
        strMap[46]
        ];
        weekArr = weekArr
        .slice(periodStartTime, 7)
        .concat(weekArr.slice(0, periodStartTime));
      var container1 = (function() {
        var toYear = moment(startTime).format('YYYY'),
          lastYear = toYear - 1 + '',
          maxMonth = Number(moment().format('M')),
          toYearData = data5[0][1],
          lastYearData = data5[0][0];
        var toWeekData = data2[0][2] - data2[0][1],
          lastWeekData = data2[0][1] - data2[0][0],
          lastYearToWeekData = data5[1];
        var chart2Data = [lastYearToWeekData, lastWeekData, toWeekData];
        var toWeekNum = moment(startTime)
            .subtract({ day: 2 })
            .week(),
          lastWeekNum = toWeekNum - 1;
        var toWeekData = data5[2][1].map(function(v){return Math.round(v)}),
          lastWeekData = data5[2][0].map(function(v){return Math.round(v)});
        var weekArrStr = JSON.stringify(weekArr);
        return {
          id: ObjectId(),
          modal: {
            option: {
              chapterDisplay: '',
              chapterSummary: { css: '', html: '', js: '' },
              chapterTitle: strMap[11],
              layouts: [
                // {
                //   id: ObjectId(),
                //   modal: {
                //     option: {
                //       chartOptions:
                //         "{\ntitle : {\n        text: '" +
                //         strMap[35] +
                //         "'\n    },\n    tooltip : {\n        trigger: 'axis'\n    },\n    legend: {\n        data:['" +
                //         toYear +
                //         "','" +
                //         lastYear +
                //         "']\n    },\n    calculable : true,\n    xAxis : [\n        {\n    boundaryGap:true,        type : 'category',\n            data : ['01','02','03','04','05','06','07','08','09','10','11','12']\n        }\n    ],\n    yAxis : [\n        {\n            type : 'value'\n        }\n    ],\n    series : [\n        {\n            name:'" +
                //         toYear +
                //         "',\n            type:'bar',\n            data:[" +
                //         toYearData.join(',') +
                //         "],\n        },\n        {\n            name:'" +
                //         lastYear +
                //         "',\n            type:'bar',\n            data:[" +
                //         lastYearData.join(',') +
                //         '],\n           \n        }\n    ]\n}',
                //       chartType: 'bar',
                //       isExportData: false,
                //       legend: [],
                //       pointsSet: [],
                //       timeFormat: 'm5',
                //       timePeriod: 'lastDay'
                //     },
                //     points: [],
                //     type: 'Chart',
                //     variables: {},
                //     isReadonly: CONFIG.ISREADONLY
                //   },
                //   spanC: 12,
                //   spanR: CONFIG.CHARTHEIGHT
                // },
                // {
                //   id: ObjectId(),
                //   modal: {
                //     option: {
                //       chartOptions:
                //         "{\ntitle : {\n        text: '" +
                //         strMap[36] +
                //         "'\n    },\n    tooltip : {\n        trigger: 'axis'\n    },\n    calculable : true,\n    xAxis : [\n        {\n      boundaryGap:true,      type : 'category',\n            data : ['" +
                //         lastYear +
                //         ' ' +
                //         strMap[55].formatEL({ num: toWeekNum }) +
                //         "','" +
                //         toYear +
                //         ' ' +
                //         strMap[55].formatEL({ num: lastWeekNum }) +
                //         "','" +
                //         toYear +
                //         ' ' +
                //         strMap[55].formatEL({ num: toWeekNum }) +
                //         "']\n        }\n    ],\n    yAxis : [\n        {\n            type : 'value'\n        }\n    ],\n    series : [\n        {\n            name:'',\n            type:'bar',\n            data:[" +
                //         chart2Data.join(',') +
                //         '],\n        }]\n}',
                //       chartType: 'bar',
                //       isExportData: false,
                //       legend: [],
                //       pointsSet: [],
                //       timeFormat: 'm5',
                //       timePeriod: 'lastDay'
                //     },
                //     points: [],
                //     type: 'Chart',
                //     variables: {},
                //     isReadonly: CONFIG.ISREADONLY
                //   },
                //   spanC: 12,
                //   spanR: CONFIG.CHARTHEIGHT
                // },
                {
                  id: ObjectId(),
                  modal: {
                    option: {
                      css: getCss(),
                      html: getText(
                        'Energy use of last week is compared with the one of the week before last.',{},'sFs'
                      ),
                      js: ''
                    },
                    type: 'Html',
                    isReadonly: CONFIG.ISREADONLY
                  },
                  spanC: 12
                },
                {
                  id: ObjectId(),
                  modal: {
                    option: {
                      chartOptions: JSON.stringify({
                        title:{
                          text:strMap[37]
                        },
                        tooltip:{
                          trigger: 'axis'
                        },
                        legend:{
                          data:[strMap[39],strMap[38]]
                        },
                        calculable: true,
                        xAxis: [{boundaryGap:true,type:'category',data:weekArr}],
                        yAxis: [{type:'value'}],
                        series: [{name: strMap[39],type:'bar',data:toWeekData},{name: strMap[38],type:'bar',data:lastWeekData}]
                      }),
                      chartType: 'bar',
                      isExportData: false,
                      legend: [],
                      pointsSet: [],
                      timeFormat: 'm5',
                      timePeriod: 'lastDay'
                    },
                    points: [],
                    type: 'Chart',
                    variables: {},
                    isReadonly: CONFIG.ISREADONLY
                  },
                  spanC: 12,
                  spanR: CONFIG.CHARTHEIGHT
                }
              ],
              isPageBreak: CONFIG.PAGEBREAK_LEVEL2
            },
            isReadonly: CONFIG.ISREADONLY,
            type: 'ChapterContainer'
          },
          spanC: 12,
          spanR: 4
        };
      })();
      var container2 = (function(data) {
        var nameArr = ['Chillers','CHWP','CWP','CT','Tenant CWP','HWP'];
        data = data[0]||[];
        return {
            id: ObjectId(),
            modal: {
              option: {
                chapterDisplay: '',
                chapterSummary: { css: '', html: '', js: '' },
                chapterTitle: strMap[72],
                layouts: [
                  {
                    id: ObjectId(),
                    modal: {
                      option: {
                        chartOptions: JSON.stringify({
                          title:{
                            text:strMap[72]
                          },
                          tooltip:{
                            trigger: 'axis'
                          },
                          legend: {
                            data:nameArr
                          },
                          calculable: true,
                          xAxis: [{
                            type : 'category',
                            data : weekArr,
                            boundaryGap:true
                            }],
                          yAxis: [{type:'value'}],
                          series: nameArr.map(function(v,i){return {
                              name:v,
                              type:'bar',
                              data:data[i],
                              stack: 'Equipment'
                          }})
                        }),
                        chartType: 'bar',
                        isExportData: false,
                        legend: [],
                        pointsSet: [],
                        timeFormat: 'd1',
                        timePeriod: 'lastDay'
                      },
                      points: [],
                      type: 'Chart',
                      variables: {},
                      isReadonly: CONFIG.ISREADONLY
                    },
                    spanC: 12,
                    spanR: CONFIG.CHARTHEIGHT
                  }
                ],
                isPageBreak: CONFIG.PAGEBREAK_LEVEL2
              },
              isReadonly: CONFIG.ISREADONLY,
              type: 'ChapterContainer'
            },
            spanC: 12,
            spanR: 4
          };
      })(data8['3-2']);
      var container3 = (function(data) {
        var nameArr = ['Chiller1','Chiller2','Chiller3'];
        data = data[0]||[];
        return {
            id: ObjectId(),
            modal: {
              option: {
                chapterDisplay: '',
                chapterSummary: { css: '', html: '', js: '' },
                chapterTitle: strMap[71],
                layouts: [
                  {
                    id: ObjectId(),
                    modal: {
                      option: {
                        chartOptions: JSON.stringify({
                          title:{
                            text:strMap[71]
                          },
                          tooltip:{
                            trigger: 'axis'
                          },
                          legend: {
                            data:nameArr
                          },
                          calculable: true,
                          xAxis: [{
                            type : 'category',
                            data : weekArr,
                            boundaryGap:true
                            }],
                          yAxis: [{type:'value'}],
                          series: nameArr.map(function(v,i){return {
                              name:v,
                              type:'bar',
                              data:data[i],
                              stack: 'Chiller'
                          }})
                        }),
                        chartType: 'bar',
                        isExportData: false,
                        legend: [],
                        pointsSet: [],
                        timeFormat: 'd1',
                        timePeriod: 'lastDay'
                      },
                      points: [],
                      type: 'Chart',
                      variables: {},
                      isReadonly: CONFIG.ISREADONLY
                    },
                    spanC: 12,
                    spanR: CONFIG.CHARTHEIGHT
                  }
                ],
                isPageBreak: CONFIG.PAGEBREAK_LEVEL2
              },
              isReadonly: CONFIG.ISREADONLY,
              type: 'ChapterContainer'
            },
            spanC: 12,
            spanR: 4
          };
      })(data8['3-3']);
      var container4 = (function(data) {
        var weekData = data[0].data.splice(0,5),
          lastWeekData = data[1].data.splice(0,5),
          weekMap = data[2].map,
          lastWeekMap = data[3].map;

        var trs1 = '',
          trs2 = '';
        if (weekData.length) {
          weekData.forEach(function(v) {
            if(weekMap[v.faultId]){
              trs1 +=
                '<tr><td>' +
                v.faultName +
                '</td><td>' +
                v.className + '(×'+weekMap[v.faultId].entityNum+')'+
                '</td><td>' +
                weekMap[v.faultId].consequence +
                '</td><td>' +
                (Math.ceil(v.lifeCost)||Math.ceil(v.energy*Price)||'-') +
                '</td></tr>';
            }
            
          });
        } 
        if(!trs1) {
          trs1 = '<tr><td colspan=4>' + strMap[56] + '</td></tr>';
        }
        if (lastWeekData.length) {
          lastWeekData.forEach(function(v) {
            if(lastWeekMap[v.faultId]){
              trs2 +=
                '<tr><td>' +
                v.faultName +
                '</td><td>' +
                v.className + '(×'+lastWeekMap[v.faultId].entityNum+')'+
                '</td><td>' +
                lastWeekMap[v.faultId].consequence +
                '</td><td>' +
                (Math.ceil(v.lifeCost)||Math.ceil(v.energy*Price)||'-') +
                '</td></tr>';
            }
          });
        } 
        if(!trs2) {
          trs2 = '<tr><td colspan=4>' + strMap[57] + '</td></tr>';
        }

        return {
          id: ObjectId(),
          modal: {
            option: {
              chapterDisplay: '',
              chapterSummary: { css: '', html: '', js: '' },
              chapterTitle: strMap[12],
              layouts: [
                {
                  id: ObjectId(),
                  modal: {
                    option: {
                      css: getCss(),
                      html: getText(
                        (weekData.length<5||lastWeekData.length<5)?'Faults detected last week and the week before last are as follows.':'Top 5 faults detected last week and the week before last are as follows.',
                        {},
                        'sFs'
                      ),
                      js: ''
                    },
                    type: 'Html',
                    isReadonly: CONFIG.ISREADONLY
                  },
                  spanC: 12
                },
                {
                  id: ObjectId(),
                  modal: {
                    option: {
                      css: getCss(),
                      html:
                        '<div class="tableWrap"><table>\n<thead><tr><th>' +
                        strMap[47] +
                        '</th><th>' +
                        strMap[48] +
                        '</th><th>' +
                        'Consequence' +
                        '</th><th>' +
                        'Cost($/year)' +
                        '</th></tr></thead>\n  <tbody>' +
                        trs1 +
                        '</tbody>\n</table></div>\n<br/><br/><div class="tableWrap"><table>\n<thead><tr><th>' +
                        strMap[50] +
                        '</th><th>' +
                        strMap[48] +
                        '</th><th>' +
                        'Consequence' +
                        '</th><th>' +
                        'Cost($/year)' +
                        '</th></tr></thead>\n  <tbody>' +
                        trs2 +
                        '</tbody>\n</table></div>',
                      js: ''
                    },
                    type: 'Html',
                    isReadonly: CONFIG.ISREADONLY
                  },
                  spanC: 12,
                  spanR: 5
                }
              ],
              isPageBreak: CONFIG.PAGEBREAK_LEVEL2
            },
            isReadonly: CONFIG.ISREADONLY,
            type: 'ChapterContainer'
          },
          spanC: 12,
          spanR: 4
        };
      })(data8['3-4']);
      
      return {
        id: ObjectId(),
        modal: {
          option: {
            chapterDisplay: '',
            chapterSummary: { css: '', html: '', js: '' },
            chapterTitle: strMap[10],
            isPageBreak: CONFIG.PAGEBREAK_LEVEL1,
            layouts: [container1,container2,container3, container4]
          },
          isReadonly: CONFIG.ISREADONLY,
          type: 'ChapterContainer'
        },
        spanC: 12,
        spanR: 4
      };
    })();
    var layouts = [
      {
        id: ObjectId(),
        isNotRender: null,
        modal: {
          desc: null,
          dsChartCog: null,
          interval: null,
          link: null,
          modalText: null,
          modalTextUrl: null,
          option: {
            layouts: [chapterContainer1, chapterContainer2, chapterContainer3],
            period: 'week',
            periodStartTime: 0
          },
          points: null,
          popId: null,
          title: null,
          isReadonly: CONFIG.ISREADONLY,
          type: 'ReportContainer',
          wikiId: null
        },
        spanC: 12,
        spanR: 6
      }
    ];
    promise0.resolve(layouts);
  });

return promise0.fail(function() {
  webapiChildren.forEach(function(v) {
    v.abort();
  });
});
Energy use increases by 11998940.0% compared to the previous week due mostly to AirConditioning, whose energy use increases by 11998940.0%.