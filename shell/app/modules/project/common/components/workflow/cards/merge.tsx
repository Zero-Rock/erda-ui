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

import React from 'react';
import { ErdaIcon, Ellipsis, EmptyHolder } from 'common';
import i18n from 'i18n';
import { Popover, Tooltip } from 'antd';
import { goTo } from 'common/utils';
import { Commit, Branch, Status } from './base';
import { tempMerge } from 'project/services/project-workflow';
import classnames from 'classnames';

interface CardProps {
  data: DEVOPS_WORKFLOW.DevFlowInfo;
  className?: string;
  disabled: boolean;
  index: number;
  projectID: string;
  reload?: () => void;
}

const MergeCard = (props: CardProps) => {
  const { data, projectID, index, className, reload, disabled } = props;
  const { changeBranch, baseCommit, tempBranch } = data?.tempMergeNode;
  const { isJoinTempBranch, appID, flowRuleName, id } = data.devFlow || {};
  const { commit } = data?.codeNode;
  const status = changeBranch?.find((item) => item.commit?.id === commit?.id) ? 'success' : 'process';

  const ChangeList = (
    <div className="w-[344px]">
      <p className="pb-2 mb-2 border-0 border-b border-b-default-1 border-solid">{i18n.t('dop:Change list')}</p>
      {changeBranch?.map((item, idx) => {
        return (
          <div key={idx} className="flex-h-center p-2 hover:bg-default-06 overflow-hidden">
            <Branch
              className="w-[120px] mr-2 flex-shrink-0"
              branch={item.branchName}
              appId={appID}
              projectId={projectID}
            />
            {item.commit ? (
              <>
                <Commit
                  className="w-[60px] mr-2  flex-shrink-0"
                  commitId={item.commit?.id}
                  appId={`${appID}`}
                  projectId={projectID}
                />
                <div className="flex-h-center w-[140px] text-xs  flex-shrink-0">
                  <ErdaIcon type="caret-down" size="12" className="ml-1 text-default-4 -rotate-90" />
                  <Ellipsis className="flex-1 text-default-8" title={item.commit.commitMessage} />
                </div>
              </>
            ) : null}
          </div>
        );
      })}
      {!changeBranch?.length ? <EmptyHolder style={{ height: 100 }} relative /> : null}
    </div>
  );
  const cls = {
    'bg-default-04': disabled,
  };
  return (
    <div className={classnames(className, cls, 'hover:shadow flex w-[320px] h-[108px] border-all p-4 rounded')}>
      <Status index={index} status={status} />
      <div className="ml-2 flex-1 overflow-hidden">
        <div className="mb-3 flex-h-center justify-between">
          <div className="flex-h-center">
            <span>{i18n.t('dop:Temporary merge')}</span>
            <Tooltip
              title={i18n.t(
                'dop:Code branches of different tasks can be temporarily merged and deployed to the corresponding environment',
              )}
            >
              <ErdaIcon type="help" className="text-default-3 ml-1" />
            </Tooltip>
          </div>
          {!disabled && tempBranch && isJoinTempBranch ? (
            <div
              onClick={() => {
                tempMerge({ devFlowID: id, enable: false }).then(() => {
                  reload?.();
                });
              }}
              className={`px-3 rounded ${
                isJoinTempBranch ? 'cursor-pointer bg-purple-deep text-white' : 'bg-default-08 text-default-4'
              }`}
            >
              {i18n.t('dop:Revoke temporary merge')}
            </div>
          ) : null}
        </div>
        {tempBranch ? (
          <>
            <div className="flex-h-center mb-2 text-xs">
              <Branch appId={appID} projectId={projectID} branch={tempBranch} className="overflow-hidden" />
              <Popover content={ChangeList}>
                <span className="text-purple-deep cursor-pointer ml-2 whitespace-nowrap">
                  {i18n.t('dop:More merger information')}
                </span>
              </Popover>
            </div>
            <div className="flex-h-center text-xs">
              {baseCommit ? (
                <>
                  <Commit commitId={baseCommit.id} appId={appID} projectId={projectID} />
                  <ErdaIcon type="caret-down" size="12" className="ml-1 text-default-4 -rotate-90" />
                  <Ellipsis className="flex-1 text-default-8" title={baseCommit.commitMessage} />
                </>
              ) : (
                <>
                  <ErdaIcon type="commitID" className="mr-1 text-default-4" />
                  <Ellipsis
                    className="flex-1 text-default-8"
                    title={i18n.t('dop:This task branch has no content merged')}
                  />
                </>
              )}
            </div>
          </>
        ) : (
          <div className="text-xs text-default-8">
            <span>{i18n.t('dop:The temporary merge function is not currently enabled, please go to')}</span>
            &nbsp;
            <span
              className="text-purple-deep cursor-pointer"
              onClick={() => {
                goTo(goTo.pages.projectSetting, {
                  jumpOut: true,
                  query: { tabKey: 'workflow', flowName: flowRuleName },
                });
              }}
            >
              {i18n.t('dop:R&D Workflow')}
            </span>
            &nbsp;
            <span>{i18n.t('dop:to set')}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MergeCard;
