// Copyright (c) 2021 Terminus, Inc.
//
// This program is free software: you can use, redistribute, and/or modify
// it under the terms of the GNU Affero General Public License, version 3
// or later ("AGPL"), as published by the Free Software Foundation.
//
// This program is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
// FITNESS FOR A PARTICULAR PURPOSE.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

import { Echarts } from 'charts';
import Table, { IColumnProps } from 'common/components/table';
import { colorMap } from 'charts/theme';
import { ContractiveFilter, CardContainer, ErdaIcon, Title } from 'common';
import { useUpdate } from 'common/use-hooks';
import { Button, Col, InputNumber, Progress, Radio, Row, Select, Spin, Tooltip, Modal } from 'antd';
import { getResourceGauge, getResourceTable } from 'dcos/services/dashboard';
import { map } from 'lodash';
import React from 'react';
import routeInfoStore from 'core/stores/route';
import { useMount } from 'react-use';
import clusterStore from 'cmp/stores/cluster';
import { statusColorMap } from 'app/config-page/utils';
import i18n, { isZh } from 'i18n';
import { ColumnsType } from 'antd/es/table';
import './resources-summary.scss';

const defaultGaugeData = {
  cpu: {
    title: '',
    name: '',
    value: [],
    split: [],
  },
  memory: {
    title: '',
    name: '',
    value: [],
    split: [],
  },
  nodes: {
    title: '',
    name: '',
    value: [],
    split: [],
  },
};
export const ResourceSummary = React.memo(({ clusterNameStr }: { clusterNameStr: string }) => {
  const localCacheUnit = window.localStorage.getItem('cluster-summary-unit');
  const localCache = localCacheUnit ? localCacheUnit.split('-').map((a) => +a) : [8, 32];
  const cpuAndMem = React.useRef({
    cpuPerNode: localCache[0] || 8,
    memPerNode: localCache[1] || 32,
  });
  const [state, updater] = useUpdate({
    showCalculate: false,
  });

  const [data, loading] = getResourceGauge.useState();
  React.useEffect(() => {
    if (clusterNameStr) {
      getResourceGauge.fetch({ clusterName: clusterNameStr.split(','), ...cpuAndMem.current });
    }
  }, [clusterNameStr]);

  const getOption = (item: ORG_DASHBOARD.GaugeChartBody) => {
    const colors = [colorMap.blue, colorMap.green];
    const [assigned, used] = item.name.split('\n');
    const option = {
      tooltip: {
        formatter: '{a} <br/>{b} : {c}',
      },
      series: [
        {
          type: 'gauge',
          radius: '90%',
          startAngle: 200,
          endAngle: -20,
          axisLine: {
            lineStyle: {
              // width: 14,
              color: [...item.split, 1].map((a, i) => [a, colors[i]]),
            },
          },
          itemStyle: {
            shadowColor: 'rgba(0, 0, 0, 0.5)',
            shadowBlur: 6,
            shadowOffsetX: 2,
            shadowOffsetY: 2,
            color: colorMap.red,
          },
          splitLine: {
            // 分隔线
            length: 12, // 属性length控制线长
          },
          detail: {
            color: colorMap.red,
            formatter: used ? [`{assigned|${assigned}}`, `{used|${used}}`].join('\n') : `{assigned|${assigned}}`,
            rich: {
              assigned: {
                color: colorMap.blue,
                fontSize: 18,
              },
              used: {
                color: colorMap.red,
                marginTop: '20px',
                fontSize: 18,
              },
            },
            offsetCenter: [0, '60%'],
          },
          label: {},
          title: {
            color: colorMap.red,
          },
          data: item.value,
        },
      ],
    };
    return option;
  };

  return (
    <>
      {/* <Title
        level={2}
        title={i18n.t('cmp:resource distribute')}
        tip={
          <div className="text-xs">
            <div>
              {i18n.t('cmp:Allocated resources&#58; The resources reserved by project resource Quota are configured')}
            </div>
            <div>
              {i18n.t(
                'cmp:Occupied resource&#58; The portion of allocated resource actually occupied by Kubernetes Request resource Request',
              )}
            </div>
          </div>
        }
        tipStyle={{ width: '500px' }}
        operations={}
      /> */}
      {/* <Row justify="space-between" gutter={12}>
        {map(data || defaultGaugeData, (item, key) => (
          <Col key={key} span={8}>
            <CardContainer.ChartContainer title={item?.title} holderWhen={!item}>
              <Echarts style={{ height: '320px' }} showLoading={loading} option={getOption(item)} />
            </CardContainer.ChartContainer>
          </Col>
        ))}
      </Row> */}
      <ResourceTable cpuPerNode={cpuAndMem.current.cpuPerNode} memPerNode={cpuAndMem.current.memPerNode} />
    </>
  );
});

