import * as github from '@actions/github';
import { Bits, Blocks, Md, Message } from 'slack-block-builder';
import { dedent } from 'ts-dedent';
import { match } from 'ts-pattern';
import { COLORS, MEMBERS, NONEXSISTANT_SHA } from './constants';
import { getOctoClient } from './clients';
export async function createThreadMainMessageSurface(inputs) {
    const commitMessages = await getAssociatedCommitMessages(inputs.before_ref);
    const message = Message({
        channel: inputs.channel_id,
        text: match(inputs.phase)
            .with('start', () => '배포 진행중 :loading:')
            .with('finish', () => '배포 완료 :ballot_box_with_check:')
            .otherwise(() => ''),
        ts: match(inputs)
            .with({ phase: 'finish' }, ({ thread_ts }) => thread_ts)
            .otherwise(() => undefined)
    })
        .blocks(Blocks.Divider(), Blocks.Section({
        text: dedent `
          ${Md.group(inputs.group_id)}
          ${Md.listBullet(await createFormattedJiraIssueLinks(commitMessages))}
          `
    }))
        .attachments(Bits.Attachment({
        color: match(inputs.phase)
            .with('start', () => COLORS.PENDING)
            .with('finish', () => COLORS.SUCCESS)
            .otherwise(() => COLORS.ERROR)
    }).blocks(Blocks.Section({
        text: dedent `
          서비스 : ${inputs.service_name}
          배포 환경 : ${inputs.environment}
          구분 : ${Md.user(MEMBERS[github.context.actor])}, ${inputs.team}
          Run ID : ${createGithubRunLink()}
          진행 상태 : ${match(inputs.phase)
            .with('start', () => '배포 진행중 :loading:')
            .with('finish', () => '배포 완료 :ballot_box_with_check:')
            .otherwise(() => '')}
          `
    })))
        .buildToObject();
    return message;
}
function createGithubRunLink() {
    return Md.link(`https://github.com/${github.context.repo.owner}/${github.context.repo.repo}/actions/runs/${github.context.runId}`, String(github.context.runId));
}
export function createDirectMessageToActor(permaLink) {
    if (!permaLink)
        throw new Error('permaLink is missing');
    const message = Message({ channel: MEMBERS[github.context.actor] })
        .blocks(Blocks.Section({
        text: dedent `배포가 시작되었습니다. 변경 사항을 확인해주세요. ${Md.link(permaLink, '스레드로 가기&gt;&gt;')}`
    }))
        .buildToObject();
    return message;
}
export async function createFormattedJiraIssueLinks(commitMessages) {
    return commitMessages
        .map(message => isJiraTicket(message)
        ? `${Md.link(createJiraIssueLink(extractJiraIssueKey(message)), message)}`
        : '')
        .filter(Boolean);
}
async function getAssociatedCommitMessages(beforeRef) {
    const octoClient = getOctoClient();
    const baseRef = await commitShaOrReleaseTag(beforeRef);
    const headRef = github.context.sha;
    const associatedCommits = await octoClient.rest.repos.compareCommitsWithBasehead({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        basehead: `${baseRef}...${headRef}`
    });
    return [
        ...new Set(associatedCommits.data.commits.map(commit => commit.commit.message))
    ];
}
async function getPreviousRelease() {
    const octoClient = getOctoClient();
    const latestTwoReleases = await octoClient.rest.repos.listReleases({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        per_page: 2
    });
    const previousRelease = latestTwoReleases?.data.at(-1);
    if (!previousRelease) {
        throw new Error('No previous release found');
    }
    return previousRelease;
}
async function commitShaOrReleaseTag(beforeRef) {
    return isExistingSha(beforeRef)
        ? beforeRef
        : (await getPreviousRelease()).tag_name;
}
function isExistingSha(sha) {
    return sha !== NONEXSISTANT_SHA;
}
export function extractJiraIssueKey(title) {
    const match = title.trim().match(/^\[(\w+-\d+)\]/);
    return match ? match[1] : '';
}
function isJiraTicket(message) {
    return !!extractJiraIssueKey(message);
}
function createJiraIssueLink(issueKey) {
    return issueKey ? `https://billynco.atlassian.net/browse/${issueKey}` : '';
}
//# sourceMappingURL=messages.js.map