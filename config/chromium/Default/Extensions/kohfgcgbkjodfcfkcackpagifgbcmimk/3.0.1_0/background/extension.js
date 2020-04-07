function Extension() {
  let self = this;
  self.activeTabId = -1;
  self.relocate = relocate;
  self.setIcon = setIcon;
  self.editHotkeys = editHotkeys;
  self.showUploadPage = showUploadPage;
  self.showPlusVoiceDemoPage = showPlusVoiceDemoPage;
  self.isAsyncFunction = isAsyncFunction;
  self.asyncFunctions = [];
  self.loadingIconInterval = null;
  self.loadingIcon = new Image();
  self.loadingIcon.src = "../assets/img/natreader.png";
  self.presetIndex = 1;
  function init() {
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason == "install") {
        chrome.storage.sync.get(['isInstalled'], (result) => {
          if (result.isInstalled) {
          } else {
            chrome.tabs.create({
              url: "https://www.naturalreaders.com/chrome_ext.html"
            });
            storage.set({ 'isInstalled': true });
          }
        });
      } else if (details.reason == "update") {
        let thisVersion = chrome.runtime.getManifest().version;
      }
    });
    chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
      if (reader && tabId === reader.beingReadTabId) {
        reader.stop();
      }
    });
    chrome.tabs.onCreated.addListener(function (tab) {
    });
    chrome.tabs.onActivated.addListener(async function (activeInfo) {
      if (activeInfo.tabId !== auth.tabId && activeInfo.tabId !== alertHandler.tabId) {
        let prevActiveTabId = self.activeTabId;
        self.activeTabId = activeInfo.tabId;
        let docType = await utils.getDocType();
        chrome.tabs.sendMessage(prevActiveTabId, { message: 'tabOnActivated', tabId: prevActiveTabId, beingReadTabId: reader.beingReadTabId, activeTabId: self.activeTabId });
        chrome.tabs.sendMessage(self.activeTabId, { message: 'tabOnActivated', tabId: self.activeTabId, beingReadTabId: reader.beingReadTabId, activeTabId: self.activeTabId });
        widget.injectSD(self.activeTabId, docType);
      }
    });
    chrome.windows.onFocusChanged.addListener(function (windowId) {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
        let tabId = tabs.length > 0 ? tabs[0].id : self.activeTabId;
        if (tabId !== auth.tabId && tabId !== alertHandler.tabId) {
          let prevActiveTabId = self.activeTabId;
          self.activeTabId = tabId;
          chrome.tabs.sendMessage(prevActiveTabId, { message: 'tabOnActivated', tabId: prevActiveTabId, beingReadTabId: reader.beingReadTabId, activeTabId: self.activeTabId });
          chrome.tabs.sendMessage(self.activeTabId, { message: 'tabOnActivated', tabId: self.activeTabId, beingReadTabId: reader.beingReadTabId, activeTabId: self.activeTabId });
        }
      });
    });
    browser.webNavigation.onCommitted.addListener(async function (details) {
      if (details.transitionType !== 'auto_subframe' && details.transitionType !== 'manual_subframe') {
        let docType = await utils.getDocType();
        widget.injectSD(details.tabId, docType);
      }
    });
    chrome.browserAction.onClicked.addListener(function () {
      setIcon();
      utils.getActiveTab()
        .then(async (tab) => {
          let docType = await utils.getDocType();
          widget.injectWidget(tab.id, docType, null, true);
        })
        .catch(err => {
        })
    });
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
      if (request.fn in extension) {
        extension[request.fn](request, sender, sendResponse);
        if (extension.isAsyncFunction(request.fn)) {
          return true;
        }
      }
    });
    chrome.commands.onCommand.addListener(function (command) {
      if (command == "play") {
        if (reader.readerState === 'reading') {
          reader.pause();
        } else {
          chrome.tabs.sendMessage(self.activeTabId, { message: 'hasSelectionOnPage' }, (hasSelectionOnPage) => {
            if (hasSelectionOnPage) {
              reader.readSelection(null, { tab: { id: self.activeTabId } });
            } else {
              reader.play(null, { tab: { id: self.activeTabId } });
            }
          })
        }
      } else if (command == "stop") {
        reader.stop();
      } else if (command == "forward") {
        reader.forward({number: widget.settings.forwardSkipNumber[widget.settings.forwardStep]});
      } else if (command == "rewind") {
        reader.backward({number: widget.settings.backwardSkipNumber[widget.settings.backwardStep]});
      } else if (command == 'toggleShowReadIcon') {
        let value = !widget.settings.readIcon;
        widget.setWidgetSetting({ key: 'readIcon', value: value });
        chrome.tabs.sendMessage(self.activeTabId, { message: 'toggleShowReadIcon', value: value });
      } else if (command == 'speaker') {
        chrome.tabs.sendMessage(self.activeTabId, { fn: 'setPresetAsSelectedVoice', index: self.presetIndex });
        if (self.presetIndex == 1) {
          self.presetIndex = 2;
        } else {
          self.presetIndex = 1;
        }
      }
    });
    utils.getActiveTab()
      .then((tab) => {
        self.activeTabId = tab.id;
      })
      .catch((err) => {
      });
  }
  function relocate() {
    return new Promise((resolve) => {
      chrome.tabs.update(reader.beingReadTabId, { "active": true });
      resolve();
    })
      .catch(err => {
      });
  }
  function reload() {
    chrome.storage.sync.clear(function () {
      if (chrome.runtime.lastError) {
      }
    });
    chrome.runtime.reload();
  }
  function isAsyncFunction(fnName) {
    return self.asyncFunctions.includes(fnName);
  }
  function setIcon(request, sender, sendResponse) {
    let state = request ? request.state : null;
    let path = null;
    if (state !== 'loading') {
      clearInterval(self.loadingIconInterval);
    }
    if (state === 'reading') {
      path = {
        "19": "assets/img/contact.png",
        "38": "assets/img/contact.png"
      }
    } else if (state === 'error') {
      path = {
        "19": "Icons/iconfavorite19x.png",
        "38": "Icons/iconfavorite38x.png"
      }
    } else if (state === 'loading') {
      drawLoadingIcon();
    } else {
      chrome.browserAction.setIcon({
        path: {
          "32": "assets/img/natreader.png"
        }
      });
    }
  }
  function drawLoadingIcon() {
    let context = document.createElement('canvas').getContext('2d');
    let start = new Date();
    let lines = 16,
      cW = 40,
      cH = 40;
    self.loadingIconInterval = setInterval(function () {
      let rotation = parseInt(((new Date() - start) / 1000) * lines) / lines;
      context.save();
      context.clearRect(0, 0, cW, cH);
      context.translate(cW / 2, cH / 2);
      context.rotate(Math.PI * 2 * rotation);
      for (let i = 0; i < lines; i++) {
        context.beginPath();
        context.rotate(Math.PI * 2 / lines);
        context.moveTo(cW / 10, 0);
        context.lineTo(cW / 4, 0);
        context.lineWidth = cW / 30;
        context.strokeStyle = 'rgba(27, 125, 249,' + i / lines + ')';
        context.stroke();
      }
      let imageData = context.getImageData(10, 10, 19, 19);
      chrome.browserAction.setIcon({
        imageData: imageData
      });
      context.restore();
    }, 1000 / 30);
  }
  function editHotkeys(request, sender, sendResponse) {
    chrome.tabs.create({ url: 'chrome://extensions/configureCommands' });
  }
  function showUploadPage(request, sender, sendResponse) {
    chrome.tabs.create({ url: 'https://www.naturalreaders.com/online/?action=upload' });
  }
  function showPlusVoiceDemoPage(request, sender, sendResponse) {
    chrome.tabs.create({ url: 'https://www.naturalreaders.com/plusvoicedemo.html' });
  }
  init();
}
const extension = new Extension();