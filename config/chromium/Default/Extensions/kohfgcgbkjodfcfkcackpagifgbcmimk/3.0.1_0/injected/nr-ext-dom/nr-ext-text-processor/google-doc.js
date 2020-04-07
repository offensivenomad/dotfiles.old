var doc = doc && doc.type === 'googleDoc' ? doc : new function() {
    let self = this;
    self.type = "googleDoc";
    let textsToRead = [];
    let viewport = $(".kix-appview-editor").get(0);
    let pages = $(".kix-page");
    let selectionState;
    let pageIndex = 0;
    let isSelected = false;
    self.getPageIndex = getPageIndex;
    self.getPages = getPages;
    this.scrollToAdjacentPage = function(direction) {
        return new Promise((resolve) => {
            pages = $(".kix-page");
            let page = null;
            if (direction === 'next') {
                if (pageIndex < pages.length - 1 && pageIndex !== -1) {
                    page = pages[pageIndex + 1];
                } else {
                    resolve("ERR");
                }
            } else {
                if (pageIndex > 0) {
                    page = pages[pageIndex - 1];
                } else if (pageIndex === -1) {
                    page = pages[pages.length - 2];
                }
                else {
                    resolve("ERR");
                }
            }
            viewport.scrollTop = $(page).position().top;
            resolve();
        })
            .catch((err) => {
            });
    }
    this.scrollToPage = function(index) {
        return new Promise((resolve) => {
            pages = $(".kix-page");
            let page = null;
            if (index >= 0 && index < pages.length) {
                page = pages[index];
            } else {
                resolve("ERR");
            }
            viewport.scrollTop = $(page).position().top;
            resolve();
        })
            .catch((err) => {
            });
    }
    this.scrollToSentence = async function(elem) {
        let offset = -(await calculateScrollOffset(elem));
        if (pageIndex === -1) {
            viewport.scrollTop = offset + $(pages[pages.length - 1]).position().top;
        } else {
            viewport.scrollTop = offset + $(pages[pageIndex]).position().top;
        }
    }
    function calculateScrollOffset(elem) {
        return new Promise((resolve) => {
            let elemOffset = $(elem).offset().top;
            let offset = 0;
            elem = $(elem);
            while (elem.offsetParent() && elem.offsetParent().css('position') === 'relative' && !elem.offsetParent().hasClass('kix-page')) {
                offset = offset + elem.offsetParent().offset().top;
                elem = elem.offsetParent();
            }
            resolve(elemOffset - offset);
        })
            .catch((err) => {
            });
    }
    function getCurrentIndex() {
        let index = 0;
        for (let i = 0; i < pages.length; i++) {
            if (pages.eq(i).position().top > viewport.scrollTop + $(viewport).height() / 2) {
                index = i;
                break;
            }
        }
        return index - 1;
    }
    this.getTexts = function(op = 'all') {
        pageIndex = getCurrentIndex();
        return new Promise(async (resolve) => {
            let promises = [];
            promises.push(await parse(pageIndex, op));
            resolve(promises);
        })
            .then(promises => {
                return Promise.all(promises);
            })
            .then(() => {
                return new Promise((resolve) => {
                    resolve(textsToRead);
                });
            })
            .catch((err) => {
            });
    }
    function reset() {
        return Promise.resolve()
            .then(() => {
                textsToRead = [];
            }).catch(err => {
            });
    }
    function parse(index, op = 'all') {
        if (op === 'all') {
            isSelected = false;
            return parseAll(index, op);
        } else if (op === 'selection') {
            isSelected = true;
            return parseSelection();
        } else if (op === 'selection-to-page-end') {
            isSelected = true;
            return parseSelectionToPageEnd();
        } else if (op === 'after-selection-to-page-end') {
            isSelected = true;
            return parseAfterSelectionToPageEnd();
        } else if (op === 'convert') {
            isSelected = false;
            if (nrSelectionDetector.hasSelectionOnPage()) {
                return parseSelection(op);
            } else {
                return parseAllPages(op);
            }
        }
    }
    function parseAllPages(op) {
        return new Promise(async (resolve) => {
            await reset();
            if (op !== 'convert') {
                await removeNRTags();
            }
            let oldScrollTop = viewport.scrollTop;
            for (let i = 0; i < pages.length; i++) {
                await parseAll(i, op);
            }
            viewport.scrollTop = oldScrollTop;
            resolve();
        })
            .catch((err) => {
            });
    }
    function parseAll(index, op) {
        return new Promise(async (resolve) => {
            if (op !== 'convert') {
                await reset();
                await removeNRTags();
            }
            resolve();
        })
            .then(() => {
                return parsePage(index, op);
            })
            .catch((err) => {
            });
    }
    function parsePage(index = 0, op = 'all', lastSelectedNode = null) {
        return new Promise((resolve) => {
            let page = pages.get(index);
            if (page) {
                viewport.scrollTop = $(page).position().top;
                let checkPageInView = setInterval(async function() {
                    if (pages.get(getCurrentIndex()) === page) {
                        clearInterval(checkPageInView);
                        await processSentencesInParagraphs(page, op, lastSelectedNode);
                        resolve();
                    }
                }, 500);
            } else {
                resolve();
            }
        })
            .catch((err) => {
            });
    }
    function parseSelection(op) {
        let selectedNodes = {};
        return new Promise(async (resolve) => {
            await reset();
            if (op !== 'convert') {
                await removeNRTags();
                document.normalize();
            }
            resolve();
        })
            .then(() => {
                return new Promise((resolve) => {
                    hack();
                    let doc = googleDocsUtil.getGoogleDocument(true, true, false);
                    selectedNodes = doc.selectedNodes;
                    googleDocsUtil.removeSelectionOverlay();
                    resolve();
                });
            })
            .then(() => {
                return new Promise((resolve) => {
                    let toRead = [];
                    let currNodesInP = [];
                    let textNodes = selectedNodes.textNodes;
                    let p = selectedNodes.pNodes.shift();;
                    for (let i = 0; i < textNodes.length; i++) {
                        if (p && p.contains(textNodes[i])) {
                            currNodesInP.push(textNodes[i]);
                            if (i === textNodes.length - 1) {
                                addNodesInP();
                            }
                        } else {
                            if (currNodesInP.length > 0) {
                                addNodesInP();
                            }
                            p = selectedNodes.pNodes.shift();
                            if (p && p.contains(textNodes[i])) {
                                currNodesInP.push(textNodes[i]);
                                if (i === textNodes.length - 1) {
                                    addNodesInP();
                                }
                            } else {
                                toRead.push(textNodes[i]);
                            }
                        }
                    }
                    resolve(toRead);
                    function addNodesInP() {
                        let nodes = [];
                        for (let j = 0; j < currNodesInP.length; j++) {
                            nodes.push(currNodesInP[j]);
                        }
                        currNodesInP = [];
                        toRead.push(nodes);
                    }
                });
            })
            .then(async (toRead) => {
                for (let i = 0; i < toRead.length; i++) {
                    let p = toRead[i];
                    if (!Array.isArray(p)) {
                        p = [toRead[i]];
                    }
                    await processSentencesForTextNodesInParagraph(p, op);
                }
                return Promise.resolve(textsToRead);
            })
            .catch((err) => {
            });
    }
    function parseAfterSelectionToPageEnd() {
        let lastSelectedTextNode = null;
        return new Promise((resolve) => {
            let selectedNodes = $(document.body).find('.nr-selected').get();
            (selectedNodes[selectedNodes.length - 1]).scrollIntoView({behavior: 'smooth', block: 'nearest', inline: 'start'});
            let checkNodeInView = setInterval(function() {
                if (pages.get(getCurrentIndex()).contains(selectedNodes[selectedNodes.length - 1])) {
                    clearInterval(checkNodeInView);
                    let textNodesInLastSelectedNode = googleDocsUtil.getTextNodesWithoutEmptyNodes(selectedNodes[selectedNodes.length - 1]);
                    lastSelectedTextNode = textNodesInLastSelectedNode[textNodesInLastSelectedNode.length - 1];
                    resolve();
                }
            }, 500);
        })
            .then(() => {
                return new Promise(async (resolve) => {
                    await reset();
                    await removeNRTags();
                    resolve();
                })
            }).then(() => {
                pageIndex = getCurrentIndex();
                return parsePage(pageIndex, null, lastSelectedTextNode);
            })
            .then(() => {
                let nrSelectionStart = document.querySelectorAll("nr-selection-start");
                Array.from(nrSelectionStart, node => {
                    node.remove();
                })
                return Promise.resolve(textsToRead);
            })
            .catch(err => {
            });
    }
    function parseSelectionToPageEnd() {
        return new Promise(async (resolve) => {
            await reset();
            await removeNRTags();
            document.normalize();
            resolve();
        })
            .then(() => {
                return new Promise((resolve) => {
                    hack();
                    let doc = googleDocsUtil.getGoogleDocument(true, false, true);
                    googleDocsUtil.removeSelectionOverlay();
                    resolve();
                });
            })
            .then(() => {
                return parseAfterSelectionToPageEnd();
            })
            .catch((err) => {
            });
    }
    function hack() {
        var selections = $(".kix-selection-overlay").get();
        var windowHeight = $(window).height();
        var index = binarySearch(selections, function(el) {
            var viewportOffset = el.getBoundingClientRect();
            if (viewportOffset.top < 120) return 1;
            if (viewportOffset.top >= windowHeight) return -1;
            return 0;
        })
        if (index != -1) {
            var validSelections = [selections[index]];
            var line = selections[index].parentNode;
            while (true) {
                line = findPreviousLine(line);
                if (line && $(line).hasClass("kix-lineview") && $(line.firstElementChild).hasClass("kix-selection-overlay")) validSelections.push(line.firstElementChild);
                else break;
            }
            line = selections[index].parentNode;
            while (true) {
                line = findNextLine(line);
                if (line && $(line).hasClass("kix-lineview") && $(line.firstElementChild).hasClass("kix-selection-overlay")) validSelections.push(line.firstElementChild);
                else break;
            }
            if (selections.length != validSelections.length) $(selections).not(validSelections).remove();
        }
        else {
            $(selections).remove();
        }
    }
    function binarySearch(arr, testFn) {
        var m = 0;
        var n = arr.length - 1;
        while (m <= n) {
            var k = (n + m) >> 1;
            var cmp = testFn(arr[k]);
            if (cmp > 0) m = k + 1;
            else if (cmp < 0) n = k - 1;
            else return k;
        }
        return -1;
    }
    function findPreviousLine(line) {
        return line.previousElementSibling ||
            line.parentNode.previousElementSibling && line.parentNode.previousElementSibling.lastElementChild ||
            $(line).closest(".kix-page").prev().find(".kix-page-content-wrapper .kix-lineview").get(-1)
    }
    function findNextLine(line) {
        return line.nextElementSibling ||
            line.parentNode.nextElementSibling && line.parentNode.nextElementSibling.firstElementChild ||
            $(line).closest(".kix-page").next().find(".kix-page-content-wrapper .kix-lineview").get(0)
    }
    async function processSentencesInParagraphs(page, op = 'all', lastSelectedNode = null) {
        let paragraphs = $(page).find('.kix-paragraphrenderer').get();
        for (let i = 0; i < paragraphs.length; i++) {
            try {
                if (lastSelectedNode) {
                    if (paragraphs[i].contains(lastSelectedNode)) {
                        await processSentencesAfterSelectionInParagraph(paragraphs[i], lastSelectedNode);
                        lastSelectedNode = null;
                    }
                } else {
                    await processSentencesInParagraph(paragraphs[i], op);
                }
            } catch (err) {
            }
        }
    }
    function processSentencesAfterSelectionInParagraph(p, lastSelectedNode, toReset) {
        return new Promise(async (resolve) => {
            let textsNodesInParagraph = googleDocsUtil.getTextNodesWithoutEmptyNodes(p);
            let textNodesAfterSelection = [];
            for (let i = 0; i < textsNodesInParagraph.length; i++) {
                if (lastSelectedNode.compareDocumentPosition(textsNodesInParagraph[i]) == Node.DOCUMENT_POSITION_FOLLOWING) {
                    textNodesAfterSelection.push(textsNodesInParagraph[i]);
                }
            }
            if (toReset) {
                await reset();
                await removeNRTags();
            }
            await processSentencesForTextNodesInParagraph(textNodesAfterSelection);
            resolve();
        })
            .catch((err) => {
            });
    }
    function processSentencesInParagraph(p, op = 'all') {
        return new Promise(async (resolve) => {
            let processedHtmlText = processHtmlText($(p).text()).trim();
            if (op !== 'convert') {
                let sentences = processSentencesByLength(getNlpSentences(processedHtmlText));
                await setSentences(p, sentences);
                resolve();
            } else {
                if (processedHtmlText) {
                    textsToRead.push(processedHtmlText);
                }
                resolve();
            }
        })
            .catch((err) => {
            });
    }
    async function processSentencesForTextNodesInParagraph(textNodes, op) {
        let processedHtmlText = '';
        for (let i = 0; i < textNodes.length; i++) {
            processedHtmlText += processHtmlText($(textNodes[i]).text());
        }
        processedHtmlText = processedHtmlText.trim();
        if (op === 'convert' && processedHtmlText) {
            textsToRead.push(processedHtmlText);
            return;
        }
        let sentences = processSentencesByLength(getNlpSentences(processedHtmlText));
        let copiedSentences = createDeepCopy(sentences);
        let index = 0;
        while (textNodes.length > 0) {
            let node = textNodes.shift();
            let res = await setSentencesHelper(node, copiedSentences, sentences, index);
            let nextIndex = res.nextIndex;
            let remainder = res.remainder;
            if (remainder) {
                textNodes.unshift(remainder);
            }
            if (index != nextIndex) {
                index = nextIndex;
            }
        }
    }
    async function setSentences(node, sentences) {
        try {
            node.normalize();
            let copiedSentences = createDeepCopy(sentences);
            let walk = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
            let n = null;
            let index = 0
            while (n = walk.nextNode()) {
                let res = await setSentencesHelper(n, copiedSentences, sentences, index);
                let nextIndex = res.nextIndex;
                if (index != nextIndex) {
                    index = nextIndex;
                }
            }
        } catch (err) {
        }
    }
    async function setSentencesHelper(textNode, sentences, originalSentences, index) {
        try {
            if (!($(textNode).text() && processHtmlText($(textNode).text()).trim() !== '')) {
                return {'nextIndex': index, 'remainder': null};
            }
            let i = 0
            let start = 0;
            let nodeText = $(textNode).text();
            let end = nodeText.length;
            let ttsSentence = sentences[index];
            let nextIndex = index;
            while (i < nodeText.length) {
                if (processHtmlText(nodeText[i]) === ttsSentence[0]) {
                    ttsSentence = ttsSentence.substring(1);
                    if (ttsSentence.length === 0) {
                        i++;
                        nextIndex++;
                        break;
                    }
                }
                i++;
            }
            end = i;
            sentences[index] = ttsSentence;
            let nrSentence = document.createElement('nr-sentence');
            $(nrSentence).addClass('nr-s' + textsToRead.length);
            if (isSelected) {
                $(nrSentence).addClass('nr-selected');
            }
            if (sentences[index].length === 0) {
                textsToRead.push(originalSentences[index]);
            }
            let remainder = textNode.splitText(end);
            if ($(remainder).text().trim() === '') {
                remainder = null;
            }
            $(textNode).wrap(nrSentence);
            return {nextIndex, remainder};
        } catch (err) {
        }
    }
    function getTexts() {
        return $(".kix-paragraphrenderer", this).get()
            .map(getInnerText)
            .filter(isNotEmpty);
    }
    function getSelectedText() {
        let doc = googleDocsUtil.getGoogleDocument();
        if (!selectionState) selectionState = {caret: doc.caret.index, prev: [], text: doc.selectedText};
        if (selectionState.caret != doc.caret.index) {
            selectionState.caret = doc.caret.index;
            selectionState.prev.push(selectionState.text);
            selectionState.text = doc.selectedText;
            selectionState.prev = selectionState.prev.filter(function(text) {
                let index = selectionState.text.indexOf(text);
                if (index != -1) selectionState.text = selectionState.text.slice(0, index) + selectionState.text.slice(index + text.length);
                return index != -1;
            })
        }
        return selectionState.text;
    }
    function getPages() {
        return pages;
    }
    function getPageIndex() {
        return pageIndex;
    }
}
