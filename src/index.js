import '@logseq/libs';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

const main = () => {
  console.log('logseq-mergepages-plugin loaded');
  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById('app')
  );

  logseq.provideModel({
    show() {
      logseq.showMainUI();
    },
  });

  logseq.App.registerUIItem('toolbar', {
    key: 'logseq-mergepages-plugin',
    template: `
      <a data-on-click="show"
      class="button">
      <i class="ti ti-fold"></i>
    </a>`,
  });
};

logseq.ready(main).catch(console.error);
