var errorMsgs = {
  'ERR_SUB_NOT_FOUND': 'Looks like you don\'t have an active Premium subscription. ' +
    'Please check to see if you already have Plus or an active subscription',
  'ERR_NO_VALID_SRC': 'Looks like you don\'t have an active payment method attached to your account. ' +
    'Please update your card information and try again.',
  'ERR_PAYMENT_FAILED': 'There was an issue while charging payment. If the error persists, please update ' +
    'your card information and try again.'
};
let auth = {
  windowId: null,
  isProcessing: false,
  tabId: null,
  init: function() {
    chromeRuntimeMsgExternal.setFilter('authLogin', this.loginHelper);
    chromeRuntimeMsgExternal.setFilter('authLogout', this.logoutHelper);
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
      if (request.fn in auth) {
        auth[request.fn](request, sender, sendResponse);
      }
    });
    chrome.storage.sync.get(['userInfo'], (result) => {
      let id = result.userInfo ? (result.userInfo.id ? result.userInfo.id : null) : null;
      if (id) {
        let userInfo = {"email": result.userInfo.email, "id": id};
        this.getBillingInfo({id: id})
          .then(license => {
            if (license) {
              userInfo["license"] = license.licNum.toString();
              userInfo['licNum'] = license.licNum;
              userInfo["licCode"] = license.licCode;
            } else {
              userInfo["license"] = "0";
              userInfo['licNum'] = 0;
              userInfo["licCode"] = '0';
            }
            widget.setWidgetSetting({key: 'userInfo', value: userInfo});
            chrome.storage.sync.get(['userInfo'], function(result) {
            })
          });
      }
    })
  },
  currentExtId: -1,
  getCurrentExtId: function() {
    return extension.activeTabId;
  },
  login: function(request, sender, sendResponse) {
    this.currentExtId = this.getCurrentExtId();
    this.createAuthTab('login');
  },
  logout: function(request, sender, sendResponse) {
    this.currentExtId = this.getCurrentExtId();
    this.createAuthTab('logout');
  },
  signup: function(request, sender, sendResponse) {
    this.currentExtId = this.getCurrentExtId();
    this.createAuthTab('signup');
  },
  upgrade: function(request, sender, sendResponse) {
    let userEmail = widget.settings.userInfo.email;
    let userLicCode = widget.settings.userInfo.licCode;
    let liccodeNew = '6005';
    if (userLicCode === '6006') {
      liccodeNew = '6008';
    }
    data = {liccodeCurr: userLicCode, liccodeNew: liccodeNew, email: userEmail, errors: errorMsgs};
    alertHandler.displayAlertMessage('UPGRADE_DIALOG', data);
  },
  createAuthTab: function(op) {
    auth.isProcessing = true;
    let url = '';
    if (op === 'login') {
      url = 'https://www.naturalreaders.com/login-service/login?redir=ext-login&v2=true';
    } else if (op === 'logout') {
      url = 'https://www.naturalreaders.com/login-service/extension/loggedout';
    } else if (op === 'signup') {
      url = 'https://www.naturalreaders.com/login-service/signup?redir=ext-login'
    }
    chrome.tabs.create({
      url: url,
      active: false
    }, function(tab) {
      let tabID = tab.id;
      let width = 400;
      let height = 700;
      let left = null;
      let top = null;
      auth.tabId = tabID;
      try {
        left = Math.round((screen.width / 2) - (width / 2));
        top = Math.round((screen.height / 2) - (height / 2));
      } catch (err) {
      }
      chrome.windows.create({
        tabId: tabID,
        type: 'popup',
        focused: true,
        width: width,
        height: height,
        left: left,
        top: top
      }, function(window) {
        auth.windowId = window.id;
        chrome.windows.onFocusChanged.addListener(function checkFocus(windowId) {
          if (window.id !== windowId && !auth.isProcessing) {
            chrome.windows.remove(window.id, () => void chrome.runtime.lastError);
            chrome.windows.onFocusChanged.removeListener(checkFocus);
          }
        });
        chrome.windows.onRemoved.addListener(function checkRemove(removedWindowId) {
          if (this.windowId === removedWindowId) {
            auth.isProcessing = false;
            chrome.windows.onRemoved.removeListener(checkRemove);
          }
        })
      });
      if (op === 'login') {
        chrome.tabs.executeScript(tabID, {
          code: "let user = localStorage.getItem('NAPersonal-userinfo');" +
            "let license = localStorage.getItem('pw-license');" +
            "chrome.runtime.sendMessage({ fn: 'loginHelper', tabID:" + tabID + ", user:user, license:license });"
        });
      } else if (op === 'logout') {
        chrome.tabs.executeScript(tabID, {
          code:
            "localStorage.setItem('NAPersonal-userinfo', JSON.stringify(null));" +
            "localStorage.setItem('NAPersonal-isLog', JSON.stringify(0));" +
            "localStorage.setItem('pw-license', JSON.stringify({num: 0, expiryDate: 'expired', isAutoRenew: false, isExpired: true, planName: 'Free Plan'}));" +
            "chrome.runtime.sendMessage({ fn: 'logoutHelper', tabID:" + tabID + "});"
        });
      } else if (op === 'signup') {
        chrome.tabs.executeScript(tabID, {
          code:
            "chrome.runtime.sendMessage({ fn: 'signupHelper', tabID:" + tabID + "});"
        });
      }
    });
  },
  signupHelper: function(request, sender, sendResponse) {
    let signupTabID = request.tabID;
    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
      if (tabId === signupTabID) {
        if (changeInfo.url != undefined) {
          if (changeInfo.url.includes("https://www.naturalreaders.com/login-service/login?redir=ext-login")) {
            chrome.tabs.executeScript(signupTabID, {
              code:
                "chrome.runtime.sendMessage({ fn: 'loginHelper', tabID:" + signupTabID + ", user:null, license:null });"
            });
          }
        }
      }
    });
  },
  loginHelper: function(request, sender, sendResponse) {
    let loginTabID = request.tabID;
    let user;
    if (request && request.user && typeof request.user === 'string')
      user = JSON.parse(request.user);
    if (!user) {
      chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
        if (tabId === loginTabID) {
          if (changeInfo.url != undefined) {
            if (changeInfo.url.includes("https://www.naturalreaders.com/login-service/auth-password?email=")) {
              chrome.tabs.executeScript(loginTabID, {
                code:
                  "localStorage.setItem('NAPersonal-userinfo', JSON.stringify(null));" +
                  "localStorage.setItem('NAPersonal-isLog', JSON.stringify(0));" +
                  "localStorage.setItem('pw-license', JSON.stringify(null));"
              });
            }
            if (changeInfo.url.includes('https://www.naturalreaders.com/login-service/extension/loggedin')) {
              chrome.tabs.executeScript(loginTabID, {
                code:
                  "let ssoUser = localStorage.getItem('NAPersonal-userinfo');" +
                  "chrome.runtime.sendMessage({ fn: 'loginHelper', tabID:" + loginTabID + ", user:ssoUser, alreadyLoggedIn:true });"
              });
            }
          }
        }
      });
    } else {
      let userInfo = {};
      userInfo["email"] = user.userid;
      userInfo["id"] = user.id;
      if (!request['alreadyLoggedIn']) {
        chrome.tabs.executeScript(loginTabID, {
          code: "window.location.replace('https://www.naturalreaders.com/login-service/extension/loggedin');"
        });
      }
      let license = request.license ? JSON.parse(request.license) : null;
      if (!license || license.num == '0') {
        this.getBillingInfo({id: user.id})
          .then(license => {
            if (license) {
              userInfo["licNum"] = license.licNum;
              userInfo["license"] = license.licNum.toString();
              userInfo["licCode"] = license.licCode;
            } else {
              userInfo["licNum"] = 0;
              userInfo["license"] = "0";
              userInfo["licCode"] = "0";
            }
            widget.setWidgetSetting({key: 'userInfo', value: userInfo});
            widget.setWidgetSetting({key: 'loggedIn', value: 1});
            if (userInfo.licNum != 0) {
              if (reader.tts && reader.tts['clearBlobsWithLimitError']) {
                reader.tts.clearBlobsWithLimitError();
              }
            }
            chrome.tabs.sendMessage(this.currentExtId, {'fn': 'setLoggedInUI'});
            auth.isProcessing = false;
          });
      } else {
        userInfo["license"] = license.num.toString();
        userInfo["licNum"] = license.licNum;
        userInfo["licCode"] = license.licCode;
        widget.setWidgetSetting({key: 'userInfo', value: userInfo});
        widget.setWidgetSetting({key: 'loggedIn', value: 1});
        if (userInfo.licNum != 0) {
          if (reader.tts && reader.tts['clearBlobsWithLimitError']) {
            reader.tts.clearBlobsWithLimitError();
          }
        }
        let tabIdToUpdate = this.currentExtId && this.currentExtId > 0 ? this.currentExtId : extension.activeTabId;
        chrome.tabs.sendMessage(tabIdToUpdate, {'fn': 'setLoggedInUI'});
        auth.isProcessing = false;
        sendResponse({ok: true});
      }
    }
  },
  logoutHelper: function(request, sender, sendResponse) {
    auth.isProcessing = false;
    let userInfo = {'licNum': 0, 'license': "0", 'email': 'user@naturalreaders.com', 'id': null, 'licCode': '0'};
    widget.setWidgetSetting({key: 'userInfo', value: userInfo});
    widget.setWidgetSetting({key: 'loggedIn', value: 0});
    let tabIdToUpdate = this.currentExtId && this.currentExtId > 0 ? this.currentExtId : extension.activeTabId;
    chrome.tabs.sendMessage(tabIdToUpdate, {'fn': 'setLoggedOutUI'});
    sendResponse({ok: true});
  },
  getBillingInfo: function(request) {
    if (!request || !request.id) {
      return null;
    }
    const params = {
      id: request['id'],
      provider: 'pw'
    };
    const headers = {
      'Content-Type': 'application/json',
      'method': 'GET',
      'mode': 'cors'
    };
    let url = new URL('https://pweb.naturalreaders.com/bill/billing/pw');
    url.search = new URLSearchParams(params)
    return fetch(url, headers)
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error('Something went wrong.');
        }
      })
      .then(res => {
        if (res['rst'] == 'OK') {
          return {
            licNum: res['info']['planDefine']['licNum'],
            licCode: res['info']['planDefine']['plan']
          }
        } else {
          return null;
        }
      })
      .catch(err => {
        return null;
      });
  }
}
auth.init();
