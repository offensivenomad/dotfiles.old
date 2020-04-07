$("#readSlider").ionRangeSlider({
    skin: "round",
    type: "single",
    min: 0,
    max: 0,
    from: 0,
    step: 1,
    grid: false,
    hide_min_max: true,
    hide_from_to: true,
    force_edges: true,
    onFinish: function (data) {
        invokeProgressChange(data['from']);
    },
    onUpdate: function (data) {
        setTimeout(addMarks(data.slider), 100) ;
    }
});
$("#readbarSlider").ionRangeSlider({
    skin: "round",
    type: "single",
    min: 0,
    max: 0,
    from: 0,
    step: 1,
    grid: false,
    hide_min_max: true,
    hide_from_to: true,
    force_edges: true,
    onFinish: function (data) {
        invokeProgressChange(data['from']);
    },
    onUpdate: function (data) {
        setTimeout(addMarks(data.slider), 100) ;
    }
});
let progressObj = {
    displayTexts: [],
    marks: [], 
    readOption: 'all',
    type: 'sentence',
    max: 0,
    min: 0,
    curSenIdx: 0,
    curPageIdx: -1,
};
let defaultSentenceCountInOnePage = 10;
$("#readSliderMaxSender").on('change', function(e) {
    if (e.target.value) {
        var _maxValue = JSON.parse(e.target.value);
        progressObj.displayTexts = _maxValue.texts;
        progressObj.readOption = _maxValue.readOption;
        if (_maxValue.pageCount > 1 && _maxValue.readOption != 'selection') {
            progressObj.type = 'page';
        } else {
            progressObj.type = 'sentence';
        }
        if (progressObj.type === 'sentence') {
            progressObj.max = getMaxValueByTexts(_maxValue.texts) -1;
        } else {
            progressObj.max = getMaxValueByPageCount(_maxValue.pageCount) -1;
        }
        $("#readSlider").data("ionRangeSlider").update({
            max: progressObj.max
        });
        $("#readbarSlider").data("ionRangeSlider").update({
            max: progressObj.max
        });
        _maxValue['max'] = progressObj.max
        $("#readSliderMaxSender").val(JSON.stringify(_maxValue));
    }
});
function addMarks($slider) {
    var html = '';
    var left = 0;
    var constraintNumber = 20;
    var markNumber = 0;
    var pickRate = progressObj.marks.length / constraintNumber;
    var pickMarkIndex = [];
    if (constraintNumber < progressObj.marks.length) {
        markNumber = constraintNumber;
    } else {
        markNumber = progressObj.marks.length;
    }
    for (var mIndex = 0; mIndex < markNumber; mIndex++) {
        if (pickRate > 1) {
            var pickIndex = parseInt(mIndex * pickRate);
            pickMarkIndex.push(pickIndex);
        } else {
            pickMarkIndex.push(mIndex);
        }
    }
    for (var i = 0; i < progressObj.marks.length; i++) {
        if (pickMarkIndex.includes(i)) {
            left = convertToPercent(progressObj.marks[i]);
            html += '<span class="mark" style="left: ' + left + '%">' + '</span>';
            html += '<span class="clickablemark" tag='+ i + ' style="left: ' + left + '%">' + '</span>';    
        }
    }
    $slider.append(html);
    $slider.children(".clickablemark").hover(function () {
        var currentdotposition = $(this).position();
        var width = $(window).width();
        var maxLeft = currentdotposition.left + 200;
        if (maxLeft >= width) {
            maxLeft = currentdotposition.left - 100;
        } else {
            maxLeft = currentdotposition.left;
        }
        $("#nr-ext-bar-header-text").last().offset({ left: maxLeft });
        $("#nr-ext-bar-content-text").last().offset({ left: (maxLeft + 200) });
        var triggerSliderValue = parseInt($(this).attr("tag"));
        if (progressObj.type === 'sentence') {
            $(".nr-ext-slider-text").text(progressObj.displayTexts[triggerSliderValue]);
        } else {
            $(".nr-ext-slider-text").text('Page ' + (triggerSliderValue + 1));
        }
        $(".nr-ext-slider-text").css('display','-webkit-box');
    }, function () {
        $(".nr-ext-slider-text").css('display','none');
        $(".nr-ext-slider-text").text('');
    });
    $slider.children(".clickablemark").click(function () {
        var triggerSliderValue = parseInt($(this).attr("tag"));
        var _index = progressObj.marks[triggerSliderValue];
        invokeProgressChange(_index);
        $("#readSlider").data("ionRangeSlider").update({
            from: _index
        });
        $("#readbarSlider").data("ionRangeSlider").update({
            from: _index
        });
    });
}
function invokeProgressChange(value) {
    var _readValue = {
        sentenceIndex: 0,
        pageIndex: -1,
        percentage: 0,
        lastModified: 'sentence',
        tag: 'range-slider-init',
        value: value
    };
    if (progressObj.type === 'sentence') {
        _readValue.sentenceIndex = getMarkIndexByValue(value);
    } else {
        var rate = value / defaultSentenceCountInOnePage;
        var _page = Math.floor(rate);
        var _decimal = rate - _page;
        if (_page == progressObj.curPageIdx) {
            _readValue.sentenceIndex = Math.floor(progressObj.displayTexts.length * _decimal);
            _readValue.pageIndex = _page;
            _readValue.percentage = 0;
            _readValue.lastModified = 'sentence';
        } else{
            _readValue.pageIndex = _page;
            _readValue.percentage = _decimal;
            _readValue.lastModified = 'page';
        }
    }
    $("#readSliderValueSender").val(JSON.stringify(_readValue));
    var ev = new Event('change');
    document.getElementById('readSliderValueSender').dispatchEvent(ev);
}
function convertToPercent (num) {
	var percent = num / progressObj.max * 100;
	return percent;
}
function getMaxValueByTexts(texts) {
    var wordCount = 0;
    progressObj.marks = [];
    for (var i=0; i < texts.length; i++) {
        progressObj.marks.push(wordCount);
        var _count = texts[i].split(' ').length;
        wordCount += _count;
    }
    return wordCount;
}
function getMaxValueByPageCount(pageCount) {
    progressObj.marks = [];
    var _sliderMax = pageCount * defaultSentenceCountInOnePage;
    for (var i=0; i < pageCount; i++) {
        progressObj.marks.push(i * defaultSentenceCountInOnePage);
    }
    return _sliderMax;
}
function getMarkIndexByValue(value) {
    for (var i = 0; i < progressObj.marks.length; i++) {
        if (value >= progressObj.marks[i]) {
            if (i + 1 < progressObj.marks.length) {
                if (value < progressObj.marks[i+1]) {
                    return i;
                }
            } else {
                return i;
            }
        }
    }
    return 0;
}
$("#readSliderValueSender").on('change', function(e) {
        var value = 0;
        var sliderValue = JSON.parse(e.target.value);
        progressObj.curSenIdx = sliderValue.sentenceIndex;
        progressObj.curPageIdx = sliderValue.pageIndex;
        if (sliderValue.tag !== 'range-slider-init') {
            if (progressObj.type === 'sentence') {
                value = progressObj.curSenIdx;
                if (value < progressObj.marks.length) {
                    value = progressObj.marks[value];
                } else {
                    value = progressObj.marks[progressObj.marks.length-1];
                }
            } else {
                value = progressObj.curPageIdx * defaultSentenceCountInOnePage + Math.floor(progressObj.curSenIdx / progressObj.displayTexts.length * 10);
            }
            if (value > $("#readSlider").data("ionRangeSlider").options.max) {
                value = $("#readSlider").data("ionRangeSlider").options.max;
            } else {
                if (value < $("#readSlider").data("ionRangeSlider").options.min) {
                    value = $("#readSlider").data("ionRangeSlider").options.min;
                }
            }
            $("#readSlider").data("ionRangeSlider").update({
                from: value
            });
            $("#readbarSlider").data("ionRangeSlider").update({
                from: value
            });
            sliderValue['value'] = value;
            $("#readSliderValueSender").val(JSON.stringify(sliderValue));
        }
});
$("#speedSlider").ionRangeSlider({
    skin: "round",
    type: "single",
    min: -10,
    max: 10,
    from: 0,
    step: 1,
    grid: false,
    hide_min_max: true,
    hide_from_to: true,
    force_edges: true,
    onChange: function (data) {
        //
        updateSpeedText(data['from']);
    },
    onFinish: function (data) {
        $("#speedSliderValueSender").val(data['from']);
        var ev = new Event('change');
        document.getElementById('speedSliderValueSender').dispatchEvent(ev);
    },
});
$("#speedSliderValueSender").on('change', function(e) { 
    var value = 0;
    if (!isNaN(e.target.value)) {
        value = e.target.value;
    }
    if (value > $("#speedSlider").data("ionRangeSlider").options.max) {
        value = $("#speedSlider").data("ionRangeSlider").options.max;
    } else {
        if (value < $("#speedSlider").data("ionRangeSlider").options.min) {
            value = $("#speedSlider").data("ionRangeSlider").options.min;
        }
    }
    $("#speedSlider").data("ionRangeSlider").update({
        from: value
    });
    updateSpeedText(value);
});
function updateSpeedText(value) {
    let tmpSpeed = value;
    if (value > 0) {
        tmpSpeed = '+' + value;
    }
    $('#speedText').text(tmpSpeed);
}
function initTooltip(elem, direction, text) {
    let tooltip = setTooltip(elem, direction, text);
    $(elem).hover(() => {
        $(tooltip).css("display", "block");
        $(tooltip).css("visibility", "visible");
    }, () => {
        $(tooltip).css("display", "none");
    })
}
function setTooltip(elem, direction, text) {
    let tooltip = document.createElement("span");
    $(tooltip).addClass(direction + 'Tooltip');
    $(tooltip).css("display", "none");
    $(tooltip).html(text);
    $(elem).append(tooltip);
    return tooltip;
}
function setTooltipText(elem, direction, text) {
    $(elem + " ." + direction + "Tooltip").html(text);
}
