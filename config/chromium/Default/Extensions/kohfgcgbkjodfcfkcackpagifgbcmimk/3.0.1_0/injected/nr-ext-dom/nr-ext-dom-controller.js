function NRDomController() {
    let self = this;
    self.highlightColour = 'light';
    self.beHighlighted = [];
    self.isAutoScroll = true;
    self.readerState = 'pause';
    self.setCurrRead = setCurrRead;
    self.currHighlightedSentence = null;
    self.currHighlightedCCSentence = null;
    self.currHighlightedWord = null;
    self.currHighlightedCCWord = null;
    self.highlightSentence = highlightSentence;
    self.highlightWord = highlightWord;
    self.scrollTo = scrollTo;
    self.removeHighlight = removeHighlight;
    self.setUI = setUI;
    self.scrollToAdjacentPage = scrollToAdjacentPage;
    self.scrollToPage = scrollToPage;
    self.asyncFunctions = ['scrollToAdjacentPage', 'scrollToPage'];
    let isVisible = false;
    let mode = 'min';
    let ccMode = 'max-cc-compact';
    function init() {
        chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
            if (self[request.fn]) {
                self[request.fn](request, sender, sendResponse);
                if (isAsyncFunction(request.fn)) {
                    return true;
                }
            } else if (request.message === 'readerOnPlay') {
                self.readerState = 'reading';
                if (request.beingReadTabId === request.activeTabId) {
                    setCurrRead(request.index);
                }
            } else if (request.message === 'readerOnPause') {
                self.readerState = 'pause';
                removeHighlight();
            } else if (request.message === 'readerOnStop') {
                self.readerState = 'pause';
                removeHighlight();
            } else if (request.message === 'tabOnActivated') {
                if (request.beingReadTabId === request.activeTabId && request.activeTabId === request.tabId) {
                    setUI();
                } else {
                    removeHighlight();
                }
            } else if (request.message === 'highlightColourOnChange') {
                setHighlightColour(request.highlightColour, request.readerState)
            } else if (request.message === 'beHighlightedOnChange') {
                setBeHighlighted(request.beHighlighted);
            } else if (request.message === 'isAutoScrollOnChange') {
                setAutoScroll(request.isAutoScroll);
            } else if (request.message === 'ccModeOnChange') {
                ccMode = request.ccMode;
            } else if (request.message === 'modeOnChange') {
                mode = request.mode;
            } else if (request.message === 'isVisibleOnChange') {
                isVisible = request.isVisible;
            }
        });
        chrome.runtime.sendMessage({ fn: 'getWidgetSettings' }, async (widgetSettings) => {
            isVisible = widgetSettings.isVisible;
            ccMode = widgetSettings.ccMode;
            mode = widgetSettings.mode;
        });
        setUI();
    }
    function isAsyncFunction(fn) {
        if (self.asyncFunctions.includes(fn)) {
            return true;
        } else {
            return false;
        }
    }
    function setCurrRead(index) {
        highlightSentence(index);
        if (self.isAutoScroll) {
            scrollTo(index);
        }
    }
    function isCCOn() {
        return isVisible && mode.includes('max') && ccMode !== 'max-cc-none';
    }
    function modifyPageHighlight() {
        let op = 'remove';
        chrome.runtime.sendMessage({ fn: 'getReaderInfo' }, function (info) {
            if (!isCCOn() && info.readerState === 'reading') {
                op = 'add';
            }
            modifyHighlight(self.currHighlightedSentence, op, 'sentence');
            modifyHighlight(self.currHighlightedWord, op, 'word');
        });
    }
    function highlightSentence(index) {
        if (!self.beHighlighted.includes('sentence')) return;
        self.removeHighlight();
        self.currHighlightedSentence = document.getElementsByClassName("nr-s" + index);
        modifyHighlight(self.currHighlightedSentence, 'add', 'sentence');
    }
    function highlightWord(request, sender, sendResponse) {
        let sentenceIndex = request.sentenceIndex;
        let wordIndex = request.wordIndex;
        if (!self.beHighlighted.includes('word')) {
            return;
        }
        removeHighlight(['word']);
        let id = 'nr-s' + sentenceIndex + 'w' + wordIndex;
        self.currHighlightedWord = document.getElementsByClassName(id);
        modifyHighlight(self.currHighlightedWord, 'add', 'word');
    }
    function removeHighlight(toBeRemoved = ['sentence', 'word']) {
        if (toBeRemoved.includes('sentence')) {
            let highlightedSentences = Array.from(document.getElementsByClassName('nr-highlighted-sentence'));
            modifyHighlight(highlightedSentences, 'remove', 'sentence');
        }
        if (toBeRemoved.includes('word')) {
            let highlightedWords = Array.from(document.getElementsByClassName('nr-highlighted-word'));
            modifyHighlight(highlightedWords, 'remove', 'word');
        }
    }
    function modifyHighlight(elements, op, type) {
        if (elements) {
            for (let i = 0; i < elements.length; i++) {
                if (elements[i]) {
                    if (op === 'add' && self.beHighlighted.includes(type) && self.readerState === 'reading') {
                        elements[i].classList.add('nr-' + type + '-highlight-' + self.highlightColour);
                        elements[i].classList.add('nr-highlighted-' + type);
                    } else {
                        elements[i].classList.remove('nr-' + type + '-highlight-' + self.highlightColour);
                        elements[i].classList.remove('nr-highlighted-' + type);
                    }
                }
            }
        }
    }
    function setHighlightColour(colour, readerState = 'pause') {
        self.removeHighlight();
        self.highlightColour = colour;
        if (readerState === 'reading') {
            if (self.beHighlighted.includes('sentence')) {
                modifyHighlight(self.currHighlightedSentence, 'add', 'sentence');
            }
            if (self.beHighlighted.includes('word')) {
                modifyHighlight(self.currHighlightedWord, 'add', 'word');
            }
        }
    }
    function setBeHighlighted(beHighlighted) {
        self.beHighlighted = beHighlighted;
        chrome.runtime.sendMessage({ fn: 'getReaderInfo' }, function (info) {
            if (!self.beHighlighted.includes('sentence')) {
                removeHighlight(['sentence']);
            } else {
                if (info.readerState === 'reading') {
                    highlightSentence(info.index);
                }
            }
            if (!self.beHighlighted.includes('word')) {
                removeHighlight(['word']);
            }
        });
    }
    function setAutoScroll(val) {
        self.isAutoScroll = val;
        chrome.runtime.sendMessage({ fn: 'getReaderInfo' }, function (info) {
            if (info.readerState === 'reading' && self.isAutoScroll) {
                scrollTo(info.index);
            }
        });
    }
    function scrollTo(index) {
        try {
            let element = null;
            element = document.getElementsByClassName('nr-s' + index)[0];
            if (element) {
                if (doc.type === 'googleDoc') {
                    element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
                } else {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        } catch (err) {
        }
    }
    function setUI() {
        chrome.runtime.sendMessage({ fn: 'getWidgetSettings' }, function (widgetSettings) {
            setHighlightColour(widgetSettings.highlightColour, widgetSettings.readerState);
            setBeHighlighted(widgetSettings.beHighlighted);
            setAutoScroll(widgetSettings.isAutoScroll)
        });
        chrome.runtime.sendMessage({ fn: 'getReaderInfo' }, function (info) {
            if (info.readerState === 'pause') {
                removeHighlight();
            } else if (info.readerState === 'reading') {
                setCurrRead(info.index);
            }
        });
    }
    function scrollToAdjacentPage(msg, sender, sendResponse) {
        return new Promise(function (resolve) {
            if (doc.scrollToAdjacentPage) {
                return doc.scrollToAdjacentPage(msg.direction)
                    .then(resp => {
                        sendResponse(resp);
                        resolve(resp);
                    })
            } else {
                sendResponse("ERR");
            }
        })
            .catch((err) => {
                sendResponse("ERR");
            });
    }
    function scrollToPage(msg, sender, sendResponse) {
        return new Promise(function (resolve) {
            if (doc.scrollToPage) {
                return doc.scrollToPage(msg.pageIndex)
                    .then(resp => {
                        sendResponse(resp);
                        resolve(resp);
                    })
            } else {
                sendResponse("ERR");
            }
        })
            .catch((err) => {
                sendResponse("ERR");
            });
    }
    function removeSelection() {
        let selection = window.getSelection();
        selection.removeAllRanges();
    }
    init();
}
var nrDomController = nrDomController || new NRDomController();