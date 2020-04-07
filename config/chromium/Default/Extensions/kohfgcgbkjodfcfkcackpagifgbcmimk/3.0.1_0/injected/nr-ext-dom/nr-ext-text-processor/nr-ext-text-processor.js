function NRTextProcessor() {
    let self = this;
    self.processHtmlText = processHtmlText;
    self.processSentencesByLength = processSentencesByLength;
    self.getNlpSentences = getNlpSentences;
    self.getTextsFromPage = getTextsFromPage;
    self.setWordsForMainTextAndCC = setWordsForMainTextAndCC;
    self.setWordForMainTextAndCC = setWordForMainTextAndCC;
    self.setWord = setWord;
    self.asyncFunctions = ['getTextsFromPage', 'setWordForMainTextAndCC'];
    function init() {
        chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
            if (self[request['fn']]) {
                self[request['fn']](request, sender, sendResponse);
                if (isAsyncFunction(request['fn'])) {
                    return true;
                }
            } else if (request.message === 'beHighlightedOnChange') {
                if (!request.beHighlighted.includes('sentence') && !request.beHighlighted.includes('word')) {
                    replaceNRTagsWithTextNodes('nr-sentence');
                    document.normalize();
                } else if (!request.beHighlighted.includes('word')) {
                    replaceNRTagsWithTextNodes('nr-word');
                }
            } else if (request.message === 'removeNRTags') {
                removeNRTags();
            }
        });
    }
    function isAsyncFunction(fn) {
        if (self.asyncFunctions.includes(fn)) {
            return true;
        } else {
            return false;
        }
    }
    function getTextsFromPage(request, sender, sendResponse) {
        return doc.getTexts(request.op, request.text)
            .then((texts) => {
                sendResponse(texts);
            })
            .catch((err) => {
            });
    }
    function setWordsForMainTextAndCC(request, sender, sendResponse) {
        let sentenceIndex = request.index;
        let words = request.words;
        setWords('', sentenceIndex, words);
        setWords('cc', sentenceIndex, words);
    }
    async function setWordForMainTextAndCC(request, sender, sendResponse) {
        try {
            let word = request.word;
            let wordIndex = request.wordIndex;
            let sentenceIndex = request.sentenceIndex;
            let prevLastNrWordTextNode = getLastPrevNrWordTextNode('', sentenceIndex, wordIndex);
            await replaceNRTagsWithTextNodes('nr-word');
            await setWord('', word, wordIndex, sentenceIndex, prevLastNrWordTextNode);
            document.normalize();
            sendResponse();
        } catch (err) {
            sendResponse();
        }
    }
    async function setWords(type, sentenceIndex, words) {
        try {
            let index = 0;
            let sentenceName = 'nr-' + type + (type ? '-' : '') + 's' + sentenceIndex;
            await replaceNRTagsWithTextNodes('nr-word');
            document.normalize();
            let sentenceElems = Array.from(document.getElementsByClassName(sentenceName));
            let copiedWords = createDeepCopy(words);
            for (let i = 0; i < sentenceElems.length; i++) {
                let nrSentence = sentenceElems[i];
                nrSentence.normalize();
                let walk = document.createTreeWalker(nrSentence, NodeFilter.SHOW_TEXT, null, false);
                let n = null;
                while (n = walk.nextNode()) {
                    let result = await setWordsHelper(n, sentenceName, copiedWords, index);
                    if (!result || !result.node) {
                        break;
                    }
                    let nextIndex = result.index;
                    walk.currentNode = result.node;
                    if (index != nextIndex) {
                        index = nextIndex;
                        if (index > words.length - 1) {
                            break;
                        }
                    }
                }
            }
        } catch (err) {
        }
    }
    async function setWordsHelper(textNode, sentenceName, words, index) {
        try {
            if (index > words.length - 1) {
                return;
            }
            if (!(textNode.nodeValue && processHtmlText(textNode.nodeValue).trim() !== '')) {
                return { index: index, node: textNode };
            }
            let i = 0
            let start = 0;
            let nodeText = textNode.nodeValue;
            let end = nodeText.length;
            let ttsWord = words[index];
            let nextIndex = index
            let isStartFound = false;
            while (i < nodeText.length) {
                if (processTextForCharComparison(nodeText[i]) === processTextForCharComparison(ttsWord[0])) {
                    if (!isStartFound) {
                        start = i;
                        isStartFound = true;
                    }
                    ttsWord = ttsWord.substring(1);
                    if (ttsWord.length === 0) {
                        i++;
                        nextIndex++;
                        break;
                    }
                }
                i++;
            }
            if (!isStartFound) {
                return { index: index, node: textNode };
            }
            end = i;
            words[index] = ttsWord;
            let nrWord = document.createElement('nr-word');
            $(nrWord).addClass(sentenceName + 'w' + index);
            if (start !== 0) {
                textNode = textNode.splitText(start);
                end = end - start;
            }
            let remainder = textNode.splitText(end);
            $(textNode).wrap(nrWord)
            return { index: nextIndex, node: textNode };
        } catch (err) {
        }
    }
    function setWord(type, word, wordIndex, sentenceIndex, lastPrevNrWordTextNode) {
        return new Promise(async (resolve) => {
            let sentenceName = 'nr-' + type + (type ? '-' : '') + 's' + sentenceIndex;
            chrome.runtime.sendMessage({ fn: 'getWidgetSettings' }, async (widgetSettings) => {
                if (widgetSettings.beHighlighted.includes('word')) {
                    let sentenceElems = [];
                    if (type === 'cc' && typeof nrExtWidget != 'undefined') {
                        let ccText = nrExtWidget.getWidgetElements()['max']['ccText'];
                        sentenceElems = Array.from(ccText.getElementsByClassName(sentenceName));
                    } else {
                        sentenceElems = Array.from(document.getElementsByClassName(sentenceName));
                    }
                    for (let i = 0; i < sentenceElems.length; i++) {
                        let nrSentence = sentenceElems[i];
                        let walk = document.createTreeWalker(nrSentence, NodeFilter.SHOW_TEXT, null, false);
                        let n = null;
                        while (n = walk.nextNode()) {
                            let result = await setWordHelper(n, lastPrevNrWordTextNode, sentenceName, word, wordIndex);
                            if (!result.node) {
                                break;
                            }
                            word = result.word;
                            if (!word) {
                                break;
                            }
                            walk.currentNode = result.node;
                        }
                        if (!word) {
                            break;
                        }
                    }
                    resolve(word);
                } else {
                    resolve(word);
                }
            });
        })
            .catch((err) => {
            });
    }
    function getLastPrevNrWordTextNode(type, sentenceIndex, wordIndex) {
        let sentenceName = 'nr-' + type + (type ? '-' : '') + 's' + sentenceIndex;
        let prevWordName = sentenceName + 'w' + (wordIndex - 1);
        let prevWordElems = [];
        if (type === 'cc' && typeof nrExtWidget != 'undefined') {
            let ccText = nrExtWidget.getWidgetElements()['max']['ccText'];
            prevWordElems = Array.from(ccText.getElementsByClassName(prevWordName));
        } else {
            prevWordElems = Array.from(document.getElementsByClassName(prevWordName));
        }
        let lastPrevWordElem = prevWordElems[prevWordElems.length - 1];
        let lastPrevNrWordTextNodes = getTextNodes(lastPrevWordElem);
        let lastPrevNrWordTextNode = lastPrevNrWordTextNodes[lastPrevNrWordTextNodes.length - 1];
        return lastPrevNrWordTextNode;
    }
    function setWordHelper(textNode, lastPrevNrWord = null, sentenceName, word, index) {
        try {
            if (lastPrevNrWord && lastPrevNrWord.compareDocumentPosition(textNode) !== Node.DOCUMENT_POSITION_FOLLOWING) {
                return { node: textNode, word: word };
            }
            if (!(textNode.nodeValue && processHtmlText(textNode.nodeValue).trim() !== '')) {
                return { node: textNode, word: word };
            }
            let i = 0
            let start = 0;
            let nodeText = textNode.nodeValue;
            let end = nodeText.length;
            let isStartFound = false;
            while (i < nodeText.length) {
                if (processTextForCharComparison(nodeText[i]) === processTextForCharComparison(word[0])) {
                    if (!isStartFound) {
                        start = i;
                        isStartFound = true;
                    }
                    word = word.substring(1);
                    if (word.length === 0) {
                        i++;
                        break;
                    }
                }
                i++;
            }
            if (!isStartFound) {
                return { node: textNode, word: word };
            }
            end = i;
            let nrWord = document.createElement('nr-word');
            $(nrWord).addClass(sentenceName + 'w' + index);
            if (start !== 0) {
                textNode = textNode.splitText(start);
                end = end - start;
            }
            let remainder = textNode.splitText(end);
            $(textNode).wrap(nrWord)
            return { node: textNode, word: word };
        } catch (err) {
        }
    }
    init();
}
var nrTextProcessor = nrTextProcessor || new NRTextProcessor();
var ignoreTags = ignoreTags || "select, textarea, button, label, audio, video, dialog, embed, menu, nav, noframes, noscript, object, script, style, svg, aside, footer, #footer, .no-read-aloud, #nr-webreader, #nr-ext-widget, .nr-webreader-trigger-container, .nr-webreader-check, .nr-webreader-frame";
var paragraphSplitter = paragraphSplitter || /(?:\s*\r?\n\s*){2,}/;
function getInnerText(elem) {
    let text = elem.innerText;
    return text ? text.trim() : "";
}
function removeExtraSpace(text) {
    return text.replace(/\s{2,}/g, ' ').trim();
}
function isNotEmpty(text) {
    return text;
}
function fixParagraphs(texts) {
    let out = [];
    let para = "";
    for (let i = 0; i < texts.length; i++) {
        if (!texts[i]) {
            if (para) {
                out.push(para);
                para = "";
            }
            continue;
        }
        if (para) {
            if (/-$/.test(para)) para = para.substr(0, para.length - 1);
            else para += " ";
        }
        para += texts[i].replace(/-\r?\n/g, "");
        if (texts[i].match(/[.!?:)"'\u2019\u201d]$/)) {
            out.push(para);
            para = "";
        }
    }
    if (para) out.push(para);
    return out;
}
function tryGetTexts(getTexts, millis) {
    return waitMillis(500)
        .then(getTexts)
        .then(function (texts) {
            if (texts && !texts.length && millis - 500 > 0) return tryGetTexts(getTexts, millis - 500);
            else return texts;
        });
    function waitMillis(millis) {
        return new Promise(function (fulfill) {
            setTimeout(fulfill, millis);
        });
    }
}
function loadPageScript(url) {
    if (!$("head").length) $("<head>").prependTo("html");
    $.ajax({
        dataType: "script",
        cache: true,
        url: url
    });
}
function getLang() {
    var lang = document.documentElement.lang || $("html").attr("xml:lang");
    if (lang) lang = lang.split(",", 1)[0].replace(/_/g, '-');
    if (lang == "en" || lang == "en-US") lang = null;   
    return lang;
}
function processSentencesByLength(sentences) {
    let result = [];
    for (let i = 0; i < sentences.length; i++) {
        let blocks = splitIntoSentences(sentences[i]);
        blocks = mergeShort(blocks);
        result.push(...blocks);
    }
    return result;
}
function processHtmlText(text) {
    text = removeLineBreaks(text);
    text = replaceHTMLSpaces(text);
    text = removeExtraSpaces(text);
    text = removeDumbChars(text);
    return text;
}
function removeDumbChars(text) {
    return text && text.replace(/\u200c/g, '');
}
function removeLineBreaks(text) {
    return text.replace(/(\r\n|\n|\r)/gm, " ");
}
function replaceHTMLSpaces(text) {
    text = text.replace(/&nbsp;/gi, ' ');
    text = text.replace(/[\u200c|\u200b|\u200d|\ufeff]/gi, ' ');
    return text;
}
function removeExtraSpaces(text) {
    return text.replace(/\s+/g, ' ');
}
function getNlpSentences(text) {
    let sentences = nlp(text).sentences().data();
    return sentences.map(x => x.text.trim());
}
function processTextForCharComparison(text) {
    let processedText = processHtmlText(text);
    processedText = processedText.replace(/[\u2018|\u2019|\u2039|\u203A]/g, "'");
    processedText = processedText.replace(/[\u2014|\u2015]/g, '-');
    return processedText.toLowerCase();
}
function splitIntoSentences(str, maxLength = 500) {
    let result = [];
    let i = 0;
    while (str.length > 0) {
        let indexOfSplitPoint = getIndexOfSplitPoint(str, maxLength);
        let sentence = str.substring(i, indexOfSplitPoint + 1);
        result.push(sentence);
        str = str.substring(indexOfSplitPoint + 1);
    }
    return result;
}
function mergeShort(blocks) {
    let longText = "";
    let newBlocks = [];
    for (let j = 0; j != blocks.length; j++) {
        longText += blocks[j];
        let canAdd = true;
        if (j + 1 < blocks.length) {
            if ((longText + blocks[j + 1]).length > 250) {
                canAdd = false;
            }
            if (longText.length < 50) {
                canAdd = true;
            }
        }
        if (j == blocks.length - 1 || !canAdd) {
            newBlocks.push(longText);
            longText = "";
        }
    }
    return newBlocks;
}
function getIndexOfSplitPoint(text, length) {
    let endPunctuations = ["?", "!", "¿", "¡", "。", "～", "……", "！", "？"];
    let midPunctuations = [",", ";", ":", "，", "；", "："];
    let textWithinRange = text.substring(0, length);
    if (text.length <= length) {
        return text.length - 1;
    } else {
        let indexOfSplitPoint = Number.MAX_VALUE;
        for (let i = 0; i < endPunctuations.length; i++) {
            let index = textWithinRange.indexOf(endPunctuations[i]);
            if (index <= indexOfSplitPoint && index >= 0) {
                indexOfSplitPoint = index;
            }
        }
        if (indexOfSplitPoint === Number.MAX_VALUE) {
            indexOfSplitPoint = -1;
        }
        if (indexOfSplitPoint <= 0) {
            for (let j = 0; j < midPunctuations.length; j++) {
                indexOfSplitPoint = Math.max(textWithinRange.lastIndexOf(midPunctuations[j]), indexOfSplitPoint);
            }
            if (indexOfSplitPoint <= 0) {
                indexOfSplitPoint = textWithinRange.lastIndexOf(' ');
                if (indexOfSplitPoint <= 0) {
                    indexOfSplitPoint = textWithinRange.lastIndexOf('\u303f');
                }
            }
            if (indexOfSplitPoint <= 0) {
                return length - 1;
            } else {
                return indexOfSplitPoint;
            }
        } else {
            if (text[indexOfSplitPoint + 1] && text[indexOfSplitPoint + 1] === '"') {
                return indexOfSplitPoint + 1;
            } else {
                return indexOfSplitPoint;
            }
        }
    }
}
async function removeNRTags(request = null, sender = null, sendResponse = null) {
    try {
        await replaceNRTagsWithTextNodes('nr-word');
        await replaceNRTagsWithTextNodes('nr-sentence');
    } catch (err) {
    }
}
function replaceNRTagsWithTextNodes(tagName) {
    let promises = [];
    return new Promise(async (resolve) => {
        let nodes = $(document.body).find(tagName).get();
        nodes.map(node => {
            promises.push(unwrapNode(node));
        })
        resolve(promises);
    })
        .then((promises) => {
            return Promise.all(promises);
        })
        .then(() => {
            return new Promise((resolve) => {
                resolve();
            });
        })
        .catch((err) => {
        })
}
function unwrapNode(node) {
    $.when($(node).contents().unwrap())
        .then(() => {
            return Promise.resolve();
        });
}
function getTextNodes(node) {
    let textNodes = [];
    if (node && node instanceof Node) {
        let walk = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
        let n = null;
        while (n = walk.nextNode()) {
            textNodes.push(n);
        }
    }
    return textNodes;
}
function getSelectedNodes() {
    if (window.getSelection) {
        let sel = window.getSelection();
        if (!sel.isCollapsed) {
            let result = getRangeSelectedNodes(sel.getRangeAt(0));
            let pNodes = [];
            let textNodes = [];
            pNodes = result.filter(node => node.nodeName.toLowerCase() === 'p');
            textNodes = result.filter(node => node.nodeType == 3 && $(node).text().trim() !== '' && node.parentNode.nodeName.toLowerCase() !== 'style');
            return { pNodes, textNodes, allNodes: result };
        }
    }
    return { 'pNodes': [], 'textNodes': [], 'allNodes': [] };
}
function getRangeSelectedNodes(range) {
    let node = range.startContainer;
    let endNode = range.endContainer;
    if (node == endNode) {
        return [node];
    }
    let rangeNodes = [];
    while (node && node != endNode) {
        rangeNodes.push(node = nextNode(node));
    }
    node = range.startContainer;
    while (node && node != range.commonAncestorContainer) {
        rangeNodes.unshift(node);
        node = node.parentNode;
    }
    return rangeNodes;
}
function nextNode(node) {
    if (node.hasChildNodes()) {
        return node.firstChild;
    } else {
        while (node && !node.nextSibling) {
            node = node.parentNode;
        }
        if (!node) {
            return null;
        }
        return node.nextSibling;
    }
}
function createDeepCopy(array) {
    let deepCopy = [];
    for (let i = 0; i < array.length; i++) {
        deepCopy.push(array[i]);
    }
    return deepCopy;
}
