import {
  createFormattedJiraIssueLinks,
  createThreadMainMessage,
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
// Inputs for mock @actions/core
let inputs = {} as any

// Shallow clone original @actions/github context
let originalContext = { ...github.context }

process.env.GITHUB_TOKEN = 'fake-token'

describe('distribution-notification', () => {
  beforeAll(() => {
    // Mock getInput
    vi.spyOn(core, 'getInput').mockImplementation((name: string) => {
      return inputs[name]
    })

    // Mock error/warning/info/debug
    vi.spyOn(core, 'error').mockImplementation(vi.fn())
    vi.spyOn(core, 'warning').mockImplementation(vi.fn())
    vi.spyOn(core, 'info').mockImplementation(vi.fn())
    vi.spyOn(core, 'debug').mockImplementation(vi.fn())

    // Mock github context
    vi.spyOn(github.context, 'repo', 'get').mockImplementation(() => {
      return {
        owner: 'some-owner',
        repo: 'some-repo'
      }
    })
    github.context.ref = 'refs/heads/some-ref'
    github.context.sha = '1234567890123456789012345678901234567890'
  })

  beforeEach(() => {
    // Reset inputs
    inputs = {}
  })

  afterAll(() => {
    // Restore GitHub workspace

    // Restore @actions/github context
    github.context.ref = originalContext.ref
    github.context.sha = originalContext.sha

    // Restore
    vi.restoreAllMocks()
  })
  const text = [
    ' [SMATCH01-1789] retool api#192 opened 3 hours ago by JYC11 updated 1 hour ago',
    '[SMATCH01-1850] auth 기능#193 opened 3 hours ago by JYC11',
    '[SMATCH01-1851] 신청하기#184 opened last week by JYC11 updated 3 hours ago',
    '[SMATCH01-1857] 제안 도메인 boilerplate code#181 op…ks ago by gwjang•  Approved updated 5 hours ago',
    '[SMATCH01-1866] 더 제안받기#190 opened 2 days ago by gwjang updated 5 hours ago 2',
    '[SMATCH01-1874] 제안시 PDF 생성#191 opened yesterday by gwjang updated 5 hours ago',
    '[SMATCH01-1901] 유저&신청 boilerplate code#174 open… ago by JYC11•  Approved updated yesterday 20',
    '[SMATCH01-1389] 맞춤 제안 매물 PDF 생성 - wip#22 opened on Jul 25'
  ]

  it('should extract jira issue key', () => {
    const formatted = text.map(extractJiraIssueKey)
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
    const formatted = await createFormattedJiraIssueLinks(text)
    const intendedResult =
      '<https://billynco.atlassian.net/browse/SMATCH01-1789| [SMATCH01-1789] retool api#192 opened 3 hours ago by JYC11 updated 1 hour ago>\n' +
      '<https://billynco.atlassian.net/browse/SMATCH01-1850|[SMATCH01-1850] auth 기능#193 opened 3 hours ago by JYC11>\n' +
      '<https://billynco.atlassian.net/browse/SMATCH01-1851|[SMATCH01-1851] 신청하기#184 opened last week by JYC11 updated 3 hours ago>\n' +
      '<https://billynco.atlassian.net/browse/SMATCH01-1857|[SMATCH01-1857] 제안 도메인 boilerplate code#181 op…ks ago by gwjang•  Approved updated 5 hours ago>\n' +
      '<https://billynco.atlassian.net/browse/SMATCH01-1866|[SMATCH01-1866] 더 제안받기#190 opened 2 days ago by gwjang updated 5 hours ago 2>\n' +
      '<https://billynco.atlassian.net/browse/SMATCH01-1874|[SMATCH01-1874] 제안시 PDF 생성#191 opened yesterday by gwjang updated 5 hours ago>\n' +
      '<https://billynco.atlassian.net/browse/SMATCH01-1901|[SMATCH01-1901] 유저&신청 boilerplate code#174 open… ago by JYC11•  Approved updated yesterday 20>\n' +
      '<https://billynco.atlassian.net/browse/SMATCH01-1389|[SMATCH01-1389] 맞춤 제안 매물 PDF 생성 - wip#22 opened on Jul 25>'

    expect(formatted).toEqual(intendedResult)
  })

  it('shoult print out slack message correctly', async () => {
    const message = await createThreadMainMessage({
      before_ref: 'refs/heads/feature/SMATCH01-1789-retool-api',
      channel_id: 'C02E2KZ6X',
      environment: 'staging',
      group_id: 'G02E2KZ6Y',
      phase: 'start',
      service_name: '스매치',
      team: 'Front-End'
    })
    console.log({ message: message.text })
  })
})

// [SMATCH01-1789] retool api
// #192 opened 3 hours ago by JYC11
//  updated 1 hour ago,

// [SMATCH01-1850] auth 기능
// #193 opened 3 hours ago by JYC11,

// [SMATCH01-1851] 신청하기
// #184 opened last week by JYC11
//  updated 3 hours ago,

// [SMATCH01-1857] 제안 도메인 boilerplate code
// #181 opened 2 weeks ago by gwjang
// •  Approved
//  updated 5 hours ago,

// [SMATCH01-1866] 더 제안받기
// #190 opened 2 days ago by gwjang
//  updated 5 hours ago
//  2,

// [SMATCH01-1874] 제안시 PDF 생성
// #191 opened yesterday by gwjang
//  updated 5 hours ago
// ,
// [SMATCH01-1901] 유저&신청 boilerplate code
// #174 opened 3 weeks ago by JYC11
// •  Approved
//  updated yesterday
//  20
// ,
// [SMATCH01-1389] 맞춤 제안 매물 PDF 생성 - wip
// #22 opened on Jul 25, 2023 by yoon-bomi
