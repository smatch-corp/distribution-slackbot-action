import * as github from '@actions/github'
import * as core from '@actions/core'
import { WebClient } from '@slack/web-api'
import { P, match } from 'ts-pattern'
import { z } from 'zod'
import { dedent } from 'ts-dedent'

const MEMBERS: Record<string, string> = { w00ing: 'U02U5KJ3G7P' }

const COLORS = {
  SUCCESS: '#2EB67D',
  PENDING: '#FFD166',
  ERROR: '#DE005B'
} as const

const InputSchema = z.discriminatedUnion('phase', [
  z.object({
    service_name: z.string(),
    channel_id: z.string(),
    team: z.string(),
    group_id: z.string().nullish(),
    phase: z.literal('start'),
    environment: z.string()
  }),
  z.object({
    service_name: z.string(),
    channel_id: z.string(),
    team: z.string(),
    group_id: z.string().nullish(),
    phase: z.literal('finish'),
    environment: z.string(),
    thread_ts: z.string()
  })
])

async function main(): Promise<void> {
  try {
    const inputs = InputSchema.parse({
      service_name: core.getInput('service_name', { required: true }),
      channel_id: core.getInput('channel_id', { required: true }),
      team: core.getInput('team', { required: true }),
      group_id: core.getInput('group_id'),
      phase: core.getInput('phase', { required: true }),
      environment: core.getInput('environment', { required: true }),
      thread_ts: core.getInput('thread_ts')
    })

    const GITHUB_TOKEN = getEnvVariable('GITHUB_TOKEN')
    const SLACKBOT_TOKEN = getEnvVariable('SLACKBOT_TOKEN')

    const githubClient = github.getOctokit(GITHUB_TOKEN)
    const slackClient = new WebClient(SLACKBOT_TOKEN)

    core.info(`Github context actor: ${github.context.actor}`)

    if (inputs.phase === 'start') {
      const messageResponse = await slackClient.chat.postMessage({
        channel: inputs.channel_id,
        text: '배포 진행중 :loading:',
        attachments: [
          {
            color: COLORS.PENDING,
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: dedent(`
                  구분 : ${mentionMember(MEMBERS[github.context.actor])}, ${inputs.team}
                  서비스 : ${inputs.service_name}
                  배포 환경 : ${inputs.environment}
                  `)
                }
              }
            ]
          }
        ],
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: dedent(`
              ${mentionGroup(inputs.group_id)}
              배포 진행중 :loading:`),
              emoji: true
            }
          },
          {
            type: 'divider'
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: createFormattedJiraIssueLink()
            }
          }
        ]
      })
      core.setOutput('thread_ts', messageResponse.ts)
      core.info(
        dedent(
          `Start message sent Successfully: ${JSON.stringify(messageResponse, null, 2)}`
        )
      )
    } else if (inputs.phase === 'finish') {
      const updatedMessageResponse = await slackClient.chat.update({
        channel: inputs.channel_id,
        ts: inputs.thread_ts,
        text: '배포 완료 :ballot_box_with_check:',
        attachments: [
          {
            color: COLORS.SUCCESS,
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: dedent(`
                  구분 : ${mentionMember(MEMBERS[github.context.actor])}, ${inputs.team}
                  서비스 : ${inputs.service_name}
                  배포 환경 : ${inputs.environment}
                  `)
                }
              }
            ]
          }
        ],
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '배포 완료 :ballot_box_with_check:'
            }
          },
          {
            type: 'divider'
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: createFormattedJiraIssueLink()
            }
          }
        ]
      })

      const replyMessageResponse = await slackClient.chat.postMessage({
        channel: inputs.channel_id,
        thread_ts: inputs.thread_ts,
        text: dedent(`배포 완료되었습니다.`)
      })

      core.info(
        dedent(
          `Finish message sent Successfully: ${JSON.stringify(replyMessageResponse, null, 2)}
           Message updated Successfully: ${JSON.stringify(updatedMessageResponse, null, 2)}
          `
        )
      )
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

function mentionMember(memberId: string): string {
  return `<@${memberId}>`
}

function mentionGroup(groupId: string | null | undefined): string {
  return groupId ? `<!subteam^${groupId}>` : ''
}

function getEnvVariable(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Env variable ${name} is missing.`)
  }
  return value
}

function extractJiraIssueKey(title: string): string {
  const match = title.match(/^\[(\w+-\d+)\]/)

  return match ? match[1] : ''
}

function createJiraIssueLink(issueKey: string): string {
  return issueKey ? `https://billynco.atlassian.net/browse/${issueKey}` : ''
}

function createFormattedJiraIssueLink(): string {
  const title = github.context.payload.pull_request?.title
  if (!title) return ''
  const issueKey = extractJiraIssueKey(title)
  const link = createJiraIssueLink(issueKey)
  return link ? `<${link}|${title}>` : ''
}

main()
