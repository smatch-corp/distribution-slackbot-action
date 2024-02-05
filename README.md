# 배포 알리미 액션

이 액션은 배포가 완료되었을 때, 배포가 완료되었다는 알림을 Slack으로 보내는
액션입니다.

## Inputs

### `slack-webhook-url`

- **필수 입력**
- Slack Incoming Webhook URL

## Example usage

```yaml
uses: ./.github/actions/distribution-notification
with:
  slack-webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
```
