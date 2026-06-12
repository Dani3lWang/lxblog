#!/usr/bin/env bash
# 把本地 master 同步到 upstream/master（fast-forward only）
# 用法：pnpm sync        -- 同步并自动 push
#       pnpm sync:local  -- 只本地合并，不 push

set -euo pipefail

MODE="${1:-push}"
BRANCH="master"
UPSTREAM_REMOTE="upstream"

if [[ "$MODE" != "push" && "$MODE" != "local" ]]; then
  echo "用法：$0 [push|local]" >&2
  exit 2
fi

# 安全闸：要求工作区干净
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "错误：工作区有未提交修改，先 stash 或 commit" >&2
  exit 1
fi

CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "$BRANCH" ]]; then
  echo "错误：请先切到 $BRANCH（当前在 $CURRENT_BRANCH）" >&2
  exit 1
fi

git fetch "$UPSTREAM_REMOTE" master

if git merge-base --is-ancestor HEAD "$UPSTREAM_REMOTE"/master; then
  echo "当前 $BRANCH 已是上游的超集，无需同步"
  exit 0
fi

if ! git merge-base --is-ancestor "$BRANCH" "$UPSTREAM_REMOTE"/master; then
  echo "错误：$BRANCH 与 upstream 已分叉，请人工处理（不要在 $BRANCH 上提交自定义内容）" >&2
  exit 1
fi

git merge --ff-only "$UPSTREAM_REMOTE"/master

if [[ "$MODE" == "push" ]]; then
  git push origin "$BRANCH"
  echo "已同步并推送到 origin/$BRANCH"
else
  echo "已本地合并到 $BRANCH，未推送（运行 'git push origin $BRANCH' 推送）"
fi
