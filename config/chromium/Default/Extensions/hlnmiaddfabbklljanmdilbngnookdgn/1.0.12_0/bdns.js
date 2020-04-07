// For developer-friendly version with comments see https://github.com/B-DNS

var notificationTimes = {};

var notificationTimespan = 30;

function showThrottledNotification(id, title, msg) {
  var last = notificationTimes[id];

  if (!last || last < Date.now() - notificationTimespan * 1000) {
    notificationTimes[id] = Date.now();
    return showNotification(title, msg);
  }
}

function showNotification(title, msg) {
  return chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon-64.png',
    title: title,
    message: msg || '',
  });
}

var pac = {
  _scriptStub: function () {
    var cache = CACHE_HERE;

    function FindProxyForURL(url, host) {
      var res = 'DIRECT';
      var ips = cache[host];

      if (ips) {
        var pos = url.indexOf(host);
        var port;

        if (pos != -1) {
          port = (url.substr(pos + host.length).match(/^:(\d+)/) || [])[1];
        }

        var https = url.match(/^https:/i);
        var directive = https ? 'HTTPS ' : 'PROXY ';
        port = ':' + (port || (https ? 443 : 80));
        res = directive + ips.join(port + '; ' + directive) + port;
      }

      return res;
    }
  },

  buildObject: function () {
    var obj = {};

    cache.each(function (domain) {
      var ips = cache.ips(domain);
      if (ips.length) { obj[domain] = ips; }
    });

    return JSON.stringify(obj);
  },

  onIpChange: function (domain, ips, existed) {
    if (!ips.length) {
      return;
    }

    var script = pac._scriptStub.toString()
      .replace(/^.*|.*$/g, '')    // wrapping 'function () { ... }'.
      .replace('CACHE_HERE', pac.buildObject());


    var config = {
      mode: 'pac_script',
      pacScript: {
        data: script,
      },
    };

    chrome.proxy.settings.set({value: config}, function () {
    });
  },

  onDomainDelete: function (domain) { },
}

cache.onIpChange = pac.onIpChange;
cache.onDomainDelete = pac.onDomainDelete;

chrome.webRequest.onBeforeRequest.addListener(function (details) {

  var url = parseURL(details.url);

  if (url) {
    var ips = cache.ips(url.domain);

    if (ips) {

      if (!ips.length) {
        showThrottledNotification(url.domain, 'Non-existent .' + url.tld + ' domain: ' + url.domain);
        return {cancel: true};
      }
    } else {

      var res = {cancel: true};

      resolveViaAPI(url.domain, false, function (ips) {
        if (!ips) {
          showThrottledNotification(url.domain, 'Resolution of .' + url.tld + ' is temporary unavailable');
          rotateApiHost();
        } else if (!ips.length) {
          cache.set(url.domain, []);
          showThrottledNotification(url.domain, 'Non-existent .' + url.tld + ' domain: ' + url.domain);
        } else {
          cache.set(url.domain, ips);
          res = null;
        }
      });


      return res;
    }
  }
}, allURLs, ["blocking"]);

chrome.webRequest.onErrorOccurred.addListener(function (details) {

  var req = details.requestId;
  var url = parseURL(details.url);

  switch (details.error) {
  case 'net::ERR_PROXY_CONNECTION_FAILED':
    if (cache.has(url.domain)) {
      showThrottledNotification(url.domain, url.domain + ' is down');
    }

    break;
  }
}, allURLs);

chrome.alarms.create({periodInMinutes: 1});

chrome.alarms.onAlarm.addListener(function () {
  var count = cache.prune();
});

var tabSupport = {};
var activeTab;

chrome.tabs.onActivated.addListener(function (info) {
  activeTab = info.tabId;

  var supported = tabSupport[activeTab];
  chrome.browserAction[!supported ? 'enable' : 'disable']();
});

chrome.tabs.onUpdated.addListener(function (id, changeInfo) {
  var url = parseURL(changeInfo.url || '');

  if (url) {
    var supported = isSupportedTLD(url.tld);


    if (supported) {
      tabSupport[id] = supported;
    }

    if (activeTab == id) {
      chrome.browserAction[!supported ? 'enable' : 'disable']();
    }
  }
});

chrome.browserAction.onClicked.addListener(function () {
  chrome.tabs.create({
    url: "https://blockchain-dns.info"
  });
});
