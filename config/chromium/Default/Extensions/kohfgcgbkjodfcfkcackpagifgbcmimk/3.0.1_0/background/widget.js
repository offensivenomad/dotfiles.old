function Widget() {
    let self = this;
    self.injectWidget = injectWidget;
    self.injectSD = injectSD;
    self.setWidgetUI = setWidgetUI;
    self.setWidgetSetting = setWidgetSetting;
    self.defaultSettings = {
        isVisible: true,
        mode: 'min',
        ccMode: 'max-cc-compact',
        readerState: 'pause',
        voiceType: 'prem',
        speed: 0,
        freeVoice: null,
        readIcon: true,
        beHighlighted: [],
        isAutoScroll: true,
        isDyslexic: false,
        showReadSelectionToPageEndOption: true,
        readSelectionOption: 'selection',
        highlightColour: 'light',
        userInfo: { licNum: 0, licCode: '0', license: '0', email: 'user@naturalreaders.com' },
        loggedIn: 0,
        LimitedReadSelectionOn: false,
        LimitedReadSelectionCharAmount: 60,
        backwardStep: 0,
        forwardStep: 0,
        backwardSkipNumber: [1, 2],
        forwardSkipNumber: [2, 4],
        returnNormalSkipTime: 2000
    };
    self.settings = self.defaultSettings;
    self.isAsyncFunction = isAsyncFunction;
    self.asyncFunctions = ['getWidgetSettings'];
    self.getWidgetSettings = getWidgetSettings;
    function init() {
        chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
            if (self[request['fn']]) {
                self[request.fn](request, sender, sendResponse);
                if (self.isAsyncFunction(request.fn)) {
                    return true;
                }
            }
        });
        initSettings();
    }
    function initSettings() {
        chrome.storage.sync.get(null, (result) => {
            if (chrome.runtime.lastError) {
            }
            self.settings.ccMode = result && result.ccMode ? result.ccMode : 'max-cc-compact';
            self.settings.voiceType = result && result.voiceType ? result.voiceType : 'prem';
            self.settings.freeVoice = result && result.freeVoice ? result.freeVoice : voices.defaultFreeVoice;
            self.settings.premVoice = result && result.premVoice ? result.premVoice : voices.defaultPremVoice;
            self.settings.plusVoice = result && result.plusVoice ? result.plusVoice : voices.defaultPlusVoice;
            self.settings.preset1Voice = result && result.preset1Voice ? result.preset1Voice : voices.defaultPremVoice;
            self.settings.preset2Voice = result && result.preset2Voice ? result.preset2Voice : voices.defaultPremVoice;
            self.settings.beHighlighted = result && result.beHighlighted ? result.beHighlighted : ['sentence', 'word'];
            self.settings.highlightColour = result && result.highlightColour ? result.highlightColour : 'light';
            self.settings.readIcon = result && result.readIcon != null ? result.readIcon : true;
            self.settings.isAutoScroll = result && result.isAutoScroll ? result.isAutoScroll : true;
            self.settings.isDyslexic = result && result.isDyslexic ? result.isDyslexic : false;
            self.settings.readSelectionOption = result && result.readSelectionOption ? result.readSelectionOption : 'selection';
            self.settings.showReadSelectionToPageEndOption = result && result.showReadSelectionToPageEndOption != null ? result.showReadSelectionToPageEndOption : true;
            self.settings.LimitedReadSelectionOn = result && result.LimitedReadSelectionOn != null ? result.LimitedReadSelectionOn : true;
            self.settings.LimitedReadSelectionCharAmount = result && result.LimitedReadSelectionCharAmount ? result.LimitedReadSelectionCharAmount : 60;
            self.settings.speed = result && result.speed ? result.speed : 0;
            self.settings.userInfo = result && result.userInfo ? result.userInfo : { licNum: 0, licCode: '0', license: '0', email: 'user@naturalreaders.com' };
            self.settings.loggedIn = result && 'loggedIn' in result ? result.loggedIn : 0;
            self.settings.backwardStep = self.defaultSettings.backwardStep;
            self.settings.forwardStep = self.defaultSettings.forwardStep;
            self.settings.backwardSkipNumber = result && result.backwardSkipNumber ? result.backwardSkipNumber : self.defaultSettings.backwardSkipNumber;
            self.settings.forwardSkipNumber = result && result.forwardSkipNumber ? result.forwardSkipNumber : self.defaultSettings.forwardSkipNumber;
            self.settings.returnNormalSkipTime = result && result.returnNormalSkipTime ? result.returnNormalSkipTime : self.defaultSettings.returnNormalSkipTime;
        });
    }
    function isAsyncFunction(fn) {
        if (self.asyncFunctions.includes(fn)) {
            return true;
        } else {
            return false;
        }
    }
    function injectWidget(tabId, docType, toShow, toStopReading = false) {
        return scriptInjector.canExecuteScript()
            .then(() => {
                return pdfDoc.isOnlinePdf()
            })
            .then((res) => {
                return new Promise((resolve) => {
                    if (!res) {
                        if (toStopReading && reader.beingReadTabId > 0 && tabId !== reader.beingReadTabId) {
                            reader.stop();
                        }
                        chrome.tabs.sendMessage(tabId, { fn: "getHasWidget" }, function (hasWidget) {
                            if (chrome.runtime.lastError) {
                                chrome.tabs.executeScript(tabId, { file: "injected/nr-ext-widget/nr-ext-widget.js" }, () => {
                                    if (chrome.runtime.lastError) {
                                    }
                                    chrome.tabs.sendMessage(tabId, { message: "injectWidget" }, function () {
                                        if (chrome.runtime.lastError) {
                                        }
                                        resolve();
                                    });
                                    injectSD(tabId, docType);
                                });
                            }
                            if (hasWidget) {
                                chrome.tabs.sendMessage(tabId, { fn: "toggleWidget", toShow: toShow });
                                resolve();
                            } else {
                                chrome.tabs.sendMessage(tabId, { message: "injectWidget" }, function () {
                                    if (chrome.runtime.lastError) {
                                    }
                                    resolve();
                                });
                                injectSD(tabId, docType);
                            }
                        });
                    } else {
                        resolve();
                    }
                });
            })
            .catch((err) => {
            });
    }
    function injectSD(tabId, docType) {
        chrome.tabs.sendMessage(tabId, { fn: "getHasIcon" }, function (hasIcon) {
            if (chrome.runtime.lastError) {
                injectSDHelper(tabId, docType);
            } else {
                if (!hasIcon) {
                    injectSDHelper(tabId, docType);
                }
            }
        });
    }
    function injectSDHelper(tabId, docType) {
        chrome.tabs.executeScript(tabId, { file: "assets/js/core/jquery.min.js" }, () => {
            if (chrome.runtime.lastError) {
            }
            chrome.tabs.executeScript(tabId, { file: "injected/nr-ext-dom/nr-ext-text-processor/nr-ext-text-processor.js" }, () => {
                if (chrome.runtime.lastError) {
                }
                if (docType === 'google doc') {
                    chrome.tabs.executeScript(tabId, { file: "injected/nr-ext-dom/nr-ext-text-processor/google-doc-utils.js" }, () => {
                        if (chrome.runtime.lastError) {
                        }
                        chrome.tabs.executeScript(tabId, { file: "injected/nr-ext-dom/nr-ext-selection-detector.js" }, () => {
                            if (chrome.runtime.lastError) {
                            }
                            chrome.tabs.sendMessage(tabId, {
                                message: "injectSD",
                                value: {
                                    'iconState': self.settings.readIcon,
                                    'LimitedReadSelectionOn': self.settings.LimitedReadSelectionOn,
                                    'LimitedReadSelectionCharAmount': self.settings.LimitedReadSelectionCharAmount
                                }
                            });
                        })
                    });
                } else {
                    chrome.tabs.executeScript(tabId, { file: "injected/nr-ext-dom/nr-ext-selection-detector.js" }, () => {
                        if (chrome.runtime.lastError) {
                        }
                        chrome.tabs.sendMessage(tabId, {
                            message: "injectSD",
                            value: {
                                'iconState': self.settings.readIcon,
                                'LimitedReadSelectionOn': self.settings.LimitedReadSelectionOn,
                                'LimitedReadSelectionCharAmount': self.settings.LimitedReadSelectionCharAmount
                            }
                        });
                    })
                }
            });
        });
    }
    function setWidgetUI(tabId) {
        if (tabId) {
            chrome.tabs.sendMessage(tabId, { fn: "getHasWidget" }, function (hasWidget) {
                if (chrome.runtime.lastError) {
                }
                if (hasWidget) {
                    chrome.tabs.sendMessage(tabId, { fn: "setWidgetUI" });
                }
            });
        }
    }
    function setWidgetSetting(request, sender, sendResponse) {
        let tabId = reader.beingReadTabId !== -1 ? reader.beingReadTabId : extension.activeTabId;
        if (request.key === 'voiceType' && request.value !== self.settings.voiceType) {
            reader.setTts(request.value);
            reader.replay();
        } else if (request.key.includes('Voice') && !request.key.includes('preset') && request.value !== self.settings[request.key]) {
            reader.setTts(self.settings.voiceType);
            reader.replay();
        } else if (request.key === 'speed' && request.value !== self.settings.speed) {
            reader.replay();
        } else if (request.key === 'beHighlighted') {
            chrome.tabs.sendMessage(tabId, { message: 'beHighlightedOnChange', beHighlighted: request.value, highlightColour: self.settings.highlightColour });
        } else if (request.key === 'highlightColour') {
            chrome.tabs.sendMessage(tabId, { message: 'highlightColourOnChange', highlightColour: request.value, oldHighlightColour: self.settings.highlightColour, beHighlighted: self.settings.beHighlighted, readerState: self.settings.readerState });
        } else if (request.key === 'isAutoScroll') {
            chrome.tabs.sendMessage(tabId, { message: 'isAutoScrollOnChange', isAutoScroll: request.value });
        } else if (request.key === 'LimitedReadSelectionCharAmount') {
            chrome.tabs.sendMessage(tabId, { message: 'setLimit', value: request.value })
        } else if (request.key === 'ccMode') {
            chrome.tabs.sendMessage(tabId, { message: 'ccModeOnChange', ccMode: request.value, highlightColour: self.settings.highlightColour });
        } else if (request.key === 'mode') {
            chrome.tabs.sendMessage(tabId, { message: 'modeOnChange', mode: request.value, ccMode: self.settings.ccMode });
        } else if (request.key === 'isVisible') {
            chrome.tabs.sendMessage(tabId, { message: 'isVisibleOnChange', isVisible: request.value, mode: self.settings.mode, ccMode: self.settings.ccMode });
        }
        self.settings[request.key] = request.value;
        let obj = {};
        obj[request.key] = request.value;
        storage.set(obj);
        //
    }
    function getWidgetSettings(request, sender, sendResponse) {
        sendResponse(self.settings);
    }
    init();
}
const widget = new Widget();
