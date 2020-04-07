chrome.contextMenus.removeAll();
chrome.contextMenus.create({
    id: 'NaturalReadersContext',
    title: "Read selection",
    contexts: ["selection"]
});
chrome.contextMenus.onClicked.addListener(function (info) {
    if (info.selectionText != '') {
        reader.readSelectionWithContextMenu(ttsText.processSentencesByLength(ttsText.getNlpSentences(info.selectionText)));
    }
});