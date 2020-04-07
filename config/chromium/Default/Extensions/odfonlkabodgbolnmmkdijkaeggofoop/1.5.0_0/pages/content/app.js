const e={whitelist:["https://news.google.com/*","https://support.google.com/*","https://medium.com/*","https://www.jianshu.com/p/*"],blacklist:["*://www.youtube.com/*","*://www.google.*","*://chrome.google.com/*","*://translate.google.com/*","*://mail.google.com/*","*://drive.google.com/*"],fonts:[{name:"Lora",lang:["en"],system:["win","mac"]},{name:"NotoSerif",lang:["en"],system:["win","mac"]},{name:"Crimson Text",lang:["en"],system:["win","mac"]},{name:"Georgia",lang:["en"],system:["win","mac"]},{name:"Roboto",lang:["en"],system:["win","mac"]},{name:"Kaiti",lang:["zh"],system:["win","mac"]},{name:"Songti",lang:["zh"],system:["win","mac"]},{name:"System",lang:["zh","en"],system:["win","mac"]}]};class a{constructor(e,a){const o={get(e,a,l){try{return new Proxy(e[a],o)}catch(o){return Reflect.get(e,a,l)}},defineProperty(e,o,l){let t=Reflect.defineProperty(e,o,l);return a(o,l.value,e[o]),t},deleteProperty(e,o){let l=e[o],t=Reflect.deleteProperty(e,o);return a(o,l,void 0),t}},l=new Proxy({},o);return Object.keys(e).forEach(a=>l[a]=e[a]),l}}class App{static load(){return!!App.boot&&(App.article=App.state.isReady&&App.article?App.article:new Clearly(document.cloneNode(!0),{debug:!1}).parse(),!!App.article&&(App.article.outline&&App.article.outline.length&&""!==App.article.outline[0].id&&App.article.outline.unshift({title:App.article.title,id:"",type:"h1"}),$("#chrome-clearly-outline").html(App.article.outline.map(e=>'<div class="chrome-clearly-outline-section chrome-clearly-outline-'+e.type+'"><a href="javascript:;" data-id="#'+e.id+'">'+e.title+"</a></div>").join("\n")),$("#chrome-clearly-title").html(App.article.title),$("#chrome-clearly-byline").html(App.article.title),$("#chrome-clearly-content").html(App.article.content),$("#chrome-clearly-byline").html(App.article.authorName?App.article.authorName+" @"+App.article.hostname:""),App.article.outline.length||$("#chrome-clearly-switch-outline").addClass("s-disable"),chrome.runtime.sendMessage({type:"SUBMIT_ARTICLE",article:App.article}),!0))}static doNotClose(e){App.keepSelection(),e.stopPropagation()}static closePopmenu(e){$("#chrome-clearly-popmenu").hide(),$("#chrome-clearly-poptranslate").hide(),$("#chrome-clearly-popshare").hide(),App.lastSelection=null,$("#chrome-clearly-root").off("click",App.closePopmenu)}static detectSelectedText(e){setTimeout(function(){App.getAndSaveSelection()&&(App.showPopmenu(e),e.stopPropagation())},100)}static clickPopmenuTranslate(){let e=window.getSelection().toString();e&&(App.lastSelectedText=e,App.startPopTranslate(e))}static clickPopmenuCopy(){document.execCommand("copy"),App.closePopmenu()}static keepSelection(){if(!App.lastSelection)return;let e=window.getSelection(),a=e.toString(),o=App.lastSelection.ranges;a&&e.removeAllRanges();for(let a=0,l=o.length;a<l;++a)e.addRange(o[a])}static startPopTranslate(e){App.translate(e,App.config.translateLang,e=>{e.err||App.showPopmenuTranslate(e.data)})}static clickPopmenuShare(){$("#chrome-clearly-popmenu").hide(),$("#chrome-clearly-poptranslate").hide(),$("#chrome-clearly-popshare").show();var e=document.getElementById("chrome-clearly-popshare-image").getContext("2d");e.canvas.width=640,e.canvas.height=400;var a=new Image(640,400);a.onload=function(){e.drawImage(a,0,0),e.font="20pt Calibri",e.textAlign="center",window.getSelection().toString().match(/[\s\S]{1,45}/g).forEach((a,o)=>{e.fillStyle="#F5E9AD",e.fillRect(20,145+30*o,600,15),e.fillStyle="#000000",e.fillText(a,320,160+30*o)})},a.src=chrome.runtime.getURL("assets/img/share-bg.jpg")}static showPopmenu(e){let a=App.lastSelection.position;$("#chrome-clearly-poptranslate").hide(),$("#chrome-clearly-popmenu").show(),$("#chrome-clearly-popmenu").css({left:(window.pageXOffset+a.x+(a.width-$("#chrome-clearly-popmenu").width())/2)*parseInt(App.config.zoom||1,10),top:(window.pageYOffset+a.y-$("#chrome-clearly-popmenu").height()-10)*parseInt(App.config.zoom||1,10)}),setTimeout(function(){$("#chrome-clearly-root").on("click",App.closePopmenu)},100)}static showPopmenuTranslate(e){let a=App.lastSelection.position;$("#chrome-clearly-popmenu").hide(),$("#chrome-clearly-poptranslate").show();let o=e.sentences.map(e=>e.trans||"").join("");if($("#chrome-clearly-poptranslate-explain").html(o),$("#chrome-clearly-poptranslate-voice").hide(),e.dict){$("#chrome-clearly-poptranslate").addClass("chrome-clearly-poptranslate-wordmode");let a=e.sentences.find(e=>e.translit);a.src_translit&&($("#chrome-clearly-poptranslate-voice span").html(`[${a.src_translit}]`),$("#chrome-clearly-poptranslate-voice").show()),$("#chrome-clearly-poptranslate-translit").html(a.translit||""),$("#chrome-clearly-poptranslate-word").html(App.lastSelection.text);let o=e.dict.map(e=>`${e.pos[0]}. ${e.terms.join("; ")}`).join("<br />");$("#chrome-clearly-poptranslate-dict").html(o)}else $("#chrome-clearly-poptranslate").removeClass("chrome-clearly-poptranslate-wordmode");$("#chrome-clearly-poptranslate").css({left:window.pageXOffset+a.x+(a.width-$("#chrome-clearly-poptranslate").width())/2,top:window.pageYOffset+a.y-$("#chrome-clearly-poptranslate").height()-30})}static getAndSaveSelection(){let e=window.getSelection(),a=e.toString();if(!a)return!1;let o=[];if(e.rangeCount)for(let a=0,l=e.rangeCount;a<l;++a)o.push(e.getRangeAt(a));return App.lastSelection={ranges:o,text:a,position:e.getRangeAt(0).getBoundingClientRect()},!0}static toggle(){App.boot&&(App.state&&App.state.enabled?(App.action("hide"),App.sendGA(["_trackEvent","POPUP_CLICK","APP_HIDE"])):(App.action("show"),App.sendGA(["_trackEvent","POPUP_CLICK","APP_SHOW"])))}static action(e,a){switch(e){case"show":if(!App.load())return;chrome.runtime.sendMessage({type:"UPDATE_ICON",status:"active"}),App.state.enabled=!0,$("#chrome-clearly-root").focus();break;case"hide":chrome.runtime.sendMessage({type:"UPDATE_ICON",status:"readable"}),App.state.enabled=!1,document.webkitIsFullScreen&&document.webkitExitFullscreen(),App.stopAll();break;case"share":App.state.isSharing=a,chrome.runtime.sendMessage({type:"SUBMIT_FEEDBACK",article:App.article,feedback:a.toUpperCase()});break;case"toggleOutline":App.config.outline=!App.config.outline;break;case"zoomIn":App.config.zoom=((parseFloat(App.config.zoom,10)||1)-.1).toFixed(2);break;case"zoomOut":App.config.zoom=((parseFloat(App.config.zoom,10)||1)+.1).toFixed(2);break;case"theme":App.config.theme=a;break;case"speakText":chrome.runtime.sendMessage(Object.assign({type:"SPEAK_PLAY"},{text:a}),()=>{App.state.speak=null});break;case"speak":let o,l;switch(App.state.speak){case"PLAY":case"RESUME":o="PAUSE";break;case"PAUSE":o="RESUME";break;default:o="PLAY",l={text:App.article.title+"。"+App.article.textContent}}chrome.runtime.sendMessage(Object.assign({type:`SPEAK_${o}`},l||{}),()=>{console.log("SPEAK RESPONSE",arguments),App.state.speak=o});break;case"toggleFullscreenMode":document.webkitIsFullScreen?(document.webkitExitFullscreen(),App.sendGA(["_trackEvent","APP_CLICK","FULLSCREEN_ENTER"])):(document.getElementById("chrome-clearly-root").webkitRequestFullScreen(),App.sendGA(["_trackEvent","APP_CLICK","FULLSCREEN_EXIT"])),App.state.fullscreen=!App.state.fullscreen;break;case"showDialog":App.state.showDialog=a;break;case"changeLanguage":App.config.translateLang=a,App.startPopTranslate(App.lastSelectedText);break;case"font":App.config[`font_${App.state.lang}`]=a}App.sendGA(["_trackEvent","APP_ACTION","ACTION_"+e.toUpperCase(),"ACTION_VALUE_"+String(a).toUpperCase()])}static stateUpdated(e,a,o){switch(e){case"enabled":a?($("html").attr("class",`chrome-clearly-theme-${App.config.theme||"default"} chrome-clearly-enabled`),$(document.body).addClass("chrome-clearly-hide"),window.scroll(0,0),$("html").addClass("chrome-clearly-enter"),setTimeout(()=>{$("html").removeClass("chrome-clearly-enter")},250)):($("html").addClass("chrome-clearly-leave"),setTimeout(()=>{$("html").removeClass("chrome-clearly-leave"),$(document.body).removeClass("chrome-clearly-hide"),$("html").removeClass("chrome-clearly-enabled")},250));break;case"readMin":$("#chrome-clearly-value-readmin").text(a);break;case"speak":switch(a){case"PLAY":case"RESUME":$("#chrome-clearly-menu-speak").addClass("chrome-clearly-menu-actived"),$("#chrome-clearly-menu-speak-icon").text("volume_up");break;case"PAUSE":$("#chrome-clearly-menu-speak").addClass("chrome-clearly-menu-actived"),$("#chrome-clearly-menu-speak-icon").text("volume_mute");break;default:$("#chrome-clearly-menu-speak").removeClass("chrome-clearly-menu-actived"),$("#chrome-clearly-menu-speak-icon").text("volume_down")}break;case"fullscreen":a?($("#chrome-clearly-menu-fullscreen").addClass("chrome-clearly-menu-actived"),$("#chrome-clearly-menu-fullscreen-icon").text("fullscreen_exit")):($("#chrome-clearly-menu-fullscreen").removeClass("chrome-clearly-menu-actived"),$("#chrome-clearly-menu-fullscreen-icon").text("fullscreen"));break;case"isSharing":switch($(".chrome-clearly-share-overlay").hide(),a){case"yes":$("#chrome-clearly-share-yes").show();break;case"no":$("#chrome-clearly-share-no").show();break;case"finish":default:$("#chrome-clearly-share-default").show()}break;case"showDialog":switch($(".chrome-clearly-dialog").removeClass("chrome-clearly-dialog--open"),a){case"style":$("#chrome-clearly-dialog-style").addClass("chrome-clearly-dialog--open");break;case"setting":$("#chrome-clearly-dialog-setting").addClass("chrome-clearly-dialog--open")}break;case"fonts":$("#chrome-clearly-font-select-style").html(""),a.forEach(e=>{let a=e.toLowerCase().replace(/ /g,""),o="chrome-clearly-font-"+a;App.config[`font_${App.state.lang}`]===a&&(o+=" chrome-clearly-font-selected"),$("#chrome-clearly-font-select-style").append(`<span data-font="${a}" class="${o}">${e}</span>`)})}}static configUpdated(e,a,o){switch(e){case"theme":$(".chrome-clearly-btn-selected").removeClass("chrome-clearly-btn-selected"),$(`.chrome-clearly-btn-theme-${a}`).addClass("chrome-clearly-btn-selected");let o=($("html").attr("class")||"").split(" ").filter(e=>!e.startsWith("chrome-clearly-theme-")).concat([`chrome-clearly-theme-${a}`]).join(" ");$("html").attr("class",`${o}`);break;case"zoom":document.getElementById("chrome-clearly-content").style.zoom=a,$("#chrome-clearly-value-zoom").text((100*a).toFixed(0)+"%");break;case"outline":a?($("#chrome-clearly-outline").show(),$("#chrome-clearly-switch-outline").addClass("s-on"),$("#chrome-clearly-switch-outline").removeClass("s-off")):($("#chrome-clearly-outline").hide(),$("#chrome-clearly-switch-outline").removeClass("s-on"),$("#chrome-clearly-switch-outline").addClass("s-off"));break;case"translateLang":$("#chrome-clearly-poptranslate-lang").val(a);break;default:e.startsWith("font_")&&($(".chrome-clearly-font-selected").removeClass("chrome-clearly-font-selected"),$(`.chrome-clearly-font-${a}`).addClass("chrome-clearly-font-selected"),$("#chrome-clearly-main,#chrome-clearly-outline").attr("class",""),$("#chrome-clearly-main,#chrome-clearly-outline").addClass("chrome-clearly-font-"+a))}App.saveConfig()}static saveConfig(){chrome.storage.local.set({config:App.config},function(){})}static sendGA(e){chrome.runtime.sendMessage({type:"SEND_GA",data:e})}static detectLanguage(e){chrome.runtime.sendMessage({type:"DETECT_LANG"},e)}static stopAll(){App.state.speak&&chrome.runtime.sendMessage(Object.assign({type:"SPEAK_STOP"}),()=>{App.state.speak=null})}static translate(e,a,o){chrome.runtime.sendMessage({type:"TRANSLATE",lang:a,text:e},o)}static scrollIt(e){const a=document.getElementById("chrome-clearly-root"),o=Math.max(a.scrollHeight,a.offsetHeight,document.documentElement.clientHeight,document.documentElement.scrollHeight,document.documentElement.offsetHeight),l=window.innerHeight||document.documentElement.clientHeight||a.clientHeight,t="number"==typeof e?e:e.offsetTop,n=Math.round(o-t<l?o-l:t);window.scroll(0,n)}static initState(){App.config=new a({},App.configUpdated),App.state=new a({},App.stateUpdated);const o={},l={};return new Promise((a,t)=>{chrome.storage.local.get(["config"],function(t){Object.assign(o,{theme:"default",zoom:1,outline:!0,translateLang:navigator.language},t.config||{}),Object.assign(l,{speak:null,fullscreen:!1,isReady:!0,isTranslate:!1,translateResult:null,readMin:0,isSharing:!1}),App.detectLanguage(({lang:t})=>{const n=`font_${t}`;o[n]||(o[n]="en"===t?"lora":"system"),l.lang=t,l.fonts=e.fonts.filter(e=>{let a=navigator.platform.toLowerCase();return e.system.some(e=>a.startsWith(e))&&e.lang.some(e=>t.startsWith(e))}).map(e=>e.name),Object.keys(o).forEach(e=>App.config[e]=o[e]),Object.keys(l).forEach(e=>App.state[e]=l[e]),a(!0)})})})}static bindEvents(){$("#chrome-clearly-root").on("click",".chrome-clearly-outline-section",function(){let e=$(this).find("a").data("id");if("#"===e||!e)return window.scroll(0,0);let a=document.querySelector(e);a&&App.scrollIt(a)}),$("#chrome-clearly-menu-speak").click(()=>App.action("speak")),$(".chrome-clearly-btn-theme-default").click(()=>App.action("theme","default")),$(".chrome-clearly-btn-theme-yellow").click(()=>App.action("theme","yellow")),$(".chrome-clearly-btn-theme-black").click(()=>App.action("theme","black")),$(".chrome-clearly-btn-theme-gray").click(()=>App.action("theme","gray")),$("#chrome-clearly-btn-close").click(()=>App.action("hide")),$("#chrome-clearly-btn-zoomin").click(()=>App.action("zoomIn")),$("#chrome-clearly-btn-zoomout").click(()=>App.action("zoomOut")),$("#chrome-clearly-switch-outline").click(()=>App.action("toggleOutline")),$("#chrome-clearly-menu-fullscreen").click(()=>App.action("toggleFullscreenMode")),$("#chrome-clearly-btn-style").click(()=>App.action("showDialog","style")),$(".chrome-clearly-dialog-btn-close").click(()=>App.action("showDialog",null)),$("#chrome-clearly-btn-thumb-up").click(()=>App.action("share","yes")),$("#chrome-clearly-btn-thumb-down").click(()=>App.action("share","no")),$("#chrome-clearly-content,#chrome-clearly-title").click(App.detectSelectedText),$("#chrome-clearly-popmenu-translate").click(App.clickPopmenuTranslate),$("#chrome-clearly-popmenu-copy").click(App.clickPopmenuCopy),$("#chrome-clearly-popmenu,#chrome-clearly-popshare,#chrome-clearly-poptranslate").click(App.doNotClose),$("#chrome-clearly-poptranslate-lang").change(function(){App.action("changeLanguage",$(this).val())}),$("#chrome-clearly-poptranslate-btn-speak").click(()=>App.action("speakText",$("#chrome-clearly-poptranslate-word").text())),$("#chrome-clearly-font-select-style").on("click","span",function(){App.action("font",$(this).data("font"))}),$("html").on("keyup",function(e){"Escape"===e.originalEvent.code&&App.state.enabled&&(App.action("hide"),App.sendGA(["_trackEvent","SHORTCUT","APP_HIDE"]))}),chrome.runtime.onMessage.addListener((e,a)=>{switch(e.type){case"CONTENT_SPEAK_STOP":App.state.speak=null;break;case"CONTENT_PARSE":App.state.isReady=!1;break;case"CONTENT_LANG":App.state.lang=e.lang}})}static async bootstrap(){App.boot=!0,App.article=new Clearly(document.cloneNode(!0),{debug:!1}).parse(),chrome.runtime.sendMessage({type:"READY"}),App.article&&chrome.runtime.sendMessage({type:"UPDATE_ICON",status:"readable"}),$(document.body).after('\n<div id="chrome-clearly-root">\n  <div id="chrome-clearly-popshare">\n    <canvas id="chrome-clearly-popshare-image"></canvas>\n  </div>\n  <div id="chrome-clearly-poptranslate">\n    <div id="chrome-clearly-poptranslate-toolbox">\n    <span>Translation language:</span> <select id="chrome-clearly-poptranslate-lang"><option value="af">Afrikaans</option><option value="sq">Albanian</option><option value="am">Amharic</option><option value="ar">Arabic</option><option value="hy">Armenian</option><option value="az">Azerbaijani</option><option value="eu">Basque</option><option value="be">Belarusian</option><option value="bn">Bengali</option><option value="bs">Bosnian</option><option value="bg">Bulgarian</option><option value="ca">Catalan</option><option value="ceb">Cebuano</option><option value="ny">Chichewa</option><option value="zh-CN">Chinese (Simplified)</option><option value="zh-TW">Chinese (Traditional)</option><option value="co">Corsican</option><option value="hr">Croatian</option><option value="cs">Czech</option><option value="da">Danish</option><option value="nl">Dutch</option><option value="en">English</option><option value="eo">Esperanto</option><option value="et">Estonian</option><option value="tl">Filipino</option><option value="fi">Finnish</option><option value="fr">French</option><option value="fy">Frisian</option><option value="gl">Galician</option><option value="ka">Georgian</option><option value="de">German</option><option value="el">Greek</option><option value="gu">Gujarati</option><option value="ht">Haitian Creole</option><option value="ha">Hausa</option><option value="haw">Hawaiian</option><option value="iw">Hebrew</option><option value="hi">Hindi</option><option value="hmn">Hmong</option><option value="hu">Hungarian</option><option value="is">Icelandic</option><option value="ig">Igbo</option><option value="id">Indonesian</option><option value="ga">Irish</option><option value="it">Italian</option><option value="ja">Japanese</option><option value="jw">Javanese</option><option value="kn">Kannada</option><option value="kk">Kazakh</option><option value="km">Khmer</option><option value="ko">Korean</option><option value="ku">Kurdish (Kurmanji)</option><option value="ky">Kyrgyz</option><option value="lo">Lao</option><option value="la">Latin</option><option value="lv">Latvian</option><option value="lt">Lithuanian</option><option value="lb">Luxembourgish</option><option value="mk">Macedonian</option><option value="mg">Malagasy</option><option value="ms">Malay</option><option value="ml">Malayalam</option><option value="mt">Maltese</option><option value="mi">Maori</option><option value="mr">Marathi</option><option value="mn">Mongolian</option><option value="my">Myanmar (Burmese)</option><option value="ne">Nepali</option><option value="no">Norwegian</option><option value="ps">Pashto</option><option value="fa">Persian</option><option value="pl">Polish</option><option value="pt">Portuguese</option><option value="pa">Punjabi</option><option value="ro">Romanian</option><option value="ru">Russian</option><option value="sm">Samoan</option><option value="gd">Scots Gaelic</option><option value="sr">Serbian</option><option value="st">Sesotho</option><option value="sn">Shona</option><option value="sd">Sindhi</option><option value="si">Sinhala</option><option value="sk">Slovak</option><option value="sl">Slovenian</option><option value="so">Somali</option><option value="es">Spanish</option><option value="su">Sundanese</option><option value="sw">Swahili</option><option value="sv">Swedish</option><option value="tg">Tajik</option><option value="ta">Tamil</option><option value="te">Telugu</option><option value="th">Thai</option><option value="tr">Turkish</option><option value="uk">Ukrainian</option><option value="ur">Urdu</option><option value="uz">Uzbek</option><option value="vi">Vietnamese</option><option value="cy">Welsh</option><option value="xh">Xhosa</option><option value="yi">Yiddish</option><option value="yo">Yoruba</option><option value="zu">Zulu</option></select>\n    </div>\n    <div id="chrome-clearly-poptranslate-content">\n      <div id="chrome-clearly-poptranslate-word"></div>\n      <div id="chrome-clearly-poptranslate-voice">\n        <i class="material-icons" id="chrome-clearly-poptranslate-btn-speak">volume_up</i>\n        <span></span>\n      </div>\n      <div id="chrome-clearly-poptranslate-explain"></div>\n      <div id="chrome-clearly-poptranslate-translit"></div>\n      <div id="chrome-clearly-poptranslate-dict"></div>\n    </div>\n  </div>\n  <div id="chrome-clearly-popmenu">\n    <li id="chrome-clearly-popmenu-translate">Translate</li>\n    <li id="chrome-clearly-popmenu-copy">Copy</li>\n    \x3c!--<li id="chrome-clearly-popmenu-share">Share</li>--\x3e\n  </div>\n  <div id="chrome-clearly-outline"></div>\n  <div id="chrome-clearly-main">\n    <div id="chrome-clearly-title"></div>\n    <div id="chrome-clearly-byline"><span>About</span> <span id="chrome-clearly-value-readmin"></span> Minutes</div>\n    <div id="chrome-clearly-content"></div>\n\n    <div id="chrome-clearly-footer">\n      <div id="chrome-clearly-share" class="chrome-clearly-share">\n        <span class="chrome-clearly-share-title">Does Clearly work fine?</span>\n        <div id="chrome-clearly-share-default" class="chrome-clearly-share-overlay">\n            <i id="chrome-clearly-btn-thumb-up" class="material-icons chrome-clearly-thumb chrome-clearly-thumb-up">thumb_up</i>\n            <i id="chrome-clearly-btn-thumb-down" class="material-icons chrome-clearly-thumb chrome-clearly-thumb-down">thumb_down</i>\n        </div>\n        <div id="chrome-clearly-share-no" class="chrome-clearly-share-overlay">\n          <span class="chrome-clearly-share-letter">We have received your feedback</span>\n          <a "chrome-clearly-btn-cantact" href="https://clearly.lesslab.net/r/chrome-support" target="_blank"><i class="material-icons">mail_outline</i>Contact us</a>\n        </div>\n        <div id="chrome-clearly-share-yes" class="chrome-clearly-share-overlay">\n          <span class="chrome-clearly-share-letter">How is your experience with Clearly？</span>\n          <a id="chrome-clearly-btn-comments" href="https://clearly.lesslab.net/r/chrome-review" target="_blank"><i class="material-icons">star_border</i>Give stars</a>\n        </div>\n      </div>\n\n      <div class="chrome-clearly-moretips" >\n      <span class="chrome-clearly-shortcut">Shortcuts: <strong>SHIFT+CTRL+C</strong> to Toggle, <strong>ESC</strong> to Close.</span>\n      <a class="chrome-clearly-feedback" target="_blank" href="https://clearly.lesslab.net/r/subscribe"><i class="material-icons">mail</i>Join maillist</a>\n      <a class="chrome-clearly-donate" target="_blank" href="https://clearly.lesslab.net/r/donate"><i class="material-icons">favorite</i>Donate</a>\n      </div>\n\n      <span class="chrome-clearly-lover"> <span>Build upon ❤ with Clearly</span><a target="_blank" class="chrome-clearly-footer-feedback" href="https://clearly.lesslab.net/r/feedback">Feedback</a></span>\n    </div>\n\n  </div>\n  <div id="chrome-clearly-tool">\n      \x3c!--\n      <div class="chrome-clearly-menu">\n        <div class="chrome-clearly-form-group">\n          <span class="chrome-clearly-btn" id="chrome-clearly-translate-start">开始</span>\n        </div>\n      </div>\n      --\x3e\n\n    <div class="chrome-clearly-menu">\n      <span id="chrome-clearly-btn-close"><i class="material-icons">cancel</i></span>\n    </div>\n\n    <div class="chrome-clearly-menu" chrome-clearly-menu-tooltip="STYLE">\n      <span id="chrome-clearly-btn-style"></span>\n    </div>\n\n    <div class="chrome-clearly-dialog" id="chrome-clearly-dialog-style">\n       <div class="chrome-clearly-overlay-backdrop">\n            <div class="chrome-clearly-setting">\n                <div class="chrome-clearly-dialog-title">STYLE</div>\n                <div class="chrome-clearly-dialog-btn-close"><i class="material-icons">close</i></div>\n\n                <div class="chrome-clearly-tcell">\n                  <div class="chrome-clearly-form-label"><span id="chrome-clearly-value-zoom" class="chrome-clearly-form-value"></span>Font size</div>\n                  <div class="chrome-clearly-form-group">\n                    <span class="chrome-clearly-btn-letter" id="chrome-clearly-btn-zoomin">A</span>\n                    <span class="chrome-clearly-btn-letter" id="chrome-clearly-btn-zoomout">A</span>\n                  </div>\n                </div>\n\n                <div class="chrome-clearly-tcell">\n                  <div class="chrome-clearly-form-label">Themes</div>\n                  <div class="chrome-clearly-form-group">\n                    <span class="chrome-clearly-btn chrome-clearly-btn-theme-default"></span>\n                    <span class="chrome-clearly-btn chrome-clearly-btn-theme-yellow"></span>\n                    <span class="chrome-clearly-btn chrome-clearly-btn-theme-gray"></span>\n                    <span class="chrome-clearly-btn chrome-clearly-btn-theme-black"></span>\n                  </div>\n                </div>\n\n                <div class="chrome-clearly-tcell">\n                  <div class="chrome-clearly-form-label">Fonts</div>\n                  <div id="chrome-clearly-font-select-style" class="chrome-clearly-form-group"></div>\n                </div>\n\n                <div class="chrome-clearly-tcell">\n                  <div class="chrome-clearly-form-label">Outline</div>\n                  <div class="chrome-clearly-form-group">\n                    <div id="chrome-clearly-switch-outline" class="chrome-clearly-switch">\n                        <span class="chrome-clearly-slider"></span>\n                    </div>\n                  </div>\n                </div>\n            </div>\n         </div>\n      </div>\n\n\n    \x3c!--div class="chrome-clearly-menu" id="chrome-clearly-menu-translate" chrome-clearly-menu-tooltip="TRANSLATE">\n        <span><i class="material-icons" id="chrome-clearly-menu-translate-icon">translate</i></span>\n    </div--\x3e\n\n    <div class="chrome-clearly-menu" id="chrome-clearly-menu-speak" chrome-clearly-menu-tooltip="AUDIO">\n        <span><i class="material-icons" id="chrome-clearly-menu-speak-icon">volume_down</i></span>\n            \x3c!--\n            <span class="chrome-clearly-btn" id="chrome-clearly-btn-speak-pause" style="display:none"><i class="fa fa-pause"></i></span>\n            <span class="chrome-clearly-btn" id="chrome-clearly-btn-speak-resume" style="display:none"><i class="fa fa-play"></i></span>\n            <span class="chrome-clearly-btn" id="chrome-clearly-btn-speak-stop" style="display:none"><i class="fa fa-stop"></i></span>\n            --\x3e\n    </div>\n\n    <div class="chrome-clearly-menu" id="chrome-clearly-menu-fullscreen" chrome-clearly-menu-tooltip="FULLSCREEN">\n        <span><i class="material-icons" id="chrome-clearly-menu-fullscreen-icon">fullscreen</i></span>\n    </div>\n  </div>\n</div>'),App.bindEvents(),await App.initState(),window.location.href.includes("#clearly")&&App.toggle()}}function o(e){return e.map(e=>{var a=e.replace(/[-[]\/\{\}\(\)\+\?\.\\\^\$\|]/g,"\\$&").replace(/\*/g,".*").replace(/^http:\\\/\\\/\.\*/i,"http:\\/\\/[^/]*").replace(/^https:\\\/\\\/\.\*/i,"https:\\/\\/[^/]*");return new RegExp("^"+a+"$","i")})}document.contentType.includes("/html")&&function(a){let l=o(e.blacklist);return!!o(e.whitelist).some(e=>e.test(a))||!l.some(e=>e.test(a))}(window.location.href)?App.bootstrap():chrome.runtime.sendMessage({type:"UPDATE_ICON",status:"disable"});