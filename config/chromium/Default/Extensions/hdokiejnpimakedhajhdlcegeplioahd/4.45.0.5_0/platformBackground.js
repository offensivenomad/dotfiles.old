!function(n){var t;function a(e){var t=null,n=document.createElement("textarea");if(null!==e&&(n.value=e),n.style.display="block",n.style.position="absolute",n.style.left="-100px",n.style.right="-100px",n.style.height="1px",n.style.width="1px",document.body.appendChild(n),n.focus(),n.select(),t=document.execCommand("copy"),document.body.removeChild(n),!1===t)throw new Error("Failed copying to clipboard, document.execCommand() returned with false.")}function r(e){var t=60,n="undefined"!=typeof Preferences?parseInt(Preferences.get("clearClipboardSecsVal",t),10):t;a(e),n&&setTimeout(i,1e3*n)}function i(){a(" ")}n.logException=function(e){var t=e.message;e.stack&&(t+="\n"+e.stack),n.logError(t)},n.logError=function(e){e="Page: "+window.location.href+" Error: "+e;try{console.error(e),lpReportError("VAULT_4_0: "+e)}catch(e){}},n.getBackgroundInterface=(t=null,function(e){return null===t&&((e=e||{}).source=window,e.direct=!0,t=Interfaces.createInstance(Interfaces.BackgroundInterface,e)),t}),n.getUILanguage=function(){return"en-US"},n.fill=function(e){lpevent("m_mf"),fillaid(e,!0,"Icon Dropdown")},n.copyToClipboard=function(e){n.copyToClipboardWithoutPermissionCheck(e)},n.copyToClipboardWithoutPermissionCheck=function(e){try{r(e)}catch(e){n.logException(e)}}}(LPPlatform),function(l,e){l.getFavicon=function(e){e.callback&&e.callback(null)},l.onAuthRequired=function(e){return!1},l.openLogin=function(){sendLpEvent("login_viewed"),LPContentScriptFeatures.react_login?openURL(getchromeurl("webclient-tab.html")):l.openTabDialog("loginSimple")},l.once=function(e,t,n){if(e)var a=e(function(){a(),t.apply(n,arguments)})},l.getBigIcons=function(n,e){var t=(e=e||"big")+"icons",a=opendb();if(createDataTable(a),a){var r=function(e,t){n(0<t.rows.length&&null!==t.rows.item(0).data?t.rows.item(0).data:"")};if(g_indexeddb){var i={rows:{item:function(e){return this[e]},length:0}};a.transaction("LastPassData","readonly").objectStore("LastPassData").openCursor(IDBKeyRange.only(db_prepend(g_username_hash)+"_"+t)).onsuccess=function(e){var t=e.target.result;t?(i.rows[i.rows.length]=t.value,i.rows.length++,t.continue()):r(null,i)}}else a.transaction(function(e){e.executeSql("SELECT * FROM LastPassData WHERE username_hash=? AND type=?",[db_prepend(g_username_hash),t],r,function(e,t){console_log(t)})})}},l.saveBigIcons=function(t,e){var n=(e=e||"big")+"icons",a=opendb();createDataTable(a),a&&(g_indexeddb?a.transaction("LastPassData","readwrite").objectStore("LastPassData").put({username_hash:db_prepend(g_username_hash),type:n,data:t,usertype:db_prepend(g_username_hash)+"_"+n}):a.transaction(function(e){e.executeSql("REPLACE INTO LastPassData (username_hash, type, data) VALUES (?, ?, ?)",[db_prepend(g_username_hash),n,t],function(e,t){console_log("server.js : inserted")},function(e,t){console_log(t)})}))},l.export=function(e,t){l.saveFile(e,t,function(e){e&&(g_export_output=t,openURL(getchromeurl("export.html")))})},l.saveFile=function(e,t,n){try{var a=new Blob([t],{type:"text/csv;charset=UTF-8"}),r=window.URL.createObjectURL(a),i=document.createElement("a");i.href=r,i.download=e,i.click(),URL.revokeObjectURL(r),n(null)}catch(e){l.logException(e),n(e)}},l.updateBigIcons=function(){};var t=function(e,t){for(var n in e){var a=t[n];a&&(a.group=e[n])}},u,f,n,a,b,h,i,m,v;l.refreshGroupNames=function(e){e&&(t(e.sites,g_sites),t(e.notes,g_securenotes),t(e.applications,g_applications))},l.useDialogWindows=function(){return Preferences.get("htmlindialog")},l.extendSendImproveParams=function(e,t){t()},u={},f=function(e,t){return function(){e.apply(this,arguments),t.apply(this,arguments)}},l.openTabDialog=function(t,n){var e={createAccountSimple:!0,siteTutorial:!0},a=t+(n?"-"+JSON.stringify(n):""),r=u[a];if(r)r.activate();else{var i={dialogWindow:l.useDialogWindows()&&!(n&&n.virtualKeyboard)},o={url:getchromeurl("tabDialog.html?dialog="+t),loadHandler:function(e){e.getTop().LPTabDialog.openDialog(t,n,i),u[a]=e},closeHandler:function(){delete u[a]},tabId:n&&n.tabId?n.tabId:void 0};if(o.tabId)l.navigateTab(o);else if(i.dialogWindow&&!e[t]){var c=Preferences.get("dialogSizePrefs"),s=c[t];o.features={height:s?s.height:600,width:s?s.width:800,left:s?s.left:0,top:s?s.top:0},o.features.width>window.screen.availWidth&&(o.features.width=window.screen.availWidth,o.features.left=0),o.features.height>window.screen.availHeight&&(o.features.height=window.screen.availHeight,o.features.top=0),o.closeHandler=f(o.closeHandler,function(e){c[t]={height:e.outerHeight,width:e.outerWidth,left:e.screenLeft||e.screenX,top:e.screenTop||e.screenY},Preferences.set("dialogSizePrefs",c),delete u[a]}),l.openDialogWindow(o)}else if(e[t])l.openTab(o);else switch(Preferences.get("openpref")){case"tabs":l.openTab(o);break;case"windows":l.openWindow(o);break;case"same":l.openSame(o)}}},l.stringifyFeatures=function(e){var t=[];for(var n in e)t.push(n+"="+e[n]);return t.join(",")},l.doAjax=function(e){LPServer.ajax(e)},l.ajax=function(e){isOffline()?e.error&&e.error(null,null,"offline"):l.doAjax(e)},l.isEdge=function(){return is_edge()},l.copyDataIfEdge=function(e){return l.isEdge()&&void 0!==e?JSON.parse(JSON.stringify(e)):e},l.setUserPreference=(n=l.setUserPreference,function(e,t){n(e,t),g_userprefs_changed[e]=t}),l.setGlobalPreference=(a=l.setGlobalPreference,function(e,t){a(e,t),g_gblprefs_changed[e]=t}),l.writePreferences=function(){lpWriteAllPrefs()},l.closePopovers=function(){},l.activeOverlayTab=void 0,l.showModalOverlay=function(t){"function"==typeof t&&l.getCurrentTabDetails(function(e){e&&e.tabURL&&e.tabURL.indexOf(getchromeurl(""))<0&&(l.activeOverlayTab=e.tabID,t(e.tabID))})},l.removeModalOverlay=function(e){},l.hideYoureAlmostDoneMarketingOverlay=function(e){},b={},h={},i={},m={},v={},e.LPTabs={get:function(e){if(e.interface){var t=[];for(var n in m)m[n].tabDetails.interfaceName===e.interface&&t.push(m[n]);return e.callback&&e.callback(t),t}if(void 0!==e.tabID){var a=m[e.tabID];if(a)return e.callback&&e.callback(a),a;if(e.callback){var r=i[e.tabID];(r=r||(i[e.tabID]=[])).push(e.callback)}}return null}},l.getUnavailablePreferences=function(){return{openpopoverHk:!1,pollServerVal:g_nopoll,storeLostOTP:"0"===g_prefoverrides.account_recovery,showvault:g_hidevault||g_hideshowvault,homeHk:g_hidevault||g_hideshowvault,saveallHk:g_hidesaedhotkey,searchHk:g_hidesearch,usepopupfill:!g_offer_popupfill,recentUsedCount:g_hiderecentlyusedlistsize,searchNotes:g_hidenotes,idleLogoffVal:!(g_is_win||g_is_mac||g_is_linux),enablenamedpipes:lppassusernamehash||!(g_is_win||g_is_mac||g_is_linux)||is_chrome_portable(),enablenewlogin:!0}},l.getWindowIDs=function(){var e={};for(var t in m)m[t].tabDetails.windowID&&(e[m[t].tabDetails.windowID]=!0);return Object.keys(e)},l.getWindowTabDetails=function(e){var t=[];for(var n in m){var a=m[n];a.tabDetails.windowID===e&&t.push(a.tabDetails)}return t},l.initializeRequestFramework=function(o){var c=null,s=o.tabDetails||{},l=LPMessaging.getNewMessageSourceID(),u=!1,f=o.frameIdentity,n=!1,d=function(e){try{var t=!n;return t?(e.frameID=l,o.sendContentScript(e)):t}catch(e){return!1}},p=function(e){return d({type:"backgroundResponse",data:e})},a=function(e){if(c=m[s.tabID],u=e.top,void 0!==s.tabID&&(u&&(h[s.tabID]=l),e.frameIdentity&&(f=s.tabID+"-"+e.frameIdentity)),d({type:"initialization",data:{tabID:s.tabID,frameID:l,topFrameID:h[s.tabID],request:e}}),e.extendFrame){var t=v[f].frameID,n=b[t];b[t]=function(e){d(e),n(e)}}else b[l]=d;if(e.interfaceName&&Interfaces.hasOwnProperty(e.interfaceName)){s.interfaceName||(s.interfaceName=e.interfaceName);var a=function(e){return LPMessaging.makeRequest(d,{type:"contentScriptRequest",sourceFrameID:0,data:e},p)},r=Interfaces.createInstance(Interfaces[e.interfaceName],{instance:e.extendFrame?v[f].interface:null,direct:!1,context:o.context||"background",requestFunction:a});if(f){var i=v[f];i&&i.frameID!==l&&i.disconnect(),v[f]={interface:r,disconnect:g,frameID:l}}"number"!=typeof s.tabID&&!s.tabID||e.interfaceName!==s.interfaceName||e.extendFrame||(c&&!u||(c&&c.disconnect(),c=m[s.tabID]=new LPTab(s)),c.addFrame(r,{topWindow:u,frameID:l,contentScriptRequester:a,childFrameCount:e.childFrameCount},g)),o.interfaces&&o.interfaces[e.interfaceName]&&o.interfaces[e.interfaceName](r),o.callback&&o.callback(r)}else c=c||(m[s.tabID]=new LPTab(s))},e=Raven.wrap(function(e){switch(e.type){case"backgroundRequest":LPMessaging.handleRequest(Interfaces.BackgroundInterface,e.data,p,{additionalArguments:{tabURL:s.tabURL,tabID:s.tabID,windowID:s.windowID,frameID:l,top:u}});break;case"contentScriptRequest":case"contentScriptResponse":if(0===e.frameID)LPMessaging.handleResponse(e.data);else if(e.frameID){var t=b[e.frameID];t&&t(e)}break;case"initialize":a(e.data);break;case"disconnect":g();break;case"initialized":u&&i[s.tabID]&&(i[s.tabID].forEach(function(e){e(c)}),delete i[s.tabID])}}),g=function(){if(!n){n=!0,delete b[l],delete v[f],h[s.tabID]===l&&delete h[s.tabID];var e=m[s.tabID];e&&(e.removeFrame(l),e.isEmpty()&&delete m[s.tabID]),o.onDisconnect&&o.onDisconnect()}};return{frameID:l,requestHandler:e,disconnectHandler:g}}}(LPPlatform,this);
//# sourceMappingURL=sourcemaps/platformBackground.js.map
