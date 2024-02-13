import * as core from '@actions/core'
import { z } from 'zod'

export const InputSchema = z.discriminatedUnion('phase', [
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

export function getEnvVariable(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Env variable ${name} is missing.`)
  }
  return value
}

export function parseInputs() {
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

  return { inputs, GITHUB_TOKEN, SLACKBOT_TOKEN }
}
