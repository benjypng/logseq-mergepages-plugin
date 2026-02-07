import '@logseq/libs'

import { createRoot, type Root } from 'react-dom/client'

import { PagePicker } from './PagePicker'

const main = () => {
  logseq.UI.showMsg('logseq-mergepages-plugin loaded')

  let root: Root | null = null

  const container = document.getElementById('app')
  if (!container) return

  if (!root) {
    root = createRoot(container)
  }

  logseq.App.registerPageMenuItem('Merge Page With', async ({ page }) => {
    const allPages = await logseq.Editor.getAllPages()
    if (!allPages) throw Error('mergepages: No pages found')

    root.render(<PagePicker page={page} allPages={allPages} />)
    logseq.showMainUI({ autoFocus: true })
    requestAnimationFrame(() => {
      document.getElementById('pagepicker-input')?.focus()
    })
  })
}

logseq.ready(main).catch(console.error)
