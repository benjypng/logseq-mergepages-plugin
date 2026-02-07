import './pagepicker.css'

import { PageEntity } from '@logseq/libs/dist/LSPlugin.user'
import { KeyboardEvent, useState } from 'react'

interface PagePickerProps {
  page: string
  allPages: PageEntity[]
}

export const PagePicker = ({ page, allPages }: PagePickerProps) => {
  const [_targetPage, _setTargetPage] = useState<string>('')

  const handleSubmit = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
  }

  return (
    <div id="pagepicker-container">
      <input
        id="pagepicker-input"
        type="text"
        placeholder="Enter page to merge with"
        onKeyDown={handleSubmit}
      />
    </div>
  )
}