const arrSortMinToMax = (_a: string, _b: string) => {
  const a = String(_a);
  const b = String(_b);
  let cReg =
    /^[\u4E00-\u9FCC\u3400-\u4DB5\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29]|[\ud840-\ud868][\udc00-\udfff]|\ud869[\udc00-\uded6\udf00-\udfff]|[\ud86a-\ud86c][\udc00-\udfff]|\ud86d[\udc00-\udf34\udf40-\udfff]|\ud86e[\udc00-\udc1d]/;
  if (!cReg.test(a) || !cReg.test(b)) {
    return a.localeCompare(b);
  } else {
    return a.localeCompare(b, 'zh');
  }
};
export const ResourceTable = React.memo(() => {
  const { getClusterList } = clusterStore.effects;
  const rankType = routeInfoStore.useStore((s) => s.params.rankType);
  const [{ ownerIds, projectIds, clusterName, clusters, showCalculate }, updater, update] = useUpdate({
    ownerIds: [],
    projectIds: [],
    clusterName: [],
    clusters: [],
    showCalculate: false,
  });
  useMount(() => {
    getClusterList().then((res: ORG_CLUSTER.ICluster[]) => {
      updater.clusters(res);
    });
  });

  const localCacheUnit = window.localStorage.getItem('cluster-summary-unit');
  const localCache = localCacheUnit ? localCacheUnit.split('-').map((a) => +a) : [8, 32];
  const cpuAndMem = React.useRef({
    cpuPerNode: localCache[0] || 8,
    memPerNode: localCache[1] || 32,
  });

  const { cpuPerNode, memPerNode } = cpuAndMem.current;

  const [data, loading] = getResourceTable.useState();
  React.useEffect(() => {
    if (clusters.length) {
      const curCluster = clusterName?.length ? clusterName : clusters.map((item) => item.name);
      getResourceTable.fetch({ clusterName: curCluster, cpuPerNode, memPerNode, groupBy: rankType });
    }
  }, [clusters, clusterName, rankType, cpuPerNode, memPerNode]);

  const mergedList = (data?.list || []).map((item) => ({
    ...item,
    projectName: item.projectDisplayName || item.projectName,
    ownerUserName: item.ownerUserNickname || item.ownerUserName,
  }));

  const columnsMap = {
    project: [
      {
        title: i18n.t('Project'),
        dataIndex: 'projectName',
        key: 'projectName',
        width: 300,
        subTitle: (_: string, record: ORG_DASHBOARD.ResourceTableRecord) => record.projectDesc,
      },
      {
        title: i18n.t('cmp:Owner'),
        dataIndex: 'ownerUserName',
        key: 'ownerUserName',
      },
    ],
    owner: [
      {
        title: i18n.t('cmp:Owner'),
        dataIndex: 'ownerUserName',
        key: 'ownerUserName',
      },
      {
        title: i18n.t('cmp:project count'),
        dataIndex: 'projectTotal',
        key: 'projectTotal',
        align: 'right',
        sorter: {
          compare: (a, b) => a.projectTotal - b.projectTotal,
        },
      },
    ],
  };

  const getStrokeColor = (val: number) => {
    if (val >= 80 && val < 100) {
      return statusColorMap.warning;
    } else if (val >= 100) {
      return statusColorMap.error;
    }
    return statusColorMap.success;
  };
  const columns: Array<IColumnProps<ORG_DASHBOARD.ResourceTableRecord>> = [
    ...columnsMap[rankType],
    {
      title: () => (
        <span className="inline-flex align-center">
          <span>{i18n.t('cmp:Number of used nodes')}</span>
          <Tooltip
            title={`${i18n.t('cmp:Node conversion formula')}: ${cpuAndMem.current.cpuPerNode} ${i18n.t('cmp:Core')} ${
              cpuAndMem.current.memPerNode
            } G = ${i18n.t('cmp:one node')}`}
          >
            <ErdaIcon type={'tishi'} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'nodes',
      key: 'nodes',
      align: 'right',
      sorter: {
        compare: (a, b) => a.nodes - b.nodes,
      },
      render: (text: string) => text,
    },
    {
      title: `${i18n.t('cmp:CPU quota')} (${i18n.t('cmp:Core')})`,
      dataIndex: 'cpuQuota',
      key: 'cpuQuota',
      align: 'right',
      sorter: {
        compare: (a, b) => a.cpuQuota - b.cpuQuota,
      },
      render: (text: string, c) => text,
    },
    {
      title: i18n.t('cmp:CPU usage'),
      dataIndex: 'cpuWaterLevel',
      key: 'cpuWaterLevel',
      align: 'right',
      sorter: {
        compare: (a, b) => a.cpuWaterLevel - b.cpuWaterLevel,
      },
      render: (_val: string, record: ORG_DASHBOARD.ResourceTableRecord) => {
        let value = +(_val ?? 0);
        value = +(`${value}`.indexOf('.') ? value.toFixed(2) : value);
        return !isNaN(+_val) ? (
          <Tooltip title={`${record.cpuRequest} / ${record.cpuQuota}`}>
            <span className="text-dark-8  mr-2">{`${value}%`}</span>
            <Progress
              percent={value}
              type="circle"
              width={20}
              strokeWidth={18}
              format={(v) => null}
              strokeColor={getStrokeColor(value)}
            />
          </Tooltip>
        ) : (
          _val
        );
      },
    },
    {
      title: `${i18n.t('cmp:MEM quota')} (G)`,
      dataIndex: 'memQuota',
      key: 'memQuota',
      align: 'right',
      sorter: {
        compare: (a, b) => a.memQuota - b.memQuota,
      },
      render: (text: string) => text,
    },
    {
      title: i18n.t('cmp:MEM usage'),
      dataIndex: 'memWaterLevel',
      key: 'memWaterLevel',
      align: 'right',
      sorter: {
        compare: (a, b) => a.memWaterLevel - b.memWaterLevel,
      },
      render: (_val: string, record: ORG_DASHBOARD.ResourceTableRecord) => {
        let value = +(_val ?? 0);
        value = +(`${value}`.indexOf('.') ? value.toFixed(2) : value);
        return !isNaN(+_val) ? (
          <Tooltip title={`${record.memRequest} / ${record.memQuota}`}>
            <span className="text-dark-8 mr-2">{`${value}%`}</span>
            <Progress
              type="circle"
              percent={value}
              width={20}
              strokeWidth={18}
              format={(v) => null}
              strokeColor={getStrokeColor(value)}
            />
          </Tooltip>
        ) : (
          _val
        );
      },
    },
  ];

  const list = data?.list || [];
  const membersList = list
    .filter((item) => list.find((prj) => prj.ownerUserID === item.ownerUserID) === item)
    .map((prj) => ({
      label: prj.ownerUserNickname || prj.ownerUserName,
      value: prj.ownerUserID,
    }));

  const projectsList = list.map((prj) => ({
    label: prj.projectDisplayName || prj.projectName,
    value: prj.projectID,
  }));

  const conditionMap = {
    project: [
      {
        type: 'select',
        key: 'projectIds',
        label: i18n.t('Project'),
        haveFilter: true,
        fixed: true,
        emptyText: i18n.t('dop:all'),
        options: projectsList,
      },
      {
        type: 'select',
        key: 'ownerIds',
        label: i18n.t('cmp:Owner'),
        haveFilter: true,
        fixed: true,
        emptyText: i18n.t('dop:all'),
        options: membersList,
      },
    ],
    owner: [
      {
        type: 'select',
        key: 'ownerIds',
        label: i18n.t('cmp:Owner'),
        haveFilter: true,
        fixed: true,
        emptyText: i18n.t('dop:all'),
        options: membersList,
      },
    ],
  };
  const conditionsFilter = [
    {
      type: 'select',
      key: 'clusterName',
      label: i18n.t('cluster'),
      haveFilter: true,
      fixed: true,
      emptyText: i18n.t('dop:all'),
      options: clusters.map((item) => ({ label: item.name, value: item.name })),
    },
    ...conditionMap[rankType],
  ];

  let filterData = mergedList;
  if (ownerIds.length) {
    filterData = filterData.filter((a) => ownerIds.includes(a.ownerUserID));
  }
  if (projectIds.length) {
    filterData = filterData.filter((a) => projectIds.includes(a.projectID));
  }
  let cpuTotal = 0;
  let memoryTotal = 0;
  let nodeTotal = 0;
  filterData.forEach((a) => {
    cpuTotal += a.cpuQuota;
    memoryTotal += a.memQuota;
    nodeTotal += a.nodes;
  });
  return (
    <>
      {/* <Title
        level={2}
        mt={16}
        title={
          <span>
            {i18n.t('cmp:Allocation of project resources')}
            <span className="ml-1 text-desc text-xs">
              {i18n.t('cmp:The total number of selected resources')}: CPU: {cpuTotal.toFixed(2)} {i18n.t('cmp:Core')},{' '}
              {i18n.t('cmp:Memory')}: {memoryTotal.toFixed(2)} G, {i18n.t('cmp:Conversion nodes')}:{' '}
              {Math.ceil(nodeTotal)} {isZh() ? '个' : ''}
            </span>
          </span>
        }
      /> */}
      <Table
        filter={
          <div className="flex justify-between align-center">
            <ContractiveFilter
              delay={1000}
              conditions={conditionsFilter}
              onChange={(values) => {
                const curVal = {
                  ...values,
                  ownerIds: values.ownerIds || [],
                  projectIds: values.projectIds || [],
                };
                update(curVal);
              }}
            />
            <ErdaIcon
              className="ml-3 resource-summary-op-icon p-2"
              onClick={() => updater.showCalculate(true)}
              type="calculator-one"
              color="currentColor"
            />
          </div>
        }
        rowKey="projectID"
        loading={loading}
        columns={columns}
        dataSource={filterData}
      />

      <Modal
        visible={showCalculate}
        title={i18n.t('cmp:Node conversion formula')}
        onCancel={() => updater.showCalculate(false)}
        onOk={() => {
          window.localStorage.setItem(
            'cluster-summary-unit',
            `${cpuAndMem.current.cpuPerNode}-${cpuAndMem.current.memPerNode}`,
          );
          updater.showCalculate(false);
        }}
      >
        <div className="flex items-center">
          <InputNumber
            min={1}
            max={9999}
            defaultValue={cpuAndMem.current.cpuPerNode}
            onChange={(value) => {
              cpuAndMem.current.cpuPerNode = value;
            }}
            size="small"
            style={{ width: '80px' }}
          />
          <span>{i18n.t('cmp:Core')}</span>
          <InputNumber
            min={1}
            max={9999999}
            defaultValue={cpuAndMem.current.memPerNode}
            onChange={(value) => {
              cpuAndMem.current.memPerNode = value;
            }}
            size="small"
            className="ml-1"
            style={{ width: '80px' }}
          />
          <span>G = {i18n.t('cmp:one node')}</span>
        </div>
      </Modal>
    </>
  );
});