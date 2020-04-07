var e=[];e.push(["_setAccount","UA-92398359-4"]),e.push(["_set","page","/chrome/"+chrome.runtime.getManifest().version+"/background"]),e.push(["_trackPageview"]),function(){var e=document.createElement("script");e.type="text/javascript",e.async=!0,e.src="https://ssl.google-analytics.com/ga.js";var t=document.getElementsByTagName("script")[0];t.parentNode.insertBefore(e,t)}();class App{static start(e,t){e.text&&e.tabId?(App.speakState&&chrome.tabs.sendMessage(App.speakTabId,{type:"CONTENT_SPEAK_STOP"}),App.speakState="play",App.speakTabId=e.tabId,chrome.tabs.detectLanguage(App.speakTabId,function(s){chrome.tts.stop(),chrome.tts.speak(e.text,Object.assign({lang:s,rate:1.2},e.options||{}),t)})):console.error("text or tabId not found")}static pause(e){App.speakState="pause",chrome.tts.pause()}static resume(e){App.speakState="play",chrome.tts.resume()}static stop(e){App.speakState=null,chrome.tts.stop()}static submitArticle(e,t){const s=new XMLHttpRequest;s.open("POST","https://clearly.lesslab.net/api/submitArticle"),s.setRequestHeader("Content-Type","application/json"),s.onload=function(){try{200===s.status&&t&&t(null,JSON.parse(s.responseText))}catch(e){t&&t(e)}},s.send(JSON.stringify(e))}static submitFeedback(e,t,s){const a=new XMLHttpRequest;a.open("POST","https://clearly.lesslab.net/api/submitFeedback"),a.setRequestHeader("Content-Type","application/json"),a.onload=function(){try{200===a.status&&s&&s(null,JSON.parse(a.responseText))}catch(e){s&&s(e)}},a.send(JSON.stringify(Object.assign(e,{feedback:t})))}static updateIcon(e,t){e=e||"default",chrome.browserAction.setIcon({path:{16:`/assets/icons/${e}/ic_16.png`,32:`/assets/icons/${e}/ic_32.png`,48:`/assets/icons/${e}/ic_48.png`,128:`/assets/icons/${e}/ic_128.png`},tabId:t})}static translate(e,t,s){let a=App.hashCode(JSON.stringify({text:e,lang:t})),r=App.translateResults.get(a);if(r)return s&&s(null,r);const n=new XMLHttpRequest;n.open("GET",`https://translate.googleapis.com/translate_a/single?dt=t&dt=bd&dt=qc&dt=rm&client=gtx&sl=auto&tl=${t}&q=${encodeURIComponent(e)}&hl=en-US&dj=1&tk=${Math.random().toString().substr(2,7)}.${Math.random().toString().substr(2,7)}`),n.setRequestHeader("Content-Type","application/x-www-form-urlencoded"),n.onload=function(){try{if(200===n.status)return r=JSON.parse(n.responseText),App.translateResults.set(a,r),s&&s(null,r)}catch(e){return s&&s(e)}s(new Error("unknown error with http request"))},n.onerror=s,n.onabort=s,n.send(null)}static hashCode(e){var t,s=0;if(0===e.length)return s;for(t=0;t<e.length;t++)s=(s<<5)-s+e.charCodeAt(t),s|=0;return s}static toggle(){chrome.tabs.query({active:!0,currentWindow:!0},function(e){e[0]&&e[0].url.startsWith("http")&&chrome.tabs.executeScript(null,{code:"try{App.toggle()}catch(err){console.debug('ENABLED IREAD FAILED', err)}"})})}static registerChromeHandlers(){App.translateResults=new LRUMap(200),chrome.tts.isSpeaking(e=>{e&&e.length&&chrome.tts.stop()}),chrome.commands.onCommand.addListener(function(e){switch(e){case"toggle-clearly":App.toggle()}}),chrome.contextMenus.create({title:"Toggle Clearly",onclick:App.toggle,documentUrlPatterns:["http://*/*","https://*/*"]}),chrome.contextMenus.create({title:"Open with Clearly",contexts:["link"],onclick:(e,t)=>{chrome.tabs.create({url:e.linkUrl+"#clearly"})}}),chrome.runtime.onMessage.addListener(function(t,s,a){console.debug("ON_MESSAGE",t,s);let r=s.tab&&s.tab.id;switch(t.type){case"SPEAK_PLAY":App.start({text:t.text,options:t.options,tabId:r},function(){a()});break;case"SPEAK_PAUSE":App.pause({tabId:r}),a();break;case"SPEAK_RESUME":App.resume({tabId:r}),a();break;case"SPEAK_STOP":App.stop({tabId:r}),a();break;case"GET_TAB_ID":a({tabId:r});break;case"SEND_GA":e.push(t.data);break;case"UPDATE_ICON":App.updateIcon(t.status,r);break;case"SUBMIT_ARTICLE":t.article&&App.submitArticle(t.article);break;case"SUBMIT_FEEDBACK":t.article&&App.submitFeedback(t.article,t.feedback);break;case"TRANSLATE":return App.translate(t.text,t.lang,(e,t)=>{console.debug("TRANSLATE reponse",{err:e,data:t}),a({err:e,data:t})}),!0;case"DETECT_LANG":return chrome.tabs.detectLanguage(r,e=>a({lang:e})),!0}}),chrome.browserAction.onClicked.addListener(()=>App.toggle()),chrome.tabs.query({lastFocusedWindow:!0,active:!0},function(e){e[0]&&(App.currentTabId=e[0].id)}),chrome.tabs.onUpdated.addListener((e,t)=>{console.debug("TAB UPDATE",{tabId:e,changeInfo:t}),"loading"===t.status&&(e===App.speakTabId&&App.stop({force:!0}),t.url&&App.currentTabId&&chrome.tabs.sendMessage(App.currentTabId,{type:"CONTENT_PARSE",url:t.url}))}),chrome.tabs.onRemoved.addListener(e=>{console.debug("TAB REMOVE",{tabId:e}),e===App.speakTabId&&App.stop({force:!0})}),chrome.tabs.onActivated.addListener(e=>{console.debug("TAB ACTIVATED",e),App.currentTabId=e.tabId}),chrome.runtime.onInstalled.addListener(e=>{"install"===e.reason?chrome.tabs.create({url:"https://clearly.lesslab.net/r/install",selected:!0}):"update"===e.reason&&chrome.tabs.create({url:"https://clearly.lesslab.net/r/upgrade",selected:!0})}),chrome.runtime.setUninstallURL("https://clearly.lesslab.net/r/uninstall")}}App.registerChromeHandlers();