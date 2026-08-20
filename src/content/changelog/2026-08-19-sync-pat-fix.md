---
version: "1.8.0"
date: 2026-08-19
type: "fix"
description: "修复上游同步定时任务连续失败：GITHUB_TOKEN 无法 push 含 workflow 文件改动的提交，改用 fine-grained PAT（SYNC_PAT，含 Workflows 写权限）"
---
