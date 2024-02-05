import * as core from '@actions/core'
import { WebClient } from '@slack/web-api'

export async function run(): Promise<void> {
  try {
    onDistributionStart()
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

async function wait(milliseconds: number): Promise<string> {
  return new Promise(resolve => {
    if (isNaN(milliseconds)) {
      throw new Error('milliseconds not a number')
    }

    setTimeout(() => resolve('done!'), milliseconds)
  })
}

async function onDistributionStart(): Promise<void> {
  core.info('Distribution started!')
  try {
    const SLACKBOT_TOKEN = process.env.SLACKBOT_TOKEN
    if (!SLACKBOT_TOKEN) {
      throw new Error('SLACKBOT_TOKEN is missing.')
    }
    const slackWebClient = new WebClient(SLACKBOT_TOKEN)
    core.info('Sending notification to Slack...')
    core.info(`Testing env: ${SLACKBOT_TOKEN}`)
  } catch (e) {
    if (e instanceof Error) core.setFailed(e.message)
  }
}
