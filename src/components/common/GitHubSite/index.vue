<script setup lang="ts">
const gitCommitSha = (import.meta.env.VITE_GIT_COMMIT_HASH || '15655576321').slice(0, 7)
const releaseVersion = import.meta.env.VITE_RELEASE_VERSION || ''
</script>

<template>
  <div class="text-center text-xs">
    <span class="text-neutral-400">
      Powered by
    </span>
    <a>
      <a class="text-blue-500" />
    </a>
    <span v-text="`15655576321@163.com`" />
  </div>
</template>
