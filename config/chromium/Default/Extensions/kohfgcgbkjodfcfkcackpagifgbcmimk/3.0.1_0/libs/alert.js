function showAlertPremTtsLimit(windowId, data = {}) {
    swal.fire({
        title: 'You\'ve reached the 20 minute daily limit for Premium Voices.',
        type: 'warning',
        text: 'Please upgrade to Paid Plans or use free voices.',
        width: 512,
        heightAuto: false,
        customClass: 'swal-tts',
        showCloseButton: true,
        showCancelButton: true,
        cancelButtonText: 'Use Free Voices',
        confirmButtonText: 'Upgrade Now',
        reverseButtons: true,
        footer: '<p style="text-align:center">Need help with troubleshooting? Contact us at <a style="color:#1b7df9" href="mailto:support@naturalreaders.com">support@naturalreaders.com</a></p>'
    }).then((result) => {
        if (result.value) {
            chrome.runtime.sendMessage({fn: 'showUpgradePage', type: 'general'});
        } else if (result.dismiss === swal.DismissReason.cancel) {
            chrome.runtime.sendMessage({fn: 'setWidgetSetting', key: 'voiceType', value: 'free'});
        }
        closeAlertWindow(windowId);
    });
}
function showAlertPlusTtsLimit(windowId, data = {}) {
    swal.fire({
        title: 'You\'ve reached the 5 minute daily limit for Plus Voices.',
        type: 'warning',
        width: 512,
        heightAuto: false,
        customClass: 'swal-tts',
        showCloseButton: true,
        showCancelButton: true,
        cancelButtonText: 'Listen to Demo',
        confirmButtonText: 'Upgrade Now',
        reverseButtons: true,
        footer: '<p style="text-align:center">Need help with troubleshooting? Contact us at <a style="color:#1b7df9" href="mailto:support@naturalreaders.com">support@naturalreaders.com</a></p>'
    }).then((result) => {
        if (result.value) {
            let license = data.license ? data.license : 0;
            if (license < 12) {
                chrome.runtime.sendMessage({fn: 'showUpgradePage', type: 'general'});
            } else {
                chrome.runtime.sendMessage({fn: 'showUpgradeDialog'});
            }
        } else if (result.dismiss === swal.DismissReason.cancel) {
            chrome.runtime.sendMessage({fn: 'showPlusVoiceDemoPage'});
        }
        closeAlertWindow(windowId);
    });
}
function showUpgradeDialog(windowId, data = {}) {
    var showDemo = true;
    chrome.runtime.sendMessage({fn: 'previewUpgradeReq', data: data}, (res) => {
        if (res.error != '') {
            showDemo = false;
            let err = "Something went wrong...";
            if (data.errors[res.error] != undefined) {
                err = data.errors[res.error];
            }
            swal.update({
                type: 'error',
                title: 'Upgrade Error',
                html: err,
                cancelButtonText: 'Close',
                showConfirmButton: false
            })
        } else {
            const price = (res.resp / 100).toFixed(2);
            swal.update({
                html: "<p style=\"font-size:12px\"> (You only pay the difference in price) </p>" +
                    "<p>Plus includes all the features of Premium as well as unlimited access to all 50 Plus Voices.<p>" +
                    "<br> <b>Price: $" + price + " USD<b>",
            })
        }
    });
    swal.fire({
        type: 'question',
        title: 'Upgrade from Premium to Plus?',
        html: "<p style=\"font-size:12px\"> (You only pay the difference in price) </p>" +
            "<p>Plus includes all the features of Premium as well as unlimited access to all 50 Plus Voices.<p>" +
            "<br> <b>Price: Calculating...<b>",
        width: 512,
        heightAuto: false,
        customClass: 'swal-upgrade',
        showCloseButton: true,
        showCancelButton: true,
        cancelButtonText: 'Listen To Demo',
        confirmButtonText: 'Upgrade Now',
        confirmButtonColor: '#1A7DF9',
    }).then((result) => {
        if (result.value) {
            chrome.runtime.sendMessage({fn: 'sendUpgradeReq', data: data}, (res) => {
                if (res.error != '') {
                    let err = "Something went wrong...";
                    if (data.errors[res.error] != undefined) {
                        err = data.errors[res.error];
                    }
                    swal.fire({
                        type: 'error',
                        title: 'Upgrade Error',
                        text: err,
                        width: 512,
                        heightAuto: false,
                        customClass: 'swal-upgrade',
                        showCloseButton: true,
                        confirmButtonText: 'Close',
                        confirmButtonColor: '#4caf50'
                    }).then(result => {
                        closeAlertWindow(windowId)
                    });
                } else {
                    swal.fire({
                        type: 'success',
                        title: 'Upgrade Complete!',
                        text: 'You have successfully been upgraded to the Plus plan!',
                        width: 512,
                        heightAuto: false,
                        customClass: 'swal-custom',
                        showCloseButton: true,
                        confirmButtonText: 'Close',
                        confirmButtonColor: '#4caf50'
                    }).then(result => {
                        closeAlertWindow(windowId)
                    });
                }
            });
        } else if (result.dismiss === swal.DismissReason.cancel) {
            if (showDemo) {
                chrome.runtime.sendMessage({fn: 'showPlusVoiceDemoPage'});
            }
            closeAlertWindow(windowId);
        } else {
            closeAlertWindow(windowId);
        }
    });
}
function showAlertGeneric(windowId, data = {}) {
    swal.fire({
        type: 'error',
        title: 'Something went wrong...',
        text: 'Please reload the extension or contact us.',
        width: 512,
        heightAuto: false,
        customClass: 'swal-custom',
        showCloseButton: true,
        showCancelButton: true,
        cancelButtonText: 'Contact Us',
        confirmButtonText: 'Reload',
        confirmButtonColor: '#4caf50',
        cancelButtonColor: '#1b7df9',
        reverseButtons: true,
        footer: '<p style="text-align:center">Need help with troubleshooting? Contact us at <a style="color:#1b7df9" href="mailto:support@naturalreaders.com">support@naturalreaders.com</a></p>'
    }).then((result) => {
        if (result.value) {
            chrome.runtime.sendMessage({fn: 'reloadExtension'});
        } else if (result.dismiss === swal.DismissReason.cancel) {
            chrome.runtime.sendMessage({fn: 'contactUs'});
        }
        closeAlertWindow(windowId);
    });
}
function showGoogleDrivePreviewWarning(windowId, data = {}) {
    swal.fire({
        type: 'warning',
        title: 'Reading in Preview Mode',
        text: 'Note that highlighting of the currently being read sentence and word and auto-tracking text are not supported in the preview mode. Please open and read the document in Google Docs.',
        width: 512,
        heightAuto: false,
        customClass: 'swal-custom',
        showCloseButton: true,
        showCancelButton: true,
        cancelButtonText: 'I don\'t mind. Continue to read.',
        confirmButtonText: 'Cancel',
        confirmButtonColor: '#4caf50',
        reverseButtons: true
    }).then(async (result) => {
        if (result.dismiss === swal.DismissReason.cancel) {
            chrome.runtime.sendMessage({fn: 'setShouldCheckForPreviewMode', val: false});
            chrome.runtime.sendMessage({fn: 'play', caller: 'google drive preview warning'});
            closeAlertWindow(windowId);
        } else {
            closeAlertWindow(windowId);
        }
    });
}
function showAlertUpdateAvailable(windowId, data = {}) {
    swal.fire({
        type: 'warning',
        title: 'Update',
        text: 'An update is available. Please reload the extension by pressing the "Reload" button down below.',
        width: 512,
        heightAuto: false,
        customClass: 'swal-custom',
        showCloseButton: true,
        confirmButtonText: 'Reload',
        confirmButtonColor: '#4caf50',
        footer: '<p style="text-align:center">Need help with troubleshooting? Contact us at <a style="color:#1b7df9" href="mailto:support@naturalreaders.com">support@naturalreaders.com</a></p>'
    }).then((result) => {
        closeAlertWindow(windowId);
        chrome.storage.sync.clear(function() {
            if (chrome.runtime.lastError) {
            }
        });
        chrome.runtime.sendMessage({fn: 'reloadExtension'});
    });
}
function showAlertNoFreeVoices(windowId, data = {}) {
    swal.fire({
        type: 'error',
        title: 'No Free Voices',
        text: 'Your Google Chrome browser seems to have no free voices. Please update the browser or use Premium Voices only.',
        width: 512,
        heightAuto: false,
        customClass: 'swal-custom',
        showCloseButton: true,
        confirmButtonText: 'OK',
        confirmButtonColor: '#4caf50',
        footer: '<p style="text-align:center">Need help with troubleshooting? Contact us at <a style="color:#1b7df9" href="mailto:support@naturalreaders.com">support@naturalreaders.com</a></p>'
    }).then((result) => {
        closeAlertWindow(windowId);
    });
}
function showAlertPageNotReadable(windowId) {
    swal.fire({
        type: 'error',
        title: 'Page Not Readable',
        text: 'Please try with another page',
        width: 512,
        heightAuto: false,
        customClass: 'swal-custom',
        showCloseButton: true,
        confirmButtonText: 'OK',
        confirmButtonColor: '#4caf50',
        footer: '<p style="text-align:center">Need help with troubleshooting? Contact us at <a style="color:#1b7df9" href="mailto:support@naturalreaders.com">support@naturalreaders.com</a></p>'
    }).then((result) => {
        closeAlertWindow(windowId);
    });
}
function showAlertPdf(windowId, data = {}) {
    swal.fire({
        type: 'warning',
        title: 'We noticed that you want to read a pdf, please upload the file.',
        width: 512,
        heightAuto: false,
        customClass: 'swal-pdf',
        showCloseButton: true,
        showCancelButton: true,
        cancelButtonText: 'Cancel',
        confirmButtonText: 'Upload File',
        confirmButtonColor: '#4caf50',
        reverseButtons: true,
        footer: '<p style="text-align:center">Need help with troubleshooting? Contact us at <a style="color:#1b7df9" href="mailto:support@naturalreaders.com">support@naturalreaders.com</a></p>'
    }).then((result) => {
        if (result.value) {
            chrome.runtime.sendMessage({fn: 'showUploadPage'});
        }
        closeAlertWindow(windowId);
    });;
}
function showAlertMp3(windowId, data = {}) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({fn: 'setConvertAlertWindowId', windowId: windowId});
        resolve();
    }).then(result => {
        return swal.fire({
            text: "To download the audio, you will be redirected to NaturalReader Online. You can edit the text there before converting. Click the mp3 icon to review the conversion settings, then 'Convert'.",
            width: 512,
            heightAuto: false,
            html: "<p>To download the audio, you will be redirected to NaturalReader Online. You can edit the text there before converting. Click the mp3 icon to review the conversion settings, then 'Convert'.</p>" +
                "<input id='notShowMp3Alert' type='checkbox'> Do not show this message again",
            customClass: 'swal-convert',
            showCloseButton: true,
            showCancelButton: true,
            cancelButtonText: 'Cancel',
            confirmButtonText: 'OK',
            confirmButtonColor: '#4caf50',
            reverseButtons: true
        })
    }).then((result) => {
        if (document.getElementById('notShowMp3Alert').checked) {
            storage.set({'notShowMp3Alert': true});
        }
        if (result.value) {
            return new Promise((resolve) => {
                chrome.runtime.sendMessage({fn: 'setShouldConvert', val: true});
                resolve();
            }).then(result => {
                closeAlertWindow(windowId);
            });
        } else {
            closeAlertWindow(windowId);
        }
    });
}
function closeAlertWindow(windowId) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({fn: 'closeAlertWindow', windowId: windowId}, function() {
            if (chrome.runtime.lastError) {
            }
            resolve();
        });
    })
        .catch((err) => {
        });
}
