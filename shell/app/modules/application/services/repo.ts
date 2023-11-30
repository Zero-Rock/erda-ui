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

import agent from 'agent';
import { apiCreator } from 'core/service';
import { encodeNumberSign } from 'common/utils';

const apis = {
  getAppMR: {
    api: '/api/repo/:projectName/:appName/merge-requests',
  },
  getAppMRStatsCount: {
    api: '/api/repo/:projectName/:appName/merge-request-stats',
  },
};

export const getAppMR = apiCreator<(p: REPOSITORY.QueryMrs) => IPagingResp<REPOSITORY.MRItem>>(apis.getAppMR);

export const getAppMRStatsCount = apiCreator<(p: { projectName: string; appName: string }) => REPOSITORY.MRStatsCount>(
  apis.getAppMRStatsCount,
);

export const getRepoInfo = ({ repoPrefix, branch }: REPOSITORY.GetInfo): REPOSITORY.IInfo => {
  const api = `/api/repo/${repoPrefix}/stats${branch ? `/${branch}` : ''}`;
  return agent.get(api).then((response: any) => response.body);
};

// type: tree|blob|raw|blame
export const getFromRepo = ({
  path,
  type,
  repoPrefix,
  comment = true,
}: REPOSITORY.GetFromRepo):
  | REPOSITORY.ITree
  | REPOSITORY.IBlame[]
  | REPOSITORY.IBlob
  | string
  | Promise<{ success: true; data: Record<string, any> }> => {
  const [, ...after] = window.location.href.split('repo');
  const afterPath = after.join('repo').slice('/tree'.length);
  const realPath = encodeNumberSign(path || afterPath);
  // 当进入代码浏览页又快速退出时，url已经变了，此时取的afterPath是错的，所以判断一下
  if (!realPath.startsWith('/')) {
    return Promise.resolve({ success: true, data: {} });
  }
  return agent
    .get(`/api/repo/${repoPrefix}/${type}${realPath}`)
    .query({ comment })
    .then((response: any) => response.body);
};

export const parsePipelineYmlStructure = ({
  pipelineYmlContent,
}: {
  pipelineYmlContent: any;
}): IPipelineYmlStructure => {
  return agent
    .post('/api/pipelines/actions/pipeline-yml-graph')
    .send({ pipelineYmlContent })
    .then((response: any) => response.body);
};

export const getBuildId = ({ commitId, branch, appId }: REPOSITORY.QueryBuildId): string => {
  return agent
    .get('/api/ci/builds')
    .query({ appId, branch, commitId })
    .then((response: any) => response.body);
};

export const getBlobRange = ({
  repoPrefix,
  commitId,
  path,
  since,
  to,
  bottom,
  offset,
  unfold,
}: REPOSITORY.QueryBlobRange): REPOSITORY.IBlobRange => {
  return agent
    .get(`/api/repo/${repoPrefix}/blob/${commitId}/${path}?mode=range`)
    .query({ since, to, bottom, unfold, offset })
    .then((response: any) => response.body);
};

export const getCommits = ({
  search,
  repoPrefix,
  pageNo,
  pageSize,
  branch = '',
}: REPOSITORY.QueryCommit): REPOSITORY.ICommit[] | Promise<any[]> => {
  let branchPath = `${branch}`;
  if (!branch) {
    const match = window.location.href.match(/repo(\/\w+\/(.+))/);
    branchPath = match ? `${match[2]}` : '';
    if (!branchPath) {
      return Promise.resolve([]);
    }
  }
  return agent
    .get(`/api/repo/${repoPrefix}/commits/${encodeNumberSign(branchPath)}`)
    .query({ pageNo, pageSize, search })
    .then((response: any) => response.body);
};

export const getBranches = ({
  repoPrefix,
  ...rest
}: {
  repoPrefix: string;
  findBranch?: string;
}): REPOSITORY.IBranch => {
  return agent
    .get(`/api/repo/${repoPrefix}/branches`)
    .query(rest)
    .then((response: any) => response.body);
};

export const createBranch = ({ repoPrefix, branch, refValue }: REPOSITORY.CreateBranch): string => {
  return agent
    .post(`/api/repo/${repoPrefix}/branches`)
    .send({ name: branch, ref: refValue })
    .then((response: any) => response.body);
};

