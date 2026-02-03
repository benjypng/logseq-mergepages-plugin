import '@logseq/libs'

const main = () => {
  logseq.UI.showMsg('logseq-mergepages-plugin loaded')
}

logseq.ready(main).catch(console.error)
