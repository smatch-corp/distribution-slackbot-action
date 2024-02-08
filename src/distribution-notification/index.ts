import * as core from '@actions/core'
import { WebClient } from '@slack/web-api'
import { match } from 'ts-pattern'
import { z } from 'zod'

const InputSchema = z.object({
  service_name: z.string(),
  channel_id: z.string(),
  member_id: z.string(),
  phase: z.enum(['start', 'finish']),
  environment: z.string()
})

export async function run(): Promise<void> {
  try {
    const { phase, channel_id, environment, member_id, service_name } =
      InputSchema.parse({
        service_name: core.getInput('service_name'),
        channel_id: core.getInput('channel_id'),
        member_id: core.getInput('member_id'),
        phase: core.getInput('phase'),
        environment: core.getInput('environment')
      })

    match(phase)
      .with('start', () => onDistributionStart({ channel_id }))
      .with('finish', () => {
        onDistributionFinish({ channel_id })
        core.info('Distribution finished!')
      })
      .otherwise(() => core.setFailed('Invalid action type'))
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

type DistributionStartOptions = {
  channel_id: string
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

    core.info('TESTING HUSKY!')
    core.info('START: Sending notification to Slack...')
    core.info(`Testing env: ${SLACKBOT_TOKEN}`)

    const result = await slack.chat.postMessage({
      channel: options.channel_id,
      text: 'Distribution started!'
    })
    core.info('Message sent!')
    core.info(JSON.stringify(result, null, 2))
  } catch (e) {
    if (e instanceof Error) core.setFailed(e.message)
  }
}

type DistributionFinishOptions = {
  channel_id: string
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
      channel: options.channel_id,
      text: 'Distribution finished!'
    })

    core.info('Message sent!')
    core.info(JSON.stringify(result, null, 2))
  } catch (e) {
    if (e instanceof Error) core.setFailed(e.message)
  }
}