export const deleteBranch = ({ repoPrefix, branch }: Omit<REPOSITORY.CreateBranch, 'refValue'>): boolean => {
  return agent
    .delete(`/api/repo/${repoPrefix}/branches/${encodeNumberSign(branch)}`)
    .then((response: any) => response.body);
};

export const setDefaultBranch = ({ repoPrefix, branch }: Omit<REPOSITORY.CreateBranch, 'refValue'>): boolean => {
  return agent
    .put(`/api/repo/${repoPrefix}/branch/default/${encodeNumberSign(branch)}`)
    .then((response: any) => response.body);
};

export const getAvailableAddonList = (query: { projectId: string; workspace: string }): ADDON.Instance[] => {
  return agent
    .get('/api/addons/actions/list-available')
    .query(query)
    .then((response: any) => response.body);
};

export const getAddonInstanceList = (): DEPLOY.ExtensionAction[] => {
  return agent
    .get('/api/extensions')
    .query({ type: 'addon', labels: '^deployable:false' })
    .then((response: any) => response.body);
};

export const getAddonVersions = ({ addonName }: { addonName: string }): DEPLOY.ActionConfig[] => {
  return agent.get(`/api/extensions/${addonName}?all=true`).then((response: any) => response.body);
};

export const getTags = ({ repoPrefix, ...rest }: { repoPrefix: string; findTags?: string }): REPOSITORY.ITag[] => {
  return agent
    .get(`/api/repo/${repoPrefix}/tags`)
    .query(rest)
    .then((response: any) => response.body);
};

export const getMRs = ({
  repoPrefix,
  ...data
}: Merge<REPOSITORY.QueryMrs, { repoPrefix: string }>): { list: REPOSITORY.MRItem[]; total: number } => {
  return agent
    .get(`/api/repo/${repoPrefix}/merge-requests`)
    .query(data)
    .then((response: any) => response.body);
};

export const getMRStats = ({
  repoPrefix,
  ...data
}: Merge<REPOSITORY.MrStats, { repoPrefix: string }>): REPOSITORY.IMrState => {
  return agent
    .get(`/api/repo/${repoPrefix}/merge-stats`)
    .query(data)
    .then((response: any) => response.body);
};

export const createMR = ({
  repoPrefix,
  ...data
}: Merge<Omit<REPOSITORY.Mr, 'action'>, { repoPrefix: string }>): REPOSITORY.IMrDetail => {
  return agent
    .post(`/api/repo/${repoPrefix}/merge-requests`)
    .send(data)
    .then((response: any) => response.body);
};

export const getMRDetail = ({ repoPrefix, mergeId }: { repoPrefix: string; mergeId: string }): REPOSITORY.IMrDetail => {
  return agent.get(`/api/repo/${repoPrefix}/merge-requests/${mergeId}`).then((response: any) => response.body);
};

// action: edit | merge | close | revert
export const operateMR = ({
  repoPrefix,
  mergeId,
  action,
  ...data
}: Merge<REPOSITORY.OperateMR, { repoPrefix: string }>): Obj => {
  return agent
    .post(`/api/repo/${repoPrefix}/merge-requests/${mergeId}/${action}`)
    .send(data)
    .then((response: any) => response.body);
};

export const getCommitDetail = ({
  repoPrefix,
  commitId,
}: {
  repoPrefix: string;
  commitId: string;
}): REPOSITORY.CommitDetail => {
  return agent.get(`/api/repo/${repoPrefix}/commit/${commitId}`).then((response: any) => response.body);
};

export const getCompareDetail = ({
  repoPrefix,
  compareA,
  compareB,
}: Merge<REPOSITORY.QueryCompareDetail, { repoPrefix: string }>): REPOSITORY.CompareDetail => {
  return agent
    .get(`/api/repo/${repoPrefix}/compare/${encodeNumberSign(compareA)}...${encodeNumberSign(compareB)}`)
    .query({ limit: 500 })
    .then((response: any) => response.body);
};

export const commit = ({ repoPrefix, data }: { data: REPOSITORY.Commit; repoPrefix: string }): REPOSITORY.ICommit => {
  return agent
    .post(`/api/repo/${repoPrefix}/commits`)
    .send(data)
    .then((response: any) => response.body);
};

