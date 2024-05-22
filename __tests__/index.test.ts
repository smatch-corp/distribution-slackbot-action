import {
  createFormattedJiraIssueLinks,
  createThreadMainMessageSurface,
  extractJiraIssueKey
} from '../src/messages'
import {
  expect,
  describe,
  vi,
  it,
  beforeAll,
  beforeEach,
  afterAll
} from 'vitest'
import * as core from '@actions/core'
import * as github from '@actions/github'
import { InputSchema } from '../src/inputs'
import { main } from '../src/index'
import { SlackMessageDto } from 'slack-block-builder'

// Inputs for mock @actions/core
const inputs = InputSchema.parse({
  service_name: '스매치',
  channel_id: 'C06H62PLQNN',
  team: 'Front-End',
  group_id: 'S03V01C0H61',
  phase: 'start',
  before_ref: 'd44ca322aa05672cf28c06ed8242f05f2f7578a0',
  environment: 'staging'
})

const textBeforeFormatting = [
  ' [SMATCH01-1789] retool api#192 opened 3 hours ago by JYC11 updated 1 hour ago',
  '[SMATCH01-1850] auth 기능#193 opened 3 hours ago by JYC11',
  '[SMATCH01-1851] 신청하기#184 opened last week by JYC11 updated 3 hours ago',
  '[SMATCH01-1857] 제안 도메인 boilerplate code#181 op…ks ago by gwjang•  Approved updated 5 hours ago',
  '[SMATCH01-1866] 더 제안받기#190 opened 2 days ago by gwjang updated 5 hours ago 2',
  '[SMATCH01-1874] 제안시 PDF 생성#191 opened yesterday by gwjang updated 5 hours ago',
  '[SMATCH01-1901] 유저&신청 boilerplate code#174 open… ago by JYC11•  Approved updated yesterday 20',
  '[SMATCH01-1389] 맞춤 제안 매물 PDF 생성 - wip#22 opened on Jul 25'
]

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

beforeAll(() => {
  vi.stubEnv('SLACKBOT_TOKEN', process.env.SLACKBOT_TOKEN!)
  vi.stubEnv('GITHUB_TOKEN', process.env.GITHUB_TOKEN!)

  // Mock error/warning/info/debug
  vi.spyOn(core, 'error').mockImplementation(vi.fn())
  vi.spyOn(core, 'warning').mockImplementation(vi.fn())
  vi.spyOn(core, 'info').mockImplementation(vi.fn())
  vi.spyOn(core, 'debug').mockImplementation(vi.fn())

  // Mock github context
  vi.spyOn(github.context, 'repo', 'get').mockImplementation(() => {
    return {
      owner: 'smatch-corp',
      repo: 'distribution-slackbot-action'
    }
  })
  github.context.eventName = 'push'
  github.context.ref = 'd90bd39a392524a7d2a6b80c06d6874dbf00b003'
  github.context.sha = 'd90bd39a392524a7d2a6b80c06d6874dbf00b003'
  github.context.actor = 'w00ing'
  github.context.runId = 8001787168
})

