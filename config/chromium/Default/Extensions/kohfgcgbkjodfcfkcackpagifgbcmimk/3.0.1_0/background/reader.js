function Reader() {
  let self = this;
  self.setDocType = setDocType;
  self.tts = null;
  self.setTts = setTts;
  self.readerState = 'pause';
  self.currReadIndex = 0;
  self.readProgress = 0;
  self.isFirstRead = true;
  self.playId = undefined;
  self.shouldCheckForPreviewMode = true;
  self.readOption = 'all';
  self.play = play;
  self.replay = replay;
  self.stop = stop;
  self.pause = pause;
  self.playNext = playNext;
  self.forward = forward;
  self.backward = backward;
  self.readIndex = readIndex;
  self.readSelection = readSelection;
  self.readSelectionWithContextMenu = readSelectionWithContextMenu;
  self.setPlayId = setPlayId;
  self.beingReadTabId = -1;
  self.getReaderInfo = getReaderInfo;
  self.setShouldCheckForPreviewMode = setShouldCheckForPreviewMode;
  self.setReadOption = setReadOption;
  self.preview = preview;
  self.getReadOption = getReadOption;
  self.asyncFunctions = ['getReaderInfo', 'getReadOption'];
  self.tabIdToReadAfterSelectionToPageEnd = -1;
  function init() {
    browser.webNavigation.onCommitted.addListener(function (details) {
      if (details.tabId === self.beingReadTabId && (details.transitionType !== 'auto_subframe' && details.transitionType !== 'manual_subframe')) {
        stop();
      }
    });
    browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
      if (self[request['fn']]) {
        self[request['fn']](request, sender, sendResponse);
        if (isAsyncFunction(request['fn'])) {
          return true;
        }
      }
    });
  }
  function setDocType(caller) {
    return new Promise(async (resolve, reject) => {
      if (self.isFirstRead) {
        if (caller !== 'google drive preview warning') {
          let docType = await utils.getDocType(self.beingReadTabId);
          self.docType = docType;
        }
        if (self.shouldCheckForPreviewMode && self.docType === 'google drive preview') {
          reject(new Error('ERR_GOOGLE_DRIVE_PREVIEW'));
        } else {
          resolve();
        }
      } else {
        resolve();
      }
    });
  }
  function setTts(type) {
    return new Promise((resolve) => {
      if (self.tts) {
        self.tts.pause(false);
      }
      resolve();
    })
      .then(() => {
        if (type === 'prem' && voices.voices['prem'][widget.settings.premVoice].source === 'google') {
          self.tts = freeTts;
        } else {
          if (type === 'free') {
            self.tts = freeTts;
          } else {
            self.tts = onlineTts;
            if (self.tts['setNumPreloads']) {
              if (type === 'prem') {
                self.tts.setNumPreloads(2, 4);
              } else {
                self.tts.setNumPreloads(1, 1);
              }
            }
            if (self.tts['clearPreloads']) {
              self.tts.clearPreloads();
            }
          }
        }
      })
      .catch(function (err) {
      });
  }
  function isAsyncFunction(fn) {
    if (self.asyncFunctions.includes(fn)) {
      return true;
    } else {
      return false;
    }
  }
  function setBeingReadTab(sender = {}, caller = null) {
    return new Promise((resolve, reject) => {
      if (sender && sender.tab && caller !== 'google drive preview warning') {
        if (self.isFirstRead) {
          self.beingReadTabId = sender.tab.id;
          resolve();
        } else {
          if (sender.tab.id !== self.beingReadTabId) {
            reject(new Error('READ_NEW'));
          } else {
            resolve();
          }
        }
      } else {
        resolve();
      }
    });
  }
  function play(request = {}, sender = {}, sendResponse = {}) {
    let op = request ? request.op : null;
    let caller = request ? request.caller : null;
    let skipSentenceNumber = request && typeof request.skipSentenceNumber !== 'undefined' ? request.skipSentenceNumber : null;
    let percentage = request && typeof request.percentage !== 'undefined' ? request.percentage : null;
    let id = self.setPlayId();
    let texts = request && request.texts ? request.texts : null;
    if (self.tts === null) {
      setTts(widget.settings.voiceType);
    }
    return checkReadAfterSelectionToPageEndForTab(sender)
      .then(() => {
        return setBeingReadTab(sender, caller);
      })
      .then(() => {
        return setDocType(caller);
      })
      .then(() => {
        if (self.isFirstRead || op) {
          let tabId = extension.activeTabId ? extension.activeTabId : self.beingReadTabId;
          chrome.tabs.sendMessage(tabId, { 'message': 'readerOnLoading' });
          return setTextsForTts(texts);
        } else {
          return Promise.resolve();
        }
      })
      .then(() => {
        if (op === 'prev') {
          if (caller === 'backward') {
            if (skipSentenceNumber) {
              if ((ttsText.textsForTts.length - 1 - skipSentenceNumber) < 0) {
                self.currReadIndex = 0;
              } else {
                self.currReadIndex = ttsText.textsForTts.length - 1 - skipSentenceNumber;
              }
            } else {
              self.currReadIndex = ttsText.textsForTts.length - 1;
            }
          } else {
            self.currReadIndex = ttsText.textsForTts.length - 1;
          }
        }
        if (op === 'next') {
          if (caller === 'forward') {
            if (skipSentenceNumber) {
              if (skipSentenceNumber - 1 > ttsText.textsForTts.length - 1) {
                self.currReadIndex = ttsText.textsForTts.length - 1;
              } else {
                self.currReadIndex = skipSentenceNumber - 1;
              }
            } else {
              self.currReadIndex = 0;
            }
          } else {
            self.currReadIndex = 0;
          }
        }
        if (op === 'readPage') {
          if (percentage) {
            self.currReadIndex = Math.floor(ttsText.textsForTts.length * percentage);
          } else {
            self.currReadIndex = 0;
          }
        }
        self.readProgress = ((self.currReadIndex + 1) / ttsText.textsForTts.length) * 100;
      })
      .then(() => {
        return incrTtsUsageForVoices();
      })
      .then(() => {
        return setPlay(id, op);
      })
      .catch((err) => {
        handleError(err, sender, op);
      });
  }
  function checkReadAfterSelectionToPageEndForTab(sender) {
    return new Promise((resolve) => {
      if (sender && sender.tab && sender.tab.id === self.tabIdToReadAfterSelectionToPageEnd) {
      } else {
        if (self.readOption === 'after-selection-to-page-end') {
          self.readOption = 'all';
        }
      }
      self.tabIdToReadAfterSelectionToPageEnd = -1;
      resolve();
    })
      .catch((err) => {
      })
  }
  function preview() {
    return new Promise((resolve) => {
      if (self.tts === null) {
        setTts(widget.settings.voiceType);
        resolve();
      } else {
        resolve();
      }
    })
      .then(() => {
        let voice = voices.voices[widget.settings.voiceType][widget.settings[widget.settings.voiceType + 'Voice']];
        let langCode = voice.language.split('-')[0];
        let previewText = ttsText.previewTexts[langCode];
        if (!previewText) {
          previewText = ttsText.previewTexts['en'];
        }
        self.tts.play(previewText, null);
      })
      .catch((err) => {
      });
  }
  function handleError(err, sender, op) {
    err = err.message;
    if (err === 'ERR_INVALID_PLAY_ID') {
    } else if (err === 'READ_NEW') {
      stop();
      play(null, sender, null);
    } else if (err === 'ERR_PDF') {
      alertHandler.displayAlertMessage('ERR_PDF');
    } else if (err === 'ERR_NO_TEXT') {
      readAdjacentPage(op);
    } else if (err === 'ERR_NOT_READABLE') {
      stop();
      alertHandler.displayAlertMessage(err);
    } else if (err === 'ERR_GOOGLE_DRIVE_PREVIEW') {
      alertHandler.displayAlertMessage('ERR_GOOGLE_DRIVE_PREVIEW');
    } else if (err == 1005) {
      pause();
      alertHandler.displayAlertMessage(err);
    }
    else {
      stop();
    }
  }
  function setPlay(id, op = 'next') {
    self.isFirstRead = false;
    if (id === self.playId) {
      return ttsPlay();
    } else {
      return Promise.reject(new Error("ERR_INVALID_PLAY_ID"));
    }
  }
  function incrTtsUsageForVoices() {
    let text = ttsText.textsForTts[self.currReadIndex];
    if (text && text.length <= 0) {
      return Promise.resolve();
    }
    let userInfo = widget.settings.userInfo;
    if (userInfo && shouldIncrTtsUsageForVoice()) {
      let licenseNum = userInfo['license'] ? userInfo['license'] : '0';
      return utils.increaseTtsUsage(licenseNum, text.length)
        .catch((err) => {
          throw err;
        });
    }
  }
  function shouldIncrTtsUsageForVoice() {
    if (widget.settings.voiceType === 'prem') {
      if (voices.voices['prem'][widget.settings.premVoice].source === 'google') {
        setTts('free');
        return true;
      }
    }
    return false;
  }
  function setPlayId() {
    if (self.playId === undefined) {
      self.playId = 0;
    } else {
      self.playId++;
    }
    return self.playId;
  }
  function onEvent(event) {
    if (event.type === 'start') {
      self.isFirstRead = false;
      setReaderState('reading');
      setReadProgress();
      chrome.tabs.sendMessage(extension.activeTabId, {
        message: 'readerOnPlay',
        index: self.currReadIndex,
        readProgress: self.readProgress,
        beingReadTabId: self.beingReadTabId,
        activeTabId: extension.activeTabId,
        texts: ttsText.textsForTts
      });
    } else if (event.type === 'end') {
      setReaderState('pause');
      playNext();
    } else if (event.type === 'pause') {
      setReaderState('pause');
      chrome.tabs.sendMessage(extension.activeTabId, { 'message': 'readerOnPause' });
    } else if (event.type === 'loading') {
      setReaderState('loading');
      chrome.tabs.sendMessage(extension.activeTabId, { 'message': 'readerOnLoading' });
    } else if (event.type === 'word') {
      if (self.beingReadTabId > 0 && self.beingReadTabId === extension.activeTabId) {
        chrome.tabs.sendMessage(self.beingReadTabId, { fn: 'setWordForMainTextAndCC', sentenceIndex: self.currReadIndex, word: event.word, wordIndex: event.wordIndex }, function (res) {
          chrome.tabs.sendMessage(self.beingReadTabId, { fn: 'highlightWord', sentenceIndex: self.currReadIndex, wordIndex: event.wordIndex });
        });
      }
    } else if (event.type === 'textChunk') {
      chrome.tabs.sendMessage(extension.activeTabId, { fn: 'setCCText', text: event.text, sentenceIndex: self.currReadIndex });
    } else if (event.type === 'error') {
      handleError({ message: event.err });
    }
  }
  function setReaderState(state) {
    self.readerState = state;
    widget.settings.readerState = state;
  }
  function ttsPlay() {
    let text = ttsText.textsForTts[self.currReadIndex];
    return self.tts.play(text, self.currReadIndex, onEvent)
  }
  function playNext() {
    if (self.currReadIndex + 1 < ttsText.textsForTts.length) {
      self.currReadIndex++;
      play();
    } else {
      if (self.readOption === 'all' ||
        self.readOption === 'selection-to-page-end' ||
        self.readOption === 'after-selection-to-page-end') {
        if (self.readOption === 'selection-to-page-end' || self.readOption === 'after-selection-to-page-end') {
          self.readOption = 'all';
        }
        readAdjacentPage('next', 'playNext');
      } else {
        if (self.readOption === 'selection') {
          let temp = self.beingReadTabId;
          stop();
          self.readOption = 'after-selection-to-page-end';
          self.tabIdToReadAfterSelectionToPageEnd = temp;
        } else {
          stop();
        }
      }
    }
  }
  function scrollToAdjacentPage(direction = 'next') {
    return new Promise(function (resolve) {
      if (self.beingReadTabId > 0) {
        chrome.tabs.sendMessage(self.beingReadTabId, { fn: 'scrollToAdjacentPage', direction: direction }, function (res) {
          resolve(res);
        })
      } else {
        resolve('ERR');
      }
    });
  }
  function scrollToPage(pageIndex) {
    return new Promise(function (resolve) {
      if (self.beingReadTabId > 0) {
        chrome.tabs.sendMessage(self.beingReadTabId, { fn: 'scrollToPage', pageIndex: pageIndex }, function (res) {
          resolve(res);
        })
      } else {
        resolve('ERR');
      }
    });
  }
  function reset(index = 0) {
    self.isFirstRead = true;
    setReaderState('pause');
    self.currReadIndex = index;
    self.beingReadTabId = -1;
    self.tabIdToReadAfterSelectionToPageEnd = -1;
    self.playId = undefined;
    self.readOption = 'all';
    if (self.tts && self.tts['clearPreloads']) {
      self.tts.clearPreloads();
    }
  }
  function pause() {
    self.tts.pause();
  }
  function stop() {
    chrome.tabs.sendMessage(extension.activeTabId, { 'message': 'readerOnStop' });
    if (self.beingReadTabId > 0) {
      chrome.tabs.sendMessage(self.beingReadTabId, { 'message': 'readerOnStop' });
    }
    if (self.tts) {
      self.tts.stop();
    }
    reset();
  }
  function replay() {
    return new Promise((resolve) => {
      if (self.tts && self.tts.type === 'online' && self.tts['clearPreloads']) {
        self.tts.clearPreloads();
      }
      resolve();
    }).
      then(() => {
        if (self.readerState === 'reading' || self.readerState === 'loading') {
          self.tts.pause(false);
          play();
        }
      })
      .catch((err) => {
      });
  }
  function forward(request = {}, sender = {}, sendResponse = {}) {
    let skipSentenceNumber = request ? request.number : 1;
    if (self.currReadIndex + skipSentenceNumber < ttsText.textsForTts.length) {
      self.currReadIndex += skipSentenceNumber;
      play();
    } else {
      if (self.readOption === 'selection' || self.readOption === 'selection-context-menu') {
        self.currReadIndex = ttsText.textsForTts.length - 1;
        play();
      } else {
        self.readOption = 'all';
        readAdjacentPage('next', 'forward', skipSentenceNumber);
      }
    }
  }
  function backward(request = {}, sender = {}, sendResponse = {}) {
    let skipSentenceNumber = request ? request.number : 1;
    if (self.currReadIndex - skipSentenceNumber >= 0) {
      self.currReadIndex -= skipSentenceNumber;
      play();
    } else {
      if (self.readOption === 'selection' ||
        self.readOption === 'selection-to-page-end' ||
        self.readOption === 'after-selection-to-page-end' ||
        self.readOption === 'selection-context-menu') {
        self.currReadIndex = 0;
        play();
      } else {
        self.readOption = 'all';
        readAdjacentPage('prev', 'backward', skipSentenceNumber);
      }
    }
  }
  function readAdjacentPage(op = "next", caller = null, skipSentenceNumber = 1) {
    return scrollToAdjacentPage(op)
      .then((resp) => {
        if (resp !== 'ERR') {
          ttsText.textsForTts = [];
          play({ op: op, caller: caller, skipSentenceNumber: skipSentenceNumber });
        } else {
          if (self.isFirstRead) {
            handleError({ message: 'ERR_NOT_READABLE' });
          }
          if (caller === 'playNext') {
            stop();
          }
        }
      })
      .catch((err) => {
      });
  }
  function setTextsForTts(texts = null) {
    return pdfDoc.checkPDF()
      .then((res) => {
        if (res.isPdf) {
          return Promise.reject(new Error('ERR_PDF'));
        } else {
          return getTextsFromPage(texts);
        }
      })
      .then((texts) => {
        if (texts && texts.length === 0) {
          ttsText.textsForTts = [];
          throw new Error('ERR_NO_TEXT');
        } else {
          texts = texts.map(text => ttsText.processText(text));
          ttsText.textsForTts = texts;
          chrome.tabs.sendMessage(extension.activeTabId, { message: 'textsToReadOnChange', texts: ttsText.textsForTts });
        }
      });
  }
  function getTextsFromPage(texts = null) {
    return scriptInjector.executeScriptsForTextProcessor(self.beingReadTabId, self.docType)
      .then(function () {
        return new Promise((resolve, reject) => {
          if (!self.beingReadTabId) {
            reject(new Error('ERR_NO_TABID'));
          }
          if (texts) {
            chrome.tabs.sendMessage(self.beingReadTabId, { message: 'removeNRTags' });
            resolve(texts);
          } else {
            chrome.tabs.sendMessage(self.beingReadTabId, { fn: 'getTextsFromPage', op: self.readOption }, function (texts) {
              resolve(texts);
            });
          }
        });
      });
  }
  function setReadProgress() {
    self.readProgress = ((self.currReadIndex + 1) / ttsText.textsForTts.length) * 100;
  }
  function getReaderInfo(request, sender, sendResponse) {
    sendResponse({
      index: self.currReadIndex,
      readProgress: self.readProgress,
      readerState: self.readerState
    });
  }
  function getReadOption(request, sender, sendResponse) {
    sendResponse(self.readOption);
  }
  function setShouldCheckForPreviewMode(msg) {
    self.shouldCheckForPreviewMode = msg.val;
  }
  function setReadOption(option) {
    self.readOption = option;
  }
  function readIndex(request, sender, sendResponse) {
    let pageIndex = request && typeof request.pageIndex !== 'undefined' ? request.pageIndex : null;
    let senIndex = request && typeof request.index !== 'undefined' ? request.index : null;
    let percentage = request && typeof request.percentage !== 'undefined' ? request.percentage : 0;
    if (senIndex !== null) {
      if (!isNaN(senIndex)) {
        if (senIndex >= 0 && senIndex < ttsText.textsForTts.length) {
          pause();
          self.currReadIndex = senIndex;
          play();
        } else if (senIndex >= 0 && senIndex == ttsText.textsForTts.length) {
          pause();
          self.currReadIndex = senIndex - 1;
          play();
        }
      }
    } else {
      if (pageIndex !== null) {
        if (!isNaN(pageIndex)) {
          pause();
          self.readOption = 'all';
          readPage(request.pageIndex, percentage);
        }
      }
    }
    //    
  }
  function readPage(pageIndex, percentage) {
    return scrollToPage(pageIndex)
      .then((resp) => {
        if (resp !== 'ERR') {
          ttsText.textsForTts = [];
          play({ op: 'readPage', percentage: percentage });
        } else {
          if (self.isFirstRead) {
            handleError({ message: 'ERR_NOT_READABLE' });
          }
          stop();
        }
      })
      .catch((err) => {
      });
  }
  async function readSelection(request, sender, sendResponse) {
    stop();
    let docType = await utils.getDocType();
    let tabId = (sender && sender.tab.id) ? sender.tab.id : extension.activeTabId;
    return widget.injectWidget(tabId, docType, true)
      .then(() => {
        if (request && request.readSelectionOption) {
          self.readOption = request.readSelectionOption;
        } else {
          self.readOption = widget.settings.readSelectionOption;
        }
        play(request, { tab: { id: tabId } }, sendResponse);
        chrome.tabs.sendMessage(tabId, { fn: 'hideReadIcon' });
      })
      .catch((err) => {
      });
  }
  async function readSelectionWithContextMenu(sentences) {
    try {
      stop();
      let docType = await utils.getDocType();
      let tabId = extension.activeTabId;
      chrome.tabs.sendMessage(tabId, { fn: 'removeSelection' });
      await widget.injectWidget(tabId, docType, true);
      self.readOption = 'selection-context-menu';
      chrome.tabs.sendMessage(tabId, { fn: 'hideReadIcon' });
      play({ texts: sentences }, { tab: { id: tabId } });
    } catch (err) {
    }
  }
  init();
}
const reader = new Reader();