import * as github from '@actions/github'
import { WebClient } from '@slack/web-api'
import { parseInputs } from './inputs'

export function initialize() {
  const { inputs, GITHUB_TOKEN, SLACKBOT_TOKEN } = parseInputs()

  const octoClient = github.getOctokit(GITHUB_TOKEN)
  const slackClient = new WebClient(SLACKBOT_TOKEN)

  return { inputs, octoClient, slackClient }
}
