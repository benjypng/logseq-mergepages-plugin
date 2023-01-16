import React, { useState } from "react";
import "./App.css";
import "@logseq/libs";
import Card from "./Card";

const App = () => {
  const [pageToMergeTo, setPageToMergeTo] = useState("");
  const [pagesToMergeFrom, setPagesToMergeFrom] = useState([]);

  const hide = () => {
    logseq.hideMainUI();
  };

  const setMergeToPage = async () => {
    const page = await logseq.Editor.getCurrentPage();
    if (page === null) {
      logseq.UI.showMsg("You can only set normal pages or journal pages.");
    } else if (
      pagesToMergeFrom.length !== 0 &&
      pagesToMergeFrom.some((p) => p.uuid === page.uuid)
    ) {
      logseq.UI.showMsg("You are trying to merge a page into the same page.");
    } else {
      setPageToMergeTo(page);
    }
  };

  const mergeLinkedBlocks = async () => {
    const currPage = await logseq.Editor.getCurrentPage();

    if (!currPage) {
      logseq.UI.showMsg(
        "This can only work on a journal page or regular page."
      );
    }

    const getLinkedBlocks = (
      await logseq.DB.datascriptQuery(
        `[
      :find (pull ?b [*])
      :where
          [?b :block/parent ?p]
          [?b :block/refs [:block/name "${currPage.name}"]]]`
      )
    )
      .map((b) => b[0])
      .filter((block) => block["path-refs"].length !== 1);

    let batchBlk = [];
    for (const block of getLinkedBlocks) {
      const blkObj = await logseq.Editor.getBlock(block.uuid, {
        includeChildren: true,
      });
      batchBlk.push(blkObj);
    }

    const headerBlk = await logseq.Editor.insertBlock(
      currPage.uuid,
      "is this after the page?"
    );

    await logseq.Editor.insertBatchBlock(headerBlk.uuid, batchBlk, {
      before: false,
      sibling: true,
    });

    await logseq.Editor.removeBlock(headerBlk.uuid);

    await logseq.Editor.exitEditingMode();

    logseq.hideMainUI();
  };

  const clearMergeToPage = () => {
    setPageToMergeTo("");
  };

  const setMergeFromPage = async () => {
    const page = await logseq.Editor.getCurrentPage();
    if (page === null) {
      logseq.UI.showMsg("You can only set normal pages or journal pages.");
    } else if (
      pagesToMergeFrom.length !== 0 &&
      pagesToMergeFrom.some((p) => p.uuid === page.uuid)
    ) {
      logseq.UI.showMsg("Page has already been added.");
    } else if (page.uuid === pageToMergeTo.uuid) {
      logseq.UI.showMsg("You are trying to merge a page into the same page.");
    } else {
      let clone = [...pagesToMergeFrom, page];
      setPagesToMergeFrom(clone);
    }
  };

  const clearMergeFromPage = () => {
    setPagesToMergeFrom("");
  };

  const getOrdinalNum = (n) => {
    return (
      n +
      (n > 0
        ? ["th", "st", "nd", "rd"][(n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10]
        : "")
    );
  };

  const getDateForPage = (d, preferredDateFormat) => {
    const getYear = d.getFullYear();
    const getMonth = d.toString().substring(4, 7);
    const getMonthNumber = d.getMonth() + 1;
    const getDate = d.getDate();

    if (preferredDateFormat === "MMM do yyyy") {
      return `${getMonth} ${getOrdinalNum(getDate)}, ${getYear}`;
    } else if (
      preferredDateFormat.includes("yyyy") &&
      preferredDateFormat.includes("MM") &&
      preferredDateFormat.includes("dd") &&
      ("-" || "_" || "/")
    ) {
      var mapObj = {
        yyyy: getYear,
        dd: ("0" + getDate).slice(-2),
        MM: ("0" + getMonthNumber).slice(-2),
      };
      let dateStr = preferredDateFormat;
      dateStr = dateStr.replace(/yyyy|dd|MM/gi, function (matched) {
        return mapObj[matched];
      });
      return dateStr;
    } else {
      return `${getMonth} ${getOrdinalNum(getDate)}, ${getYear}`;
    }
  };

  const mergePages = async (option) => {
    if (!pageToMergeTo || pagesToMergeFrom.length === 0) {
      logseq.App.showMsg("You have not selected a page to merge from or to.");
      return;
    }

    const userConfigs = await logseq.App.getUserConfigs();
    const preferredDateFormat = userConfigs.preferredDateFormat;

    let arrOfPageBlockTreesToMerge = [];
    let aliasArr = [];
    for (let p of pagesToMergeFrom) {
      // Add up all the page block trees to create a batch block
      const pbt = await logseq.Editor.getPageBlocksTree(p.name);
      arrOfPageBlockTreesToMerge = arrOfPageBlockTreesToMerge.concat(pbt);

      if (option === "alias") {
        aliasArr = aliasArr.concat(p.name);

        // Delete page after completing the above actions
        await logseq.Editor.deletePage(p.name);
      } else if (option === "delete") {
        // Delete page after completing the above actions
        await logseq.Editor.deletePage(p.name);
      }
    }

    // Join all aliases in a string with square brackets
    let aliasArrWithBrackets = aliasArr.map((a) => `[[${a}]]`);
    let aliasArrString = aliasArrWithBrackets.join(", ");

    // Get page blocks tree for the page to merge to
    const pbtPageMergeTo = await logseq.Editor.getPageBlocksTree(
      pageToMergeTo.name
    );

    // Scenario: Alias is already existing
    if (pbtPageMergeTo[0].content.startsWith("alias:: ")) {
      // Get the current alias as a string
      let currAliasString = pbtPageMergeTo[0].content.substring(8);

      // Concatenate with the alias string that is gotten from runnig the current merge
      currAliasString = currAliasString.concat(", ", aliasArrString);

      // Update block if not the alias won't register
      await logseq.Editor.updateBlock(
        pbtPageMergeTo[0].uuid,
        `alias:: ${currAliasString}`
      );

      // Scenario: Alias is not present
    } else {
      const propertyBlock = await logseq.Editor.insertBlock(
        pbtPageMergeTo[0].uuid,
        "",
        { before: true }
      );

      // Update block if not the alias won't register
      await logseq.Editor.updateBlock(
        propertyBlock.uuid,
        `alias:: ${aliasArrString}`
      );
    }

    // Add in a block called Mergers in the page to merge to park the batch block under it
    const mergerBlock = await logseq.Editor.insertBlock(
      pageToMergeTo.name,
      `[[Mergers on ${getDateForPage(new Date(), preferredDateFormat)}]]`,
      {
        isPageBlock: true,
      }
    );

    await logseq.Editor.insertBatchBlock(
      mergerBlock.uuid,
      arrOfPageBlockTreesToMerge,
      { sibling: false }
    );

    logseq.App.pushState("page", { name: pageToMergeTo.name });
    setPageToMergeTo("");
    setPagesToMergeFrom([]);
    logseq.App.showMsg("Merging completed.");
  };

  return (
    <div className="flex justify-center border border-black mergepages-settings">
      <div className="absolute top-3 bg-white rounded-lg p-3 w-2/3 border">
        <div className="flex justify-between py-2">
          <div>
            <h1 className="font-mono mt-2">Merge all linked blocks</h1>
            <h1 className="font-mono text-blue-700">
              (Use this if you want to merge this page's linked blocks to this
              page.)
            </h1>
          </div>
          <div className="ml-2">
            <button
              onClick={mergeLinkedBlocks}
              className="font-mono text-black border border-black bg-purple-400 p-2 rounded-md text-sm"
            >
              Merged linked blocks
            </button>
          </div>
        </div>

        <hr className="mt-4 mb-2 stroke-purple-400" />

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
            className="font-mono text-black border bg-white border-purple-400 p-2 rounded-md mt-3"
          >
            Close UI
          </button>
          {pageToMergeTo && pagesToMergeFrom.length > 0 && (
            <div>
              <button
                onClick={() => mergePages("alias")}
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
