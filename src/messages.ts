import * as core from '@actions/core'
import * as github from '@actions/github'
import { Bits, Blocks, Md, Message, SlackMessageDto } from 'slack-block-builder'
import { dedent } from 'ts-dedent'
import { match } from 'ts-pattern'
import { z } from 'zod'
import { COLORS, MEMBERS } from './constants'
import { InputSchema } from './inputs'
import { getOctoClient } from './clients'

export async function createThreadMainMessage(
  inputs: z.infer<typeof InputSchema>
): Promise<SlackMessageDto> {
  const commitMessages = await getAssociatedCommitMessages(inputs.before_ref)

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
    .blocks(
      Blocks.Section({
        text: dedent(`
          ${Md.group(inputs.group_id)}
          ${await createFormattedJiraIssueLinks(commitMessages)}
        `)
      })
    )
    .attachments(
      Bits.Attachment({
        color: match(inputs.phase)
          .with('start', () => COLORS.PENDING)
          .with('finish', () => COLORS.SUCCESS)
          .otherwise(() => COLORS.ERROR)
      }).blocks(
        Blocks.Section({
          text: dedent(`
          구분 : ${Md.user(MEMBERS[github.context.actor])}, ${inputs.team}
          서비스 : ${inputs.service_name}
          배포 환경 : ${inputs.environment}
          진행 상태 : ${match(inputs.phase)
            .with('start', () => '배포 진행중 :loading:')
            .with('finish', () => '배포 완료 :ballot_box_with_check:')
            .otherwise(() => '')}
          `)
        })
      )
    )
    .buildToObject()
  return message
}

export function createDirectMessageToActor(
  permaLink: string | undefined
): SlackMessageDto {
  if (!permaLink) throw new Error('permaLink is missing')

  const message = Message({ channel: MEMBERS[github.context.actor] })
    .blocks(
      Blocks.Section({
        text: dedent(
          `배포가 시작되었습니다. 변경 사항을 확인해주세요. ${Md.link(permaLink, '스레드로 가기&gt;&gt;')}`
        )
      })
    )
    .buildToObject()

  return message
}

function extractJiraIssueKey(title: string): string {
  const match = title.match(/^\[(\w+-\d+)\]/)
  return match ? match[1] : ''
}

async function createFormattedJiraIssueLinks(commitMessages: string[]) {
  return commitMessages
    .map(message =>
      isJiraTicket(message)
        ? `${Md.link(createJiraIssueLink(extractJiraIssueKey(message)), message)}`
        : ''
    )
    .filter(Boolean)
    .join('\n')
}

function isJiraTicket(message: string): boolean {
  return !!extractJiraIssueKey(message)
}

async function getAssociatedCommitMessages(
  beforeRef: string
): Promise<string[]> {
  const octoClient = getOctoClient()

  core.info(`BEFORE REF: ${beforeRef}`)
  const latestReleases = await octoClient.rest.repos.listReleases({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo
    // per_page: 2
  })

  const release = await octoClient.rest.repos.getLatestRelease({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo
  })

  const eventName = github.context.eventName
  const action = github.context.action
  core.info(`EVENT NAME: ${eventName}`)
  core.info(`ACTION: ${action}`)
  core.info(`CURRENT`)
  // core.info(`LATEST RELEASE: ${JSON.stringify(release, null, 2)}`)
  core.info(`LATEST RELEASES: ${JSON.stringify(latestReleases, null, 2)}`)

  const baseRef = release.data.tag_name
  const headRef = github.context.sha

  const associatedCommits =
    await octoClient.rest.repos.compareCommitsWithBasehead({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      // basehead: `${beforeRef}...${github.context.sha}`
      basehead: `${baseRef}...${headRef}`
    })
  return associatedCommits.data.commits.map(commit => commit.commit.message)
}

function createJiraIssueLink(issueKey: string): string {
  return issueKey ? `https://billynco.atlassian.net/browse/${issueKey}` : ''
}
