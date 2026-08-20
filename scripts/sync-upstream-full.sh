#!/usr/bin/env bash
# =============================================================================
# 完整上游同步脚本：upstream/master → 本地 master → kelly（主分支）
#
# 流程：
#   1. fetch upstream/master
#   2. 将本地 master 快进到 upstream/master（ff-only，保证 master 是上游的纯净镜像）
#   3. 将 kelly rebase 到 master 之上（保持线性历史，自定义提交始终在最顶端）
#   4. （可选）推送 master 和 kelly 到 origin
#
# 用法：
#   pnpm sync:full          -- 同步并推送
#   pnpm sync:full:local    -- 只本地 rebase，不推送
#   bash scripts/sync-upstream-full.sh push
#   bash scripts/sync-upstream-full.sh local
# =============================================================================

set -euo pipefail

# ---- 配置 ----
MODE="${1:-push}"
TRACKING_BRANCH="master"        # 跟踪上游的纯净分支
MAIN_BRANCH="kelly"             # 实际工作主分支
UPSTREAM_REMOTE="upstream"

# ---- 参数校验 ----
if [[ "$MODE" != "push" && "$MODE" != "local" ]]; then
  echo "用法：$0 [push|local]" >&2
  exit 2
fi

# ---- 安全闸：工作区必须干净 ----
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "❌ 错误：工作区有未提交的修改，请先 stash 或 commit" >&2
  exit 1
fi

ORIGINAL_BRANCH=$(git branch --show-current)

# ---- 清理钩子：无论如何切回原始分支 ----
cleanup() {
  local exit_code=$?
  if [[ "$(git branch --show-current)" != "$ORIGINAL_BRANCH" ]]; then
    echo "↩  切回原始分支：$ORIGINAL_BRANCH"
    git checkout "$ORIGINAL_BRANCH" 2>/dev/null || true
  fi
  exit $exit_code
}
trap cleanup EXIT

echo "============================================"
echo "  上游同步：$UPSTREAM_REMOTE/master → $TRACKING_BRANCH → $MAIN_BRANCH"
echo "  模式：${MODE}"
echo "============================================"
echo ""

# ==========================================
# 第 1 步：fetch upstream
# ==========================================
echo "📡 Step 1/4: 拉取上游 remote..."
git fetch "$UPSTREAM_REMOTE" master
echo ""

# ==========================================
# 第 2 步：将 master 快进到 upstream/master
# ==========================================
echo "📦 Step 2/4: 更新 $TRACKING_BRANCH → upstream/master"

git checkout "$TRACKING_BRANCH"

if git merge-base --is-ancestor "$UPSTREAM_REMOTE"/master HEAD; then
  echo "   ✅ $TRACKING_BRANCH 已包含上游全部内容，无需同步"
else
  if ! git merge-base --is-ancestor "$TRACKING_BRANCH" "$UPSTREAM_REMOTE"/master; then
    echo "   ❌ 错误：$TRACKING_BRANCH 与 upstream/master 已分叉！"
    echo "      请人工处理（不要在 $TRACKING_BRANCH 上提交自定义内容）" >&2
    exit 1
  fi

  git merge --ff-only "$UPSTREAM_REMOTE"/master
  echo "   ✅ $TRACKING_BRANCH 已快进到 upstream/master"

  if [[ "$MODE" == "push" ]]; then
    git push origin "$TRACKING_BRANCH"
    echo "   🚀 已推送 origin/$TRACKING_BRANCH"
  fi
fi
echo ""

# ==========================================
# 第 3 步：将 kelly rebase 到 master 之上
# ==========================================
echo "🔀 Step 3/4: rebase $MAIN_BRANCH → $TRACKING_BRANCH"

git checkout "$MAIN_BRANCH"

if git merge-base --is-ancestor "$TRACKING_BRANCH" "$MAIN_BRANCH"; then
  echo "   ✅ $MAIN_BRANCH 已包含 $TRACKING_BRANCH 的所有内容，无需 rebase"
else
  echo "   正在将 $MAIN_BRANCH rebase 到 $TRACKING_BRANCH 之上..."

  # 尝试自动 rebase
  if git rebase "$TRACKING_BRANCH" "$MAIN_BRANCH"; then
    echo "   ✅ rebase 成功（无冲突）"
  else
    echo "   ⚠️  rebase 出现冲突！"
    echo ""
    echo "   当前状态：你仍在 $MAIN_BRANCH 上，rebase 已暂停。"
    echo "   冲突文件："
    git diff --name-only --diff-filter=U
    echo ""
    echo "   请人工解决冲突后："
    echo "      1. git add <冲突文件>"
    echo "      2. git rebase --continue"
    echo "      3. （如果 push 模式）git push --force-with-lease origin $MAIN_BRANCH"
    echo ""
    echo "   或者放弃本次 rebase："
    echo "      git rebase --abort"
    # 退出前不切回原始分支（让用户留在 kelly 处理冲突）
    trap - EXIT
    exit 1
  fi

  if [[ "$MODE" == "push" ]]; then
    # rebase 重写了历史，需要 force push
    git push --force-with-lease origin "$MAIN_BRANCH"
    echo "   🚀 已 force-push 到 origin/$MAIN_BRANCH"
  fi
fi
echo ""

# ==========================================
# 第 4 步：收尾
# ==========================================
echo "🎉 Step 4/4: 同步完成！"
echo "   $TRACKING_BRANCH @ $(git -C . log -1 --format='%h %s' "origin/$TRACKING_BRANCH" 2>/dev/null || echo '?')"
echo "   $MAIN_BRANCH      @ $(git log -1 --format='%h %s')"