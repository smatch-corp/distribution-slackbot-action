import * as core from '@actions/core'
import * as github from '@actions/github'
import { Bits, Blocks, Message, SlackMessageDto } from 'slack-block-builder'
import { dedent } from 'ts-dedent'
import { match } from 'ts-pattern'
import { z } from 'zod'
import { COLORS, MEMBERS } from './constants'
import { InputSchema } from './inputs'
import { getOctoClient } from './clients'

export async function createThreadMainMessage(
  inputs: z.infer<typeof InputSchema>
): Promise<SlackMessageDto> {
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
        text: `${mentionGroup(inputs.group_id)} (임시 텍스트)`
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
          구분 : ${mentionMember(MEMBERS[github.context.actor])}, ${inputs.team}
          서비스 : ${inputs.service_name}
          배포 환경 : ${inputs.environment}
          진행 상태 : ${match(inputs.phase)
            .with('start', () => '배포 진행중 :loading:')
            .with('finish', () => '배포 완료 :ballot_box_with_check:')
            .otherwise(() => '')}
          변경 사항 : ${createFormattedJiraIssueLinks()}
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
          `배포가 시작되었습니다. 변경 사항을 입력해주세요. ${createFormattedLink(permaLink, '스레드로 가기&gt;&gt;')}`
        )
      })
    )
    .buildToObject()

  return message
}

function mentionMember(memberId: string): string {
  return `<@${memberId}>`
}

function mentionGroup(groupId: string | null | undefined): string {
  return groupId ? `<!subteam^${groupId}>` : ''
}

function extractJiraIssueKey(title: string): string {
  const match = title.match(/^\[(\w+-\d+)\]/)

  return match ? match[1] : ''
}

async function createFormattedJiraIssueLinks() {
  const commitMessages = await getAssociatedCommitMessages()

  return commitMessages.map(message =>
    createFormattedLink(
      createJiraIssueLink(extractJiraIssueKey(message)),
      message
    )
  )
}

async function getAssociatedCommitMessages(): Promise<string[]> {
  if (github.context.payload.pull_request) {
    const octoClient = getOctoClient()
    const associatedCommits = await octoClient.rest.pulls.listCommits({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: github.context.payload.pull_request.number
    })

    return associatedCommits.data.map(p => p.commit.message)
  }
  return []
}

function createJiraIssueLink(issueKey: string): string {
  return issueKey ? `https://billynco.atlassian.net/browse/${issueKey}` : ''
}

function createFormattedLink(link: string, text: string): string {
  return link ? `<${link}|${text}>` : ''
}
