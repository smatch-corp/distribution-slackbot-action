import * as core from '@actions/core'
import { WebClient } from '@slack/web-api'
import { match, P } from 'ts-pattern'

type ACTION_TYPE = 'start' | 'finish' | '' | null | undefined

export async function run(): Promise<void> {
  const ACTION_TYPE = core.getInput('action_type') as ACTION_TYPE
  const channelId = core.getInput('channel_id')

  try {
    if (!channelId) {
      throw new Error('Channel is missing.')
    }
    match(ACTION_TYPE)
      .with('start', () => onDistributionStart({ channel: channelId }))
      .with('finish', () => {
        onDistributionFinish({ channel: channelId })
        core.info('Distribution finished!')
      })
      .otherwise(() => core.setFailed('Invalid action type'))
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

type DistributionStartOptions = {
  channel: string
}

async function onDistributionStart(
  options: DistributionStartOptions
): Promise<void> {
  core.info('Distribution started!')
  try {
    const SLACKBOT_TOKEN = process.env.SLACKBOT_TOKEN
    if (!SLACKBOT_TOKEN) {
      throw new Error('SLACKBOT_TOKEN is missing.')
    }
    const slack = new WebClient(SLACKBOT_TOKEN)

    core.info('START: Sending notification to Slack...')
    core.info(`Testing env: ${SLACKBOT_TOKEN}`)

    const result = await slack.chat.postMessage({
      channel: options.channel,
      text: 'Distribution started!'
    })
    core.info('Message sent!')
    core.info(JSON.stringify(result, null, 2))
  } catch (e) {
    if (e instanceof Error) core.setFailed(e.message)
  }
}

type DistributionFinishOptions = {
  channel: string
}

async function onDistributionFinish(
  options: DistributionFinishOptions
): Promise<void> {
  core.info('Distribution finished!')
  try {
    const SLACKBOT_TOKEN = process.env.SLACKBOT_TOKEN
    if (!SLACKBOT_TOKEN) {
      throw new Error('SLACKBOT_TOKEN is missing.')
    }
    const slack = new WebClient(SLACKBOT_TOKEN)

    core.info('FINISH: Sending notification to Slack...')
    core.info(`Testing env: ${SLACKBOT_TOKEN}`)

    const result = await slack.chat.postMessage({
      channel: options.channel,
      text: 'Distribution finished!'
    })

    core.info('Message sent!')
    core.info(JSON.stringify(result, null, 2))
  } catch (e) {
    if (e instanceof Error) core.setFailed(e.message)
  }
}
