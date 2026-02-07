import './pagepicker.css'

import { IBatchBlock, PageEntity } from '@logseq/libs/dist/LSPlugin.user'
import { KeyboardEvent, useEffect, useRef, useState } from 'react'

interface PagePickerProps {
  page: string
  allPages: PageEntity[]
}

export const PagePicker = ({ page, allPages }: PagePickerProps) => {
  const [searchString, setSearchString] = useState<string>('')
  const [results, setResults] = useState<PageEntity[]>([])
  const cardRef = useRef<HTMLDivElement>(null)

  const close = () => {
    setSearchString('')
    setResults([])
    logseq.hideMainUI()
  }

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleFilter = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (searchString.length < 3) return

    const filteredResults = allPages.filter((page) =>
      page.name.toLowerCase().includes(searchString.toLowerCase()),
    )
    setResults(filteredResults)
  }

  const mergePage = async (pageName: string) => {
    const pbtPageToMergeFrom = await logseq.Editor.getPageBlocksTree(page)
    if (!pbtPageToMergeFrom) return
    const pbtPageToMergeTo = await logseq.Editor.getPageBlocksTree(pageName)
    if (!pbtPageToMergeTo) return
    const lastBlockInPageToMergeTo =
      pbtPageToMergeTo[pbtPageToMergeTo.length - 1]
    if (!lastBlockInPageToMergeTo) return

    await logseq.Editor.insertBatchBlock(
      lastBlockInPageToMergeTo.uuid,
      pbtPageToMergeFrom as unknown as IBatchBlock,
    )
    logseq.App.pushState('page', {
      name: pageName,
    })
    setSearchString('')
    logseq.hideMainUI()
  }

  return (
    <div id="pagepicker-container" onClick={close}>
      <div id="pagepicker-card" ref={cardRef} onClick={(e) => e.stopPropagation()}>
        <div id="pagepicker-input-wrapper">
          <svg
            className="pagepicker-search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            id="pagepicker-input"
            type="text"
            placeholder="Search for a page to merge into..."
            onKeyDown={handleFilter}
            onChange={(e) => setSearchString(e.target.value)}
            value={searchString}
            autoFocus
          />
        </div>
        {results.length > 0 && (
          <div id="pagepicker-results">
            {results.map((result) => (
              <div
                key={result.uuid}
                className="pagepicker-result-item"
                onClick={() => mergePage(result.name)}
              >
                <svg
                  className="pagepicker-page-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span>{result.name.toUpperCase()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
