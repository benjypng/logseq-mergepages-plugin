import React, { useState } from 'react';
import './App.css';
import '@logseq/libs';
import Card from './Card';

const App = () => {
  const [pageToMergeTo, setPageToMergeTo] = useState('');
  const [pagesToMergeFrom, setPagesToMergeFrom] = useState([]);

  const hide = () => {
    logseq.hideMainUI();
  };

  const setMergeToPage = async () => {
    const page = await logseq.Editor.getCurrentPage();
    if (page === null) {
      logseq.App.showMsg('You can only set normal pages or journal pages.');
    } else if (
      pagesToMergeFrom.length !== 0 &&
      pagesToMergeFrom.some((p) => p.uuid === page.uuid)
    ) {
      logseq.App.showMsg('You are trying to merge a page into the same page.');
    } else {
      setPageToMergeTo(page);
    }
  };

  const clearMergeToPage = async () => {
    setPageToMergeTo('');
  };

  const setMergeFromPage = async () => {
    const page = await logseq.Editor.getCurrentPage();
    if (page === null) {
      logseq.App.showMsg('You can only set normal pages or journal pages.');
    } else if (
      pagesToMergeFrom.length !== 0 &&
      pagesToMergeFrom.some((p) => p.uuid === page.uuid)
    ) {
      logseq.App.showMsg('Page has already been added.');
    } else if (page.uuid === pageToMergeTo.uuid) {
      logseq.App.showMsg('You are trying to merge a page into the same page.');
    } else {
      let clone = [...pagesToMergeFrom, page];
      setPagesToMergeFrom(clone);
    }
  };

  const clearMergeFromPage = () => {
    setPagesToMergeFrom('');
  };

  const mergePages = async (option) => {
    if (!pageToMergeTo || pagesToMergeFrom.length === 0) {
      logseq.App.showMsg('You have not selected a page to merge from or to.');
      return;
    }

    let arrOfPageBlockTreesToMerge = [];
    let aliasArr = [];
    for (let p of pagesToMergeFrom) {
      // Add up all the page block trees to create a batch block
      const pbt = await logseq.Editor.getPageBlocksTree(p.name);
      arrOfPageBlockTreesToMerge = arrOfPageBlockTreesToMerge.concat(pbt);

      if (option === 'alias') {
        aliasArr = aliasArr.concat(p.name);

        // Delete page after completing the above actions
        await logseq.Editor.deletePage(p.name);
      } else if (option === 'delete') {
        // Delete page after completing the above actions
        await logseq.Editor.deletePage(p.name);
      }
    }

    const aliasArrString = aliasArr.join(', ');

    // Update block if not the alias won't register
    const pbtPageMergeTo = await logseq.Editor.getPageBlocksTree(
      pageToMergeTo.name
    );

    const propertyBlock = await logseq.Editor.insertBlock(
      pbtPageMergeTo[0].uuid,
      '',
      { before: true }
    );

    await logseq.Editor.updateBlock(
      propertyBlock.uuid,
      `alias:: ${aliasArrString}`
    );

    // Add in a block called Mergers in the page to merge to park the batch block under it
    const mergerBlock = await logseq.Editor.insertBlock(
      pageToMergeTo.name,
      `[[Mergers on ${new Date().toLocaleString().substring(0, 10)}]]`,
      {
        isPageBlock: true,
      }
    );

    await logseq.Editor.insertBatchBlock(
      mergerBlock.uuid,
      arrOfPageBlockTreesToMerge,
      { sibling: false }
    );

    logseq.App.pushState('page', { name: pageToMergeTo.name });
    setPageToMergeTo('');
    setPagesToMergeFrom([]);
    await logseq.App.showMsg('Merging completed.');
  };

  return (
    <div className="flex justify-center border border-black">
      <div className="absolute top-3 bg-white rounded-lg p-3 w-2/3 border">
        <div className="flex justify-between py-2">
          <h1 className="font-mono mt-2">Page to Merge To</h1>
          <div className="ml-2">
            <button
              onClick={setMergeToPage}
              className="font-mono text-black border border-black bg-purple-400 p-2 rounded-md text-sm"
            >
              Set page
            </button>
            <button
              onClick={clearMergeToPage}
              className="font-mono text-black border border-black bg-red-400 p-2 rounded-md text-sm ml-1"
            >
              Clear
            </button>
          </div>
        </div>
        {pageToMergeTo && (
          <Card name={pageToMergeTo.name} uuid={pageToMergeTo.uuid} />
        )}
        <hr className="mt-4 mb-2 stroke-purple-400" />
        <div className="flex justify-between py-2">
          <div>
            <h1 className="font-mono mt-2">Page(s) to Merge From</h1>
            <h1 className="font-mono text-red-700">
              (the pages below will be deleted after merging)
            </h1>
          </div>
          <div className="ml-2">
            <button
              onClick={setMergeFromPage}
              className="font-mono text-black border border-black bg-purple-400 p-2 rounded-md text-sm"
            >
              Add page
            </button>
            <button
              onClick={clearMergeFromPage}
              className="font-mono text-black border border-black bg-red-400 p-2 rounded-md text-sm ml-1"
            >
              Clear
            </button>
          </div>
        </div>
        {pagesToMergeFrom &&
          pagesToMergeFrom.map((p) => <Card name={p.name} uuid={p.uuid} />)}

        <div className="flex justify-between">
          <button
            onClick={hide}
            className="font-mono text-black border bg-white border-purple-400 p-2 rounded-md"
          >
            Close UI
          </button>
          {pageToMergeTo && pagesToMergeFrom.length > 0 && (
            <div>
              <button
                onClick={() => mergePages('alias')}
                className="font-mono text-black border border-black bg-pink-400 p-2 rounded-md mr-1"
              >
                Merge and create aliases
              </button>
              {/* <button
                onClick={() => mergePages('delete')}
                className="font-mono text-black border border-black bg-red-500 p-2 rounded-md mr-1"
              >
                Merge and do not create aliases
              </button> */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
