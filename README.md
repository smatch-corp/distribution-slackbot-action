# 배포 알리미 액션

이 액션은 배포 관련 알림을 슬랙으로 보내는 액션입니다.

## 사용 방법

아래 예시에서 `channel_id`, `group_id`, `phase`, `team`, `service_name`을 바꿔서
사용해주시면 됩니다.

배포 종료 알림은 배포 시작 알림의 `thread_ts`를 받아서 사용합니다. 꼭 순서대로
실행해 주세요.

### 배포 시작 알림

```yaml
distribution-start-notification:
  name: 배포 알림 (시작)
  runs-on: ubuntu-latest
  needs: [setup-infra-variables]
  steps:
    - name: Checkout
      id: checkout
      uses: actions/checkout@v4

    - name: 배포 알림 (시작)
      id: distribution-start-notification
      uses: smatch-corp/distribution-slackbot-action@main
      with:
        channel_id: C06H62PLQNN
        group_id: S03V01C0H61
        phase: start
        team: Front-End
        service_name: '빌디 웹'
        environment: ${{ needs.setup-infra-variables.outputs.environment }}
        before_ref: ${{ github.event.before }}
      env:
        SLACKBOT_TOKEN: ${{ secrets.DISTRIBUTION_SLACKBOT_TOKEN }}
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  outputs:
    thread_ts: ${{ steps.distribution-start-notification.outputs.thread_ts }}
```

### 배포 종료 알림

```yaml
distribution-finish-notification:
  name: 배포 알림 (종료)
  runs-on: ubuntu-latest
  needs: [setup-infra-variables, distribution-start-notification, cdk-deploy]
  steps:
    - name: Checkout
      id: checkout
      uses: actions/checkout@v4

    - name: 배포 알림 (종료)
      id: distribution-finish-notification
      uses: smatch-corp/distribution-slackbot-action@main
      with:
        channel_id: C06H62PLQNN
        group_id: S03V01C0H61
        phase: finish
        team: Front-End
        service_name: '빌디 웹'
        environment: ${{ needs.setup-infra-variables.outputs.environment }}
        before_ref: ${{ github.event.before }}
        thread_ts:
          ${{ needs.distribution-start-notification.outputs.thread_ts }}
      env:
        SLACKBOT_TOKEN: ${{ secrets.DISTRIBUTION_SLACKBOT_TOKEN }}
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 배포 오류 알림

```yaml
distribution-failure-action:
  name: 배포 알림 (오류)
  runs-on: ubuntu-latest
  needs:
    [
      setup-infra-variables,
      distribution-start-notification,
      setup-variables,
      build-and-push,
      cdk-deploy
    ]
  if: failure()
  steps:
    - name: Checkout
      id: checkout
      uses: actions/checkout@v4

    - name: 배포 알림 (오류)
      id: distribution-failure-notification
      uses: smatch-corp/distribution-slackbot-action@main
      with:
        channel_id: C06H62PLQNN
        group_id: S03V01C0H61
        phase: failure
        team: Front-End
        service_name: '빌디 웹'
        environment: ${{ needs.setup-infra-variables.outputs.environment }}
        before_ref: ${{ github.event.before }}
        thread_ts:
          ${{ needs.distribution-start-notification.outputs.thread_ts }}
      env:
        SLACKBOT_TOKEN: ${{ secrets.DISTRIBUTION_SLACKBOT_TOKEN }}
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 배포 취소 알림

```yaml
distribution-cancelled-action:
  name: 배포 알림 (취소)
  runs-on: ubuntu-latest
  needs:
    [
      setup-infra-variables,
      distribution-start-notification,
      setup-variables,
      build-and-push,
      cdk-deploy
    ]
  if: cancelled()
  steps:
    - name: Checkout
      id: checkout
      uses: actions/checkout@v4

    - name: 배포 알림 (오류)
      id: distribution-cancelled-notification
      uses: smatch-corp/distribution-slackbot-action@main
      with:
        channel_id: C06H62PLQNN
        group_id: S03V01C0H61
        phase: cancelled
        team: Front-End
        service_name: '빌디 웹'
        environment: ${{ needs.setup-infra-variables.outputs.environment }}
        before_ref: ${{ github.event.before }}
        thread_ts:
          ${{ needs.distribution-start-notification.outputs.thread_ts }}
      env:
        SLACKBOT_TOKEN: ${{ secrets.DISTRIBUTION_SLACKBOT_TOKEN }}
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## 예시 화면

<img width="876" alt="Screenshot 2024-05-10 at 12 58 28" src="https://github.com/smatch-corp/distribution-slackbot-action/assets/29723695/83378c9c-902d-4a8d-872e-bf89efa48bd4">