describe('distribution-notification', () => {
  it('should extract jira issue key', () => {
    const formatted = textBeforeFormatting.map(extractJiraIssueKey)
    const intendedResult = [
      'SMATCH01-1789',
      'SMATCH01-1850',
      'SMATCH01-1851',
      'SMATCH01-1857',
      'SMATCH01-1866',
      'SMATCH01-1874',
      'SMATCH01-1901',
      'SMATCH01-1389'
    ]

    expect(formatted).toEqual(intendedResult)
  })
  it('should print out formatted jira tickets', async () => {
    const formatted = await createFormattedJiraIssueLinks(textBeforeFormatting)
    const intendedResult = [
      '<https://billynco.atlassian.net/browse/SMATCH01-1789| [SMATCH01-1789] retool api#192 opened 3 hours ago by JYC11 updated 1 hour ago>',
      '<https://billynco.atlassian.net/browse/SMATCH01-1850|[SMATCH01-1850] auth 기능#193 opened 3 hours ago by JYC11>',
      '<https://billynco.atlassian.net/browse/SMATCH01-1851|[SMATCH01-1851] 신청하기#184 opened last week by JYC11 updated 3 hours ago>',
      '<https://billynco.atlassian.net/browse/SMATCH01-1857|[SMATCH01-1857] 제안 도메인 boilerplate code#181 op…ks ago by gwjang•  Approved updated 5 hours ago>',
      '<https://billynco.atlassian.net/browse/SMATCH01-1866|[SMATCH01-1866] 더 제안받기#190 opened 2 days ago by gwjang updated 5 hours ago 2>',
      '<https://billynco.atlassian.net/browse/SMATCH01-1874|[SMATCH01-1874] 제안시 PDF 생성#191 opened yesterday by gwjang updated 5 hours ago>',
      '<https://billynco.atlassian.net/browse/SMATCH01-1901|[SMATCH01-1901] 유저&신청 boilerplate code#174 open… ago by JYC11•  Approved updated yesterday 20>',
      '<https://billynco.atlassian.net/browse/SMATCH01-1389|[SMATCH01-1389] 맞춤 제안 매물 PDF 생성 - wip#22 opened on Jul 25>'
    ]

    expect(formatted).toEqual(intendedResult)
  })

  it('should print out slack message correctly', async () => {
    const intendedResult: SlackMessageDto = {
      channel: 'C06H62PLQNN',
      text: '배포 진행중 :loading:',
      blocks: [
        {
          type: 'divider'
        },
        {
          text: {
            type: 'mrkdwn',
            text: '<!subteam^S03V01C0H61>\n• <https://billynco.atlassian.net/browse/SMATCH-2343|[SMATCH-2343] remove unnecessary import>\n• <https://billynco.atlassian.net/browse/FIX-124|[FIX-124] refactor>\n• <https://billynco.atlassian.net/browse/test-123|[test-123] separate actions>\n• <https://billynco.atlassian.net/browse/fix-1234|[fix-1234] fix>\n• <https://billynco.atlassian.net/browse/fix-4444|[fix-4444]>'
          },
          type: 'section'
        }
      ],
      attachments: [
        {
          color: '#FFD166',
          blocks: [
            {
              text: {
                type: 'mrkdwn',
                text: '서비스 : 스매치\n배포 환경 : staging\n구분 : <@U02U5KJ3G7P>, Front-End\nRun ID : <https://github.com/smatch-corp/distribution-slackbot-action/actions/runs/8001787168|8001787168>\n진행 상태 : 배포 진행중 :loading:'
              },
              type: 'section'
            }
          ]
        }
      ]
    }
    const message = await createThreadMainMessageSurface(inputs)

    expect(message).toEqual(intendedResult)
  })
})

describe('success case', () => {
  beforeAll(() => {
    // Mock getInput
    vi.spyOn(core, 'getInput').mockImplementation((name: string) => {
      return inputs[name]
    })

    // Mock setOutput. This is used to pass thread_ts to the next step
    vi.spyOn(core, 'setOutput').mockImplementation(
      (_: string, thread_ts: string) => {
        inputs.phase = 'finish'
        if (inputs.phase === 'finish') {
          inputs.thread_ts = thread_ts
        }
      }
    )
  })
  afterAll(() => {
    inputs.phase = 'start'
    delete inputs['thread_ts']
  })
  it('should send initial message', async () => {
    // Execute main function first time to send the message
    await main()
  })

  it('should update initial message with success message and reply to the thread', async () => {
    // execute second time to reply and update the message with the success message, now with inputs.thread_ts
    await sleep(1000)
    await main()
  })
})

describe('failure case', () => {
  beforeAll(() => {
    // Mock getInput
    vi.spyOn(core, 'getInput').mockImplementation((name: string) => {
      return inputs[name]
    })

    // Mock setOutput. This is used to pass thread_ts to the next step
    vi.spyOn(core, 'setOutput').mockImplementation(
      (_: string, thread_ts: string) => {
        inputs.phase = 'failure'
        if (inputs.phase === 'failure') {
          inputs.thread_ts = thread_ts
        }
      }
    )
  })
  afterAll(() => {
    inputs.phase = 'start'
    delete inputs['thread_ts']
  })
  it('should send initial message', async () => {
    // Execute main function first time to send the message
    await main()
  })

  it('should send initial message, update it with failure message and reply to the thread', async () => {
    // execute second time to reply and update the message with the failure message, now with inputs.thread_ts
    await sleep(1000)
    await main()
  })
})

describe('cancelled case', () => {
  beforeAll(() => {
    // Mock getInput
    vi.spyOn(core, 'getInput').mockImplementation((name: string) => {
      return inputs[name]
    })

    // Mock setOutput. This is used to pass thread_ts to the next step
    vi.spyOn(core, 'setOutput').mockImplementation(
      (_: string, thread_ts: string) => {
        inputs.phase = 'cancelled'
        if (inputs.phase === 'cancelled') {
          inputs.thread_ts = thread_ts
        }
      }
    )
  })
  afterAll(() => {
    inputs.phase = 'start'
    delete inputs['thread_ts']
  })
  it('should send initial message', async () => {
    // Execute main function first time to send the message
    await main()
  })

  it('should send initial message, update it with cancellation message and reply to the thread', async () => {
    // execute second time to reply and update the message with the failure message, now with inputs.thread_ts
    await sleep(1000)
    await main()
  })
})
