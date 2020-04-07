function Pdf() {
	let self = this;
	self.checkPDF = checkPDF;
	self.isOnlinePdf = isOnlinePdf;
	self.openOnlinePdfInPW = openOnlinePdfInPW;
	self.localInstructions = '<p>Warning: We noticed you want to read a pdf, to read pdf\'s please upload the file <a class="pdf-instr" target="_blank" href="https://www.naturalreaders.com/online/?action=upload">here</a> </p>';
	function init() {
		chrome.tabs.onCreated.addListener(function(tab) {
			injectPdfBarForOnlinePdf();
		});
		chrome.tabs.onActivated.addListener(async function(activeInfo) {
			injectPdfBarForOnlinePdf();
		});
		chrome.windows.onFocusChanged.addListener(function(windowId) {
			chrome.tabs.query({active: true, lastFocusedWindow: true}, async function(tabs) {
				if (tabs[0]) {
					injectPdfBarForOnlinePdf();
				}
			});
		});
		browser.webNavigation.onCommitted.addListener(async function(details) {
			if (details.transitionType !== 'auto_subframe' && details.transitionType !== 'manual_subframe') {
				injectPdfBarForOnlinePdf();
			}
		});
		chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
			if (self[request['fn']]) {
				self[request.fn](request, sender, sendResponse);
			}
		});
	}
	function getUrlInfo(tab) {
		let urlInfo = {origin: 'no origin', href: 'no href'};
		if (tab.url) {
			let url = new URL(tab.url);
			let origin = url.origin;
			let href = url.href;
			urlInfo = {origin, href}
		}
		return urlInfo;
	}
	function ifPDF() {
		return utils.getActiveTab().then(tab => {
			let urlInfo = getUrlInfo(tab);
			if (tab && tab.url && tab.url.match(/\.pdf$/)) {
				if (tab.url.match(/file(.)+.pdf$/)) {
					return Promise.resolve({pdf: true, type: 'local', tabId: tab['id'], urlInfo});
				} else {
					return Promise.resolve({pdf: true, type: 'online', tabId: tab['id'], urlInfo});
				}
			} else {
				return Promise.resolve({pdf: false, urlInfo});
			}
		});
	}
	function checkPDF() {
		return ifPDF()
			.then(res => {
				if (res.pdf) {
					return Promise.resolve({isPdf: true, tabId: res.tabId, urlInfo: res.urlInfo});
				} else {
					return Promise.resolve({isPdf: false, tabId: res.tabId, urlInfo: res.urlInfo});
				}
			})
	}
	function injectPdfBar(tabId) {
		chrome.tabs.sendMessage(tabId, {fn: "getHasPdfBar"}, function(hasPdfBar) {
			if (chrome.runtime.lastError) {
				chrome.tabs.executeScript(tabId, {file: "injected/nr-ext-pdf/nr-ext-pdf.js"}, () => {
					if (chrome.runtime.lastError) {
					}
					chrome.tabs.sendMessage(tabId, {fn: "injectPdfBar"});
				});
			}
			if (!hasPdfBar) {
				chrome.tabs.sendMessage(tabId, {fn: "injectPdfBar"});
			}
		});
	}
	function injectPdfBarForOnlinePdf() {
		return ifPDF()
			.then((res) => {
				if (res.pdf && res.type === 'online' && res.urlInfo && !res.urlInfo.href.includes('naturalreaders.com/online/')) {
					injectPdfBar(res.tabId);
				}
			})
			.catch((err) => {
			});
	}
	function isOnlinePdf() {
		return ifPDF()
			.then((res) => {
				if (res.pdf && res.type === 'online') {
					return Promise.resolve(true);
				} else {
					return Promise.resolve(false);
				}
			})
			.catch(err => {
			});
	}
	function openOnlinePdfInPW(request, sender, sendResponse) {
		chrome.tabs.create({url: 'https://www.naturalreaders.com/online/?rf=' + request.url});
	}
	init();
}
const pdfDoc = new Pdf();