export const getComments = ({ repoPrefix, mergeId }: { repoPrefix: string; mergeId: string }): REPOSITORY.MrNote[] => {
  return agent.get(`/api/repo/${repoPrefix}/merge-requests/${mergeId}/notes`).then((response: any) => response.body);
};

export const addComment = ({
  repoPrefix,
  mergeId,
  ...data
}: Merge<Obj, { repoPrefix: string; mergeId: string }>): REPOSITORY.MrNote => {
  return agent
    .post(`/api/repo/${repoPrefix}/merge-requests/${mergeId}/notes`)
    .send(data)
    .then((response: any) => response.body);
};

export const getTemplateConfig = ({ repoPrefix }: { repoPrefix: string }): REPOSITORY.MrTemplate => {
  return agent.get(`/api/repo/${repoPrefix}/merge-templates`).then((response: any) => response.body);
};

export const getCIResource = ({
  type,
  commitId,
  sonarKey,
}: {
  type: string;
  commitId: string;
  sonarKey?: string;
}): Obj => {
  return agent.get(`/api/ci/sonar/type/${type}/key/${sonarKey || commitId}`).then((response: any) => response.body);
};

export const getPipelineTemplates = (query: REPOSITORY.IPipelineTemplateQuery): REPOSITORY.IPipelineTemplate[] => {
  return agent
    .get('/api/pipeline-templates')
    .query(query)
    .then((response: any) => response.body);
};

export const getPipelineTemplateYmlContent = ({
  name,
  ...rest
}: REPOSITORY.IPipelineTemplateContentQuery): REPOSITORY.IPipelineTemplateYml => {
  return agent
    .post(`/api/pipeline-templates/${name}/actions/render`)
    .send({ ...rest })
    .then((response: any) => response.body);
};

export const createTag = ({ repoPrefix, tag, ref, message }: REPOSITORY.CreateTag): string => {
  return agent
    .post(`/api/repo/${repoPrefix}/tags`)
    .send({ name: tag, ref, message })
    .then((response: any) => response.body);
};

export const deleteTag = ({ repoPrefix, tag }: REPOSITORY.CreateTag): boolean => {
  return agent.delete(`/api/repo/${repoPrefix}/tags/${tag}`).then((response: any) => response.body);
};

export const addBackup = ({
  repoPrefix,
  commitId,
  remark,
  branchRef,
}: Merge<REPOSITORY.IBackupAppendBody, { repoPrefix: string }>) => {
  return agent
    .post(`/api/repo/${repoPrefix}/backup/${branchRef}`)
    .send({ commitId, remark })
    .then((response: any) => response.body);
};

export const getBackupList = ({
  repoPrefix,
  pageNo,
  pageSize,
}: Merge<REPOSITORY.ICommitPaging, { repoPrefix: string }>) => {
  return agent
    .get(`/api/repo/${repoPrefix}/backup-list`)
    .query({ pageNo, pageSize })
    .then((response: any) => response.body);
};

export const deleteBackup = ({ repoPrefix, uuid }: Merge<REPOSITORY.IBackupUuid, { repoPrefix: string }>) => {
  return agent.delete(`/api/repo/${repoPrefix}/backup/${uuid}`).then((response: any) => response.body);
};

export const getLatestCommit = ({ repoPrefix, branchRef }: Merge<REPOSITORY.IBackupBranch, { repoPrefix: string }>) => {
  return agent.get(`/api/repo/${repoPrefix}/branches/${branchRef}`).then((response: any) => response.body);
};

export const setRepoLock = ({ repoPrefix, isLocked }: { repoPrefix: string; isLocked: boolean }) => {
  return agent
    .post(`/api/repo/${repoPrefix}/locked`)
    .send({ isLocked })
    .then((response: any) => response.body);
};

export const aiCodeReview = ({
  id,
  type,
  oldCommitId,
  newCommitId,
  oldPath,
  newPath,
  repoPrefix,
}: {
  id: string;
  type: string;
  oldCommitId: string;
  newCommitId: string;
  oldPath: string;
  newPath: string;
  repoPrefix: string;
}) => {
  return agent
    .post(`/api/repo/${repoPrefix}/merge-requests/${id}/ai-code-review`)
    .send({
      type,
      noteLocation: {
        oldCommitId,
        newCommitId,
        oldPath,
        newPath,
      },
    })
    .then((response: any) => response.body);
};
