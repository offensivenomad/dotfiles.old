// For developer-friendly version with comments see https://github.com/B-DNS

var apiBaseURLs = [
  'https://bdns.at/r/',
  'https://bdns.by/r/',
  'https://bdns.co/r/',
  'https://bdns.im/r/',
  'https://bdns.io/r/',
  'https://bdns.link/r/',
  'https://bdns.nu/r/',
  'https://bdns.pro/r/',
  'https://b-dns.se/r/',
];

var apiBaseUrlIndex = Math.floor(Math.random() * apiBaseURLs.length);

var apiTimeout = 5000;

var allURLs = {
  urls: [
    "*://*.bit/*",    "ftp://*.bit/*",
    "*://*.lib/*",    "ftp://*.lib/*",
    "*://*.emc/*",    "ftp://*.emc/*",
    "*://*.bazar/*",  "ftp://*.bazar/*",
    "*://*.coin/*",   "ftp://*.coin/*",
    "*://*.bbs/*",    "ftp://*.bbs/*",
    "*://*.chan/*",   "ftp://*.chan/*",
    "*://*.cyb/*",    "ftp://*.cyb/*",
    "*://*.dyn/*",    "ftp://*.dyn/*",
    "*://*.geek/*",   "ftp://*.geek/*",
    "*://*.gopher/*", "ftp://*.gopher/*",
    "*://*.indy/*",   "ftp://*.indy/*",
    "*://*.libre/*",  "ftp://*.libre/*",
    "*://*.neo/*",    "ftp://*.neo/*",
    "*://*.null/*",   "ftp://*.null/*",
    "*://*.o/*",      "ftp://*.o/*",
    "*://*.oss/*",    "ftp://*.oss/*",
    "*://*.oz/*",     "ftp://*.oz/*",
    "*://*.parody/*", "ftp://*.parody/*",
    "*://*.pirate/*", "ftp://*.pirate/*",
    "*://*.ku/*",     "ftp://*.ku/*",
    "*://*.te/*",     "ftp://*.te/*",
    "*://*.ti/*",     "ftp://*.ti/*",
    "*://*.uu/*",     "ftp://*.uu/*",
    "*://*.fur/*",    "ftp://*.fur/*",
  ]
};

function parseURL(url) {
  var match = (url || '').match(/^(\w+):\/\/[^\/]*?([\w.-]+)(:(\d+))?(\/|$)/);
  if (match) {
    return {
      url: url,
      scheme: match[1],
      domain: match[2],
      tld: match[2].match(/[^.]+$/),
      port: match[4]
    };
  }
}

function isSupportedTLD(tld) {
  return allURLs.urls.indexOf('*://*.' + tld + '/*') != -1;
}

function resolveViaAPI(domain, async, done) {
  var xhr = new XMLHttpRequest;
  var apiBase = apiBaseURLs[apiBaseUrlIndex];

  xhr.onreadystatechange = function () {
    var ips = (xhr.responseText || '').trim();


    if (xhr.readyState == 4) {
      if (xhr.status == 200 && ips.match(/^[\d.\r\n]+$/)) {
        ips = ips.split(/\r?\n/);
        done(ips);
      } else if (xhr.status == 404 && ips == 'nx') {
        done([]);
      } else {
        xhr.onerror = null;
        done();
      }
    }
  }

  xhr.onerror = function () { done(); };

  xhr.ontimeout = function () {
    apiTimeout = Math.min(apiTimeout * 1.5, 30000);
  };

  if (async) {
    xhr.timeout = apiTimeout;
  }

  try {
    var apiURL = apiBase + encodeURIComponent(domain);
    xhr.open("GET", apiURL, async);
    xhr.send();
    return xhr;
  } catch (e) {
    done();
  }
}

function rotateApiHost() {
  if (++apiBaseUrlIndex >= apiBaseURLs.length) {
    apiBaseUrlIndex = 0;
  }

}
