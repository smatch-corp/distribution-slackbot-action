import * as core from '@actions/core'
import { dedent } from 'ts-dedent'
import { getSlackClient } from './clients'
import { parseInputs } from './inputs'
import {
  createDirectMessageToActor,
  createThreadMainMessageSurface
} from './messages'

export async function main(): Promise<void> {
  try {
    const inputs = parseInputs()
    const slackClient = getSlackClient()

    if (inputs.phase === 'start') {
      const messageResponse = await slackClient.chat.postMessage(
        await createThreadMainMessageSurface(inputs)
      )
      core.setOutput('thread_ts', messageResponse.ts)
      core.info(
        dedent`Start message sent Successfully: ${JSON.stringify(messageResponse, null, 2)}`
      )

      if (messageResponse.ts) {
        const permaLink = await slackClient.chat.getPermalink({
          channel: inputs.channel_id,
          message_ts: messageResponse.ts
        })

        const directMessageResponse = await slackClient.chat.postMessage(
          createDirectMessageToActor(permaLink.permalink)
        )

        core.info(
          dedent`Direct message sent Successfully: ${JSON.stringify(directMessageResponse, null, 2)}`
        )
      }
    } else if (inputs.phase === 'finish') {
      const updatedMessageResponse = await slackClient.chat.update(
        await createThreadMainMessageSurface(inputs)
      )

      const replyMessageResponse = await slackClient.chat.postMessage({
        channel: inputs.channel_id,
        thread_ts: inputs.thread_ts,
        text: dedent`배포 완료되었습니다.`
      })

      core.info(
        dedent`
          Finish message sent Successfully: ${JSON.stringify(replyMessageResponse, null, 2)}
          Message updated Successfully: ${JSON.stringify(updatedMessageResponse, null, 2)}
          `
      )
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    console.log(error)
    if (error instanceof Error) core.setFailed(error.message)
  }
}

main()
