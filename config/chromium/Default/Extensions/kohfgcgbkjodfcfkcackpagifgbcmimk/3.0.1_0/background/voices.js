function Voices() {
    let self = this;
    self.voices = {
        'free': {},
        'prem': {},
        'plus': {},
        'all': {}
    }
    self.defaultFreeVoice = '';
    self.defaultPremVoice = '';
    self.defaultPlusVoice = '';
    self.isSettingVoices = true;
    self.getIsSettingVoices = getIsSettingVoices;
    self.getDefaultVoice = getDefaultVoice;
    self.getVoices = getVoices;
    self.getVoice = getVoice;
    self.isAsyncFunction = isAsyncFunction;
    self.asyncFunctions = ['getDefaultVoice', 'getVoices', 'getIsSettingVoices', 'getVoice'];
    function init() {
        chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
            if (request.fn in voices) {
                voices[request.fn](request, sender, sendResponse);
                if (voices.isAsyncFunction(request.fn)) {
                    return true;
                }
            }
        });
        setFreeVoices()
            .then(() => {
                return new Promise((resolve) => {
                    setPlusVoices();
                    setPremVoices();
                    let copiedFreeVoices = Object.assign({}, self.voices['free']);
                    for (let key of Object.keys(copiedFreeVoices)) {
                        if(copiedFreeVoices[key].isPrem){
                            delete copiedFreeVoices[key];
                        }
                    }
                    self.voices['all'] = Object.assign({}, self.voices['prem'], self.voices['plus'], copiedFreeVoices);
                    resolve();
                });
            })
            .then(() => {
                return new Promise((resolve) => {
                    setDefaultVoices();
                    resolve();
                });
            })
            .then(() => {
                self.isSettingVoices = false;
                chrome.tabs.sendMessage(extension.activeTabId, { 'fn': 'voicesOnLoad' });
            })
            .catch((err) => {
            });
    }
    function isAsyncFunction(fnName) {
        return self.asyncFunctions.includes(fnName);
    }
    function setDefaultVoices() {
        if (Object.keys(self.voices['free']).length > 0) {
            self.defaultFreeVoice = Object.keys(self.voices['free'])[0];
            if (!widget.settings.freeVoice) {
                widget.settings.freeVoice = self.defaultFreeVoice;
            }
        }
        self.defaultPremVoice = Object.keys(self.voices['prem'])[0];
        if (!widget.settings.premVoice) {
            widget.settings.premVoice = self.defaultPremVoice;
        }
        if(!widget.settings.preset1Voice){
            widget.settings.preset1Voice = self.defaultPremVoice;
        }
        if(!widget.settings.preset2Voice){
            widget.settings.preset2Voice = self.defaultPremVoice;
        }
        self.defaultPlusVoice = Object.keys(self.voices['plus'])[0];
        if (!widget.settings.plusVoice) {
            widget.settings.plusVoice = self.defaultPlusVoice;
        }
    }
    function getIsSettingVoices(request, sender, sendResponse) {
        sendResponse(self.isSettingVoices);
    }
    function getVoiceKey(name, language) {
        return name + ' ' + language;
    }
    function setFreeVoices() {
        return getVoicesFromAPI()
            .then(result => {
                return new Promise((resolve) => {
                    let temp = [];
                    for (let i = 0; i < result.length; i++) {
                        let voice = result[i];
                        let source = getVoiceSource(voice);
                        let name = getName(voice.name || voice.voiceName, source);
                        let language = voice.lang;
                        let isOther = false;
                        language = getLanguage(language, name);
                        if (language === '') {
                            language = voice.lang;
                            isOther = true;
                        } else {
                            if (source === 'google') {
                                let premGoogleVoice = { key: getVoiceKey(name, language), name: name, language: language, source: source, voice: voice, isOther: isOther, isPrem: true, type: 'free' };
                                temp.push(premGoogleVoice);
                            }
                        }
                        let freeVoice = { key: getVoiceKey(name, language), name: name, language: language, source: source, voice: voice, isOther: isOther, type: 'free' };
                        if (i === 0) {
                            self.defaultFreeVoice = name;
                        }
                        temp.push(freeVoice);
                    }
                    resolve(temp);
                });
            })
            .then((voices) => {
                return sortVoices(voices);
            })
            .then((voices) => {
                for (let i = 0; i < voices.length; i++) {
                    let name = (voices[i].source === 'google' && voices[i].isPrem) ? getGoogleVoiceName(voices[i]) : voices[i].name;
                    self.voices['free'][getVoiceKey(name, voices[i].language)] = voices[i];
                }
            })
            .catch(function (err) {
            });
    }
    function getVoicesFromAPI() {
        if (utils.getOS().os === 'mac') {
            return getVoicesFromSpeechSynthesis();
        } else {
            return getVoicesFromBrowser(browser);
        }
    }
    function sortVoices(voices) {
        return new Promise((resolve, reject) => {
            voices.sort((obj1, obj2) => {
                function getNameWeight(name) {
                    name += "";
                    name = name.toLowerCase();
                    if (name == "alex") return 1;
                    if (name == "samantha") return 2;
                    if (name == "tom") return 3;
                    if (name == "daniel") return 4;
                    if (name == "serena") return 5;
                    return 999;
                }
                function getLangWeight(name) {
                    if (name == "en-US") return 1;
                    if (name == "en-UK") return 2;
                    if (name == "en-GB") return 3;
                    if (name == "es-ES" || name == "es-MX" || name == "es-CA") return 4;
                    if (name == "es-US") return 5;
                    if (name == "fr-FR" || name == "fr-CA") return 6;
                    if (name == "de-DE") return 7;
                    if (name == "it-IT") return 8;
                    if (name == "pt-PT" || name == "pt-BR") return 9;
                    if (name == "sv-SE") return 10;
                    if (name == "nl-NL") return 11;
                    return 999;
                }
                var val1 = getLangWeight(obj1.language);
                var val2 = getLangWeight(obj2.language);
                let isOther1 = obj1.isOther ? 999 : 0;
                let isOther2 = obj2.isOther ? 999 : 0;
                if (isOther1 < isOther2) {
                    return -1
                } else if (isOther1 > isOther2) {
                    return 1;
                } else {
                    if (val1 < val2) {
                        return -1;
                    } else if (val1 > val2) {
                        return 1;
                    } else {
                        if (getNameWeight(obj1.name) < getNameWeight(obj2.name)) {
                            return -1;
                        } else if (getNameWeight(obj1.name) > getNameWeight(obj2.name)) {
                            return 1;
                        }
                        return 0;
                    }
                }
            });
            resolve(voices);
        }).catch(function (err) {
        });
    }
    function getGoogleVoiceName(voice) {
        switch (voice.language) {
            case "en-US": ;
                return "Gale";
            case "en-GB":
                if (voice.name === "Google UK English Male") {
                    return "Gabriel";
                } else if (voice.name === "Google UK English Female") {
                    return "Grace";
                }
            case "es-ES":
                return "Anna";
            case "es-US":
                return "Mariana";
            case "it-IT":
                return "Sofia";
            case "nl-NL":
                return "Margreet";
            case "fr-FR":
                return "Sophia";
            case "pt-BR":
                return "Carolina";
            case "de-DE":
                return "Mia";
            default:
                return voice.name;
        }
    }
    function getName(name, source) {
        if (source === "acapela") {
            name = name.split(" ")[0];
        }
        if (name == "native") {
            name = "Native";
        } else {
            name = name.split("-")[0];
            name = name.replace("Microsoft", "");
        }
        if (name == "Aaron") name = "Mia";
        if (name == "Marie") name = "Louis";
        return name;
    }
    function getLanguage(lang, name) {
        if (name == "native") {
            return "en-US";
        }
        if (lang.indexOf("en-US") >= 0 || lang.indexOf("en_US") >= 0) {
            return "en-US";
        } else if (lang.indexOf("en-UK") >= 0 || lang.indexOf("en_UK") >= 0) {
            return "en-UK";
        } else if (lang.indexOf("en-GB") >= 0 || lang.indexOf("en_GB") >= 0) {
            return "en-GB";
        } else if (lang.indexOf("de-DE") >= 0 || lang.indexOf("de_DE") >= 0) {
            return "de-DE";
        } else if (lang.indexOf("fr-FR") >= 0 || lang.indexOf("fr_FR") >= 0) {
            return "fr-FR";
        } else if (lang.indexOf("it-IT") >= 0 || lang.indexOf("it_IT") >= 0) {
            return "it-IT";
        } else if (lang.indexOf("sv-SE") >= 0 || lang.indexOf("sv_SE") >= 0) {
            return "sv-SE";
        } else if (lang.indexOf("fr-CA") >= 0 || lang.indexOf("fr_CA") >= 0) {
            return "fr-CA";
        } else if (lang.indexOf("es-ES") >= 0 || lang.indexOf("es_ES") >= 0) {
            return "es-ES";
        } else if (lang.indexOf("es-MX") >= 0 || lang.indexOf("es-MX") >= 0) {
            return "es-MX";
        } else if (lang.indexOf("es-CA") >= 0 || lang.indexOf("es-CA") >= 0) {
            return "es-CA";
        } else if (lang.indexOf("pt-PT") >= 0 || lang.indexOf("pt_PT") >= 0) {
            return "pt-PT";
        } else if (lang.indexOf("fr-CA") >= 0 || lang.indexOf("fr_CA") >= 0) {
            return "fr-CA";
        } else if (lang.indexOf("es-US") >= 0 || lang.indexOf("es_US") >= 0) {
            return "es-US";
        } else if (lang.indexOf("pt-BR") >= 0 || lang.indexOf("pt_BR") >= 0) {
            return "pt-BR";
        } else if (lang.indexOf("nl-NL") >= 0 || lang.indexOf("nl_NL") >= 0) {
            return "nl-NL";
        } else {
            return "";
        }
    }
    function getVoiceSource(voice) {
        if ((voice.name || voice.voiceName).toLowerCase().indexOf("google") >= 0) {
            return "google";
        } else if ((voice.name || voice.voiceName).toLowerCase().indexOf("acapela") >= 0) {
            return "acapela";
        } else if ((voice.name || voice.voiceName).toLowerCase().indexOf("att") >= 0) {
            return "att";
        } else if ((voice.name || voice.voiceName).toLowerCase().indexOf("natural") >= 0) {
            return "natural";
        } else {
            if (voice.voiceURI && voice.voiceURI.toLowerCase().indexOf("com.apple") >= 0) {
                if (
                    (voice.name || voice.voiceName).toLowerCase().indexOf("samantha") >= 0 ||
                    (voice.name || voice.voiceName).toLowerCase().indexOf("daniel") >= 0 ||
                    (voice.name || voice.voiceName).toLowerCase().indexOf("monica") >= 0 ||
                    (voice.name || voice.voiceName).toLowerCase().indexOf("joana") >= 0 ||
                    (voice.name || voice.voiceName).toLowerCase().indexOf("luciana") >= 0 ||
                    (voice.name || voice.voiceName).toLowerCase().indexOf("alva") >= 0 ||
                    self.appleLangs.includes(voice.lang)
                ) {
                    return "apple";
                } else {
                    self.appleLangs.push(voice.lang);
                    return "free";
                }
            } else {
                return "free";
            }
        }
    }
    function getVoicesFromBrowser(browser) {
        return new Promise(function (resolve) {
            browser.tts.getVoices(function (voices) {
                resolve(voices || []);
            });
        })
            .catch((err) => {
            });
    }
    function getVoicesFromSpeechSynthesis() {
        return new Promise(function (resolve) {
            let synth = window.speechSynthesis;
            let id;
            id = setInterval(() => {
                let voices = synth.getVoices();
                if (voices.length !== 0) {
                    resolve(voices);
                    clearInterval(id);
                }
            }, 10);
            setTimeout(() => {
                clearInterval(id);
                resolve([]);
            }, 2000);
        })
            .then(function (voices) {
                return voices;
            })
            .catch((err) => {
            });
    }
    function setPremVoices() {
        return new Promise((resolve) => {
            addVoice('Sharon', 'en-US', 'aca', '21', '1');
            addVoice('Ryan', 'en-US', 'aca', '12', '1');
            addVoice('Heather', 'en-US', 'aca', '5', '1');
            addVoice('Will', 'en-US', 'aca', '26', '1');
            addVoice('Gale', 'en-US', 'google', '-1', '1');
            addVoice('Rod', 'en-US', 'aca', '20', '1');
            addVoice('Karen', 'en-US', 'aca', '27', '1');
            addVoice('Tracy', 'en-US', 'aca', '16', '1');
            addVoice('Mike', 'en-US', 'att', '1', '1');
            addVoice('Laura', 'en-US', 'aca', '8', '1');
            addVoice('Rachel', 'en-GB', 'aca', '11', '1');
            addVoice('Peter', 'en-GB', 'aca', '10', '1');
            addVoice('Lucy', 'en-GB', 'aca', '9', '1');
            addVoice('Gabriel', 'en-GB', 'google', '-1', '1');
            addVoice('Grace', 'en-GB', 'google', '-1', '1');
            addVoice('Charles', 'en-GB', 'att', '2', '1');
            addVoice('Audrey', 'en-GB', 'att', '3', '1');
            addVoice('Graham', 'en-GB', 'aca', '4', '1');
            addVoice('Anna', 'es-ES', 'google', '-1', '1');
            addVoice('Rosa', 'es-ES', 'att', '20', '1');
            addVoice('Alberto', 'es-ES', 'att', '19', '1');
            addVoice('Paula', 'es-ES', 'mac', '7', '1');
            addVoice('Joaquin', 'es-CA', 'mac', '8', '1');
            addVoice('Diego', 'es-MX', 'mac', '5', '1');
            addVoice('Camila', 'es-MX', 'mac', '6', '1');
            addVoice('Mariana', 'es-US', 'google', '-1', '1');
            addVoice('Sophia', 'fr-FR', 'google', '-1', '1');
            addVoice('Alain', 'fr-FR', 'att', '7', '1');
            addVoice('Juliette', 'fr-FR', 'att', '8', '1');
            addVoice('Bruno', 'fr-FR', 'aca', '1', '1');
            addVoice('Alice', 'fr-FR', 'aca', '0', '1');
            addVoice('Emmanuel', 'fr-CA', 'mac', '9', '1');
            addVoice('Marie', 'fr-CA', 'mac', '10', '1');
            addVoice('Louise', 'fr-CA', 'aca', '22', '1');
            addVoice('Celia', 'pt-PT', 'aca', '23', '1');
            addVoice('Andrea', 'pt-PT', 'mac', '18', '1');
            addVoice('Julieta', 'pt-PT', 'mac', '17', '1');
            addVoice('Carolina', 'pt-BR', 'google', '-1', '1');
            addVoice('Renata', 'pt-BR', 'mac', '16', '1');
            addVoice('Mia', 'de-DE', 'google', '-1', '1');
            addVoice('Reiner', 'de-DE', 'att', '5', '1');
            addVoice('Klara', 'de-DE', 'att', '6', '1');
            addVoice('Klaus', 'de-DE', 'aca', '7', '1');
            addVoice('Sarah', 'de-DE', 'aca', '14', '1');
            addVoice('Bertha', 'de-DE', 'mac', '11', '1');
            addVoice('Jakob', 'de-DE', 'mac', '12', '1');
            addVoice('Sofia', 'it-IT', 'google', '-1', '1');
            addVoice('Vittorio', 'it-IT', 'aca', '15', '1');
            addVoice('Chiara', 'it-IT', 'aca', '2', '1');
            addVoice('Mario', 'it-IT', 'mac', '13', '1');
            addVoice('Valentina', 'it-IT', 'mac', '14', '1');
            addVoice('Margreet', 'nl-NL', 'google', '-1', '1');
            addVoice('Anika', 'nl-NL', 'mac', '21', '1');
            addVoice('Markus', 'nl-NL', 'mac', '22', '1');
            addVoice('Emma', 'sv-SE', 'aca', '24', '1');
            addVoice('Erik', 'sv-SE', 'aca', '25', '1');
            addVoice('Gus', 'sv-SE', 'mac', '20', '1');
            addVoice('Maja', 'sv-SE', 'mac', '19', '1');
            resolve();
        })
            .catch((err) => {
            })
    }
    function addVoice(name, language, source, id, ready) {
        if (source === 'google') {
            let googleVoice = self.voices['free'][getVoiceKey(name, language)];
            if (googleVoice && googleVoice.source === 'google') {
                self.voices['prem'][getVoiceKey(name, language)] = {
                    'key': getVoiceKey(name, language),
                    'name': name,
                    'language': language,
                    'source': source,
                    'id': id,
                    'ready': ready,
                    'type': 'prem'
                };
            } else {
            }
        } else {
            self.voices['prem'][getVoiceKey(name, language)] = {
                'key': getVoiceKey(name, language),
                'name': name,
                'language': language,
                'source': source,
                'id': id,
                'ready': ready,
                'type': 'prem'
            };
        }
    }
    function addPlusVoice(name, language, source, id, ready) {
        self.voices['plus'][getVoiceKey(name, language)] = {
            'key': getVoiceKey(name, language),
            'name': name,
            'language': language,
            'source': source,
            'id': id,
            'ready': ready,
            'type': 'plus'
        };
    }
    function setPlusVoices() {
        addPlusVoice('Matthew', 'en-US', 'aws', '0', '1');
        addPlusVoice('Joanna', 'en-US', 'aws', '1', '1');
        addPlusVoice('Guy', 'en-US', 'ms', '0', '1');
        addPlusVoice('Jessa', 'en-US', 'ms', '1', '1');
        addPlusVoice('Joey', 'en-US', 'aws', '2', '1');
        addPlusVoice('Salli', 'en-US', 'aws', '3', '1');
        addPlusVoice('Kimberly', 'en-US', 'aws', '4', '1');
        addPlusVoice('Kendra', 'en-US', 'aws', '5', '1');
        addPlusVoice('Brian', 'en-GB', 'aws', '6', '1');
        addPlusVoice('Emma', 'en-GB', 'aws', '7', '1');
        addPlusVoice('Kate', 'en-GB', 'ibm', '0', '1');
        addPlusVoice('Amy', 'en-GB', 'aws', '8', '1');
        addPlusVoice('Russell', 'en-AU', 'aws', '9', '1');
        addPlusVoice('Nicole', 'en-AU', 'aws', '10', '1');
        addPlusVoice('Raveena', 'en-IN', 'aws', '12', '1');
        addPlusVoice('Aditi', 'en-IN', 'aws', '13', '1');
        addPlusVoice('Geraint', 'en-CY', 'aws', '11', '1');
        addPlusVoice('Enrique', 'es-CA', 'aws', '42', '1');
        addPlusVoice('Conchita', 'es-CA', 'aws', '43', '1');
        addPlusVoice('Penélope', 'es-US', 'aws', '40', '1');
        addPlusVoice('Miguel', 'es-US', 'aws', '41', '1');
        addPlusVoice('Mathieu', 'fr-FR', 'aws', '37', '1');
        addPlusVoice('Céline', 'fr-FR', 'aws', '38', '1');
        addPlusVoice('Chantal', 'fr-CA', 'aws', '39', '1');
        addPlusVoice('Inês', 'pt-PT', 'aws', '19', '1');
        addPlusVoice('Cristiano', 'pt-PT', 'aws', '20', '1');
        addPlusVoice('Vitória', 'pt-BR', 'aws', '21', '1');
        addPlusVoice('Ricardo', 'pt-BR', 'aws', '22', '1');
        addPlusVoice('Vicki', 'de-DE', 'aws', '44', '1');
        addPlusVoice('Marlene', 'de-DE', 'aws', '45', '1');
        addPlusVoice('Hans', 'de-DE', 'aws', '46', '1');
        addPlusVoice('Giorgio', 'it-IT', 'aws', '33', '1');
        addPlusVoice('Carla', 'it-IT', 'aws', '34', '1');
        addPlusVoice('Ruben', 'nl-NL', 'aws', '27', '1');
        addPlusVoice('Lotte', 'nl-NL', 'aws', '28', '1');
        addPlusVoice('Astrid', 'sv-SE', 'aws', '15', '1');
        addPlusVoice('Naja', 'da-DK', 'aws', '47', '1');
        addPlusVoice('Mads', 'da-DK', 'aws', '48', '1');
        addPlusVoice('Karl', 'is-IS', 'aws', '35', '1');
        addPlusVoice('Dóra', 'is-IS', 'aws', '36', '1');
        addPlusVoice('Liv', 'no-NO', 'aws', '29', '1');
        addPlusVoice('Maja', 'pl-PL', 'aws', '23', '1');
        addPlusVoice('Jan', 'pl-PL', 'aws', '24', '1');
        addPlusVoice('Jacek', 'pl-PL', 'aws', '25', '1');
        addPlusVoice('Ewa', 'pl-PL', 'aws', '26', '1');
        addPlusVoice('Carmen', 'ro-RO', 'aws', '18', '1');
        addPlusVoice('Tatyana', 'ru-RU', 'aws', '16', '1');
        addPlusVoice('Maxim', 'ru-RU', 'aws', '17', '1');
        addPlusVoice('Filiz', 'tr-TR', 'aws', '14', '1');
        addPlusVoice('Gwyneth', 'cy-GB', 'aws', '49', '1');
    }
    function getVoices(request, sender, sendResponse) {
        let voiceType = request.type;
        sendResponse(self.voices[voiceType]);
    }
    function getDefaultVoice(request, sender, sendResponse) {
        let voiceType = request.type;
        let defaultVoice = '';
        switch (voiceType) {
            case 'free':
                defaultVoice = self.defaultFreeVoice;
                break;
            case 'prem':
                defaultVoice = self.defaultPremVoice;
                break;
            case 'plus':
                defaultVoice = self.defaultPlusVoice;
                break;
        }
        sendResponse(defaultVoice);
    }
    function getVoice(request, sender, sendResponse) {
        sendResponse(self.voices[request.voiceType][request.voiceKey]);
    }
    init();
}
const voices = new Voices();
