export const handleClosePopup = () => {
  //ESC
  document.addEventListener(
    'keydown',
    function (e) {
      if (e.keyCode === 27) {
        logseq.hideMainUI({ restoreEditingCursor: true });
      }
      e.stopPropagation();
    },
    false
  );

  // CLICK OUTSIDE
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.mergepages-settings')) {
      logseq.hideMainUI({ restoreEditingCursor: true });
    }
  });
};
