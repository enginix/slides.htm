var l_ma = {};
function l_i(a) { if (a in l_ma) return l_ma[a]; return l_ma[a] = navigator.userAgent.toLowerCase().indexOf(a) != -1 }
function l_h(){return l_i("msie")&&!window.opera}
function l_ha(){return l_i("safari")||l_i("konqueror")}

var l_ra={Xa:function(a){return a.document.body.scrollTop},Ya:function(a){return a.document.documentElement.scrollTop},Va:function(a){return a.pageYOffset}};
var l_sa={Xa:function(a){return a.document.body.scrollLeft},Ya:function(a){return a.document.documentElement.scrollLeft},Va:function(a){return a.pageXOffset}};
var l_ta={Xa:function(a){return a.document.body.clientHeight},Ya:function(a){return a.document.documentElement.clientHeight},Va:function(a){return a.innerHeight}};
function l_r(a,b){try{if(!window.opera&&"compatMode"in a.document&&a.document.compatMode=="CSS1Compat")return b.Ya(a);else if(l_h())return b.Xa(a)}catch(c){}return b.Va(a)}

function getPageHeight(w) {
    return l_r(w || window,l_ta)
}
function getPageOffsetX(w){
    return l_r(w || window,l_sa)
}
function getPageOffsetY(w){
    return l_r(w || window,l_ra)
}

function escapeHtml(a){
    if(!a)return '';

    var m = {'&': '&amp;', '>': '&gt;', '<': '&lt;', ' ': '&nbsp;'};
    return a.replace(/[&<> ]/g,function(a){
            return m[a];
        });
}


// Sporx
var Sporx = window.Sporx = function() {};

var savedAnchor;

Sporx.prototype = {
    init: function() {
        // original font size basis
        this.size = 9;

        // slides area
        this.canvas   = document.getElementById('canvas');
        this.$canvas = $(this.canvas);

        // toolbar init
        this.toolbar = document.getElementById('toolbar');
        this.toolbarHeight   = this.toolbar.offsetHeight;
        this.hideToolbar();

        // progressbar
        this.progressbar = document.getElementById('progress').querySelector('span');

        // slides content data
        this.content = document.getElementById('content');
        var slidesText = document.getElementById('builtin-code').value;
        this.slides = this.splitSlides(slidesText);

        document.getElementById("max-page").textContent = this.slides.length;

        this.current = 0;
        if (String(location).match(/#(\d+)$/)) {
            this.current = parseInt(RegExp.$1, 10) - 1;
        }

        this.currentImgWidth = 0;
        this.currentImgHeight = 0;

        if (this.slides.length) {
            if (!document.title) {
                var page = this.slides[0];
                var m = page.match(/^\s*((?:\S[^\n]+\n)+)/);
                if (m[1]) {
                    var title = m[1].replace(/[\r\n]/g, ' ')
                                    .replace(/\{\{(.*?\|)?\s*/g, '')
                                    .replace(/\s*\}\}/g, '');
                    document.title = title;
                }
            }

            this.urlPrefix = ('' + location.href).split('?')[0].replace(/[^\/]+$/, '');
            this.takahashi();
        }

        // adjust size
        // this.adjustCanvasSize();
        $(window).resize(() => this.adjustCanvasSize());
        // window.addEventListener("orientationchange", () => this.adjustCanvasSize(), false);

        // swipe handler on mobile device
        this.touch = {
            startX: 0,
            startY: 0,
            startSpan: 0,
            startCount: 0,
            captured: false,
            threshold: 60,
        };
        document.addEventListener('touchstart', (e) => this.onTouchStart(e), false);
        document.addEventListener('touchmove', (e) => this.onTouchMove(e), false);
        document.addEventListener('touchend', (e) => this.onTouchEnd(e), false);
    },

    takahashi: function (cb) {
        var me = this;

        var num = this.current;
        this.updateUrl();

        document.getElementById("current_page").value = num + 1;

        this.$canvas.attr('rendering', true);

        var currentSlide = this.slides[num];
        if (!currentSlide) return;

        currentSlide = currentSlide.
            replace(/^[\r\n]+/, "").
            replace(/[\r\n]+$/, "").
            replace(/(\r\n|\r)/g, "\n").
            split('\n');

        this.content.innerHTML = ''; // clear previous content
        this.currentImgHeight = 0;
        this.currentImgWidth = 0;

        var line;

        while (line = currentSlide.shift()) {
            this.content.appendChild(document.createElement('div'));
            this.content.lastChild.setAttribute('align', 'center');

            if (line.match(/^\*\s+/)) {
                var ul = document.createElement('ul');
                while (line.match(/^\*\s+/)) {
                    var li = document.createElement('li');
                    var lineText = line.replace(/^\*\s+/, '');
                    li.appendChild(document.createElement('div'));
                    this.inlineMarkupMess(lineText, li);
                    ul.appendChild(li);
                    line = currentSlide.shift();
                    if (!line) line = '';
                }
                this.content.appendChild(ul);
                continue;
            }

            // break on whitespace line
            if (line.charAt(0) === ' ') {
                this.content.lastChild.setAttribute('align', 'left');
                this.content.lastChild.setAttribute('class', 'pre-big');
                line = line.substring(1);
            }

            this.inlineMarkupMess(line, this.content);
        }

        this.updateProgress();

        // 调整 slide 适应屏幕尺寸
        window.setTimeout(function () {
            sporx.adjustCanvasSize();
            me.$canvas.removeAttr('rendering');
            if (cb) {
                setTimeout(cb, 100);
            }
        }, 100);
    },

    dispatch: function () {
        var anchor = location.hash;
        anchor = anchor.replace(/^\#/, '');
        if (anchor == savedAnchor) {
            return;
        }

        if (anchor == "") {
            anchor = '#1';
            location.hash = anchor;
        }

        savedAnchor = anchor;
        var match = anchor.match(/^\d+$/);
        if (match) {
            sporx.showSlide(parseInt(match[0]) - 1);
        } else {
            location.hash = savedAnchor = '#' + (sporx.current + 1);
        }
    },

    updateUrl: function() {
        location.hash = '#' + (this.current + 1);
    },

    adjustCanvasSize: function () {
        // console.log(arguments.callee.caller);
        if (!this.content) return;

        var pageHeight = document.body.clientHeight;
        var pageWidth = document.body.clientWidth;

        var contentStyle = this.content.style;
        function setFontSize(s) {
            s += 1
            contentStyle.fontSize = (s < 1 ? 1 : s) + 'px';
        }

        setFontSize(this.size);

        if (this.content.offsetHeight) {
            $('#content').css('max-width', (pageWidth - 4) + 'px');
            $('#content').css('max-height', '');
            var canvasWidth = this.canvas.offsetWidth;
            var canvasHeight = this.canvas.offsetHeight;

            if (canvasWidth < this.currentImgWidth
                || canvasHeight < this.currentImgHeight)
            {
                $('#canvas img').css('max-width', (pageWidth - 4) + 'px');
                $('#canvas img').css('max-height', pageHeight * 0.9 + 'px');
            }

            // set new font size
            var contentWidth = this.content.offsetWidth;
            var newFontSize = Math.floor((canvasWidth*0.9 / contentWidth) * this.size);
            setFontSize(newFontSize);

            // adjust for height
            var contentHeight = this.content.offsetHeight;
            if (contentHeight >= canvasHeight) {
                newFontSize = Math.floor((canvasHeight*0.9 / contentHeight) * newFontSize);
                setFontSize(newFontSize);

                if (this.content.offsetHeight >= canvasHeight) {
                    $('#content').css('max-height', pageHeight + 'px');
                }
            }
        }
    },

    inlineMarkupMess: function(line, content) {

        var uri;
        /* + + + + + + + + + + + + + +
        ^
        ((?:
            [^\{]
            |
            \{[^\{]
        )+)?
        (
            \{\{ima?ge? +src="([^"]+)" +width="([0-9]+)" +height="([0-9]+)"[^\}]*\}\}       -> {{img src width height}}
            |                                                                               -> {{image src width height}}
            \{\{(([^\|]+)?\||)(.+?)\}\}     -> {{abc||def}}
        )
        (.+)?


        $1  -> 普通文本
        $2  -> 图像和特殊标记
        $3  -> 图像地址
        $4  -> 图像宽度
        $5  -> 图像高度
        $6  -> abc||def 这样标记中的 abc||
        $7  -> abc||def 这样标记中的 abc
        $8  -> abc||def 这样标记中的 def
        $9  -> 剩余数据
        + + + + + + + + + + + + + + */

        var m;
        while (m = line.match(/^((?:[^\{]|\{[^\{])+)?(\{\{ima?ge? +src="([^"]+)" +width="([0-9]+)" +height="([0-9]+)"[^\}]*\}\}|\{\{(([^\|]+)?\||)(.+?)\}\})(.+)?/)) {
            if (RegExp.$1) {
                content.lastChild.appendChild(
                    document.createElement('span')
                );
                content.lastChild.lastChild.innerHTML = escapeHtml(RegExp.$1);
            }

            // Images
            if (/^((?:[^\{]|\{[^\{])+)?\{\{ima?ge? +src="([^\"]+)" +width="([0-9]+)" +height="([0-9]+)"[^\}]*\}\}/.test(line)) {
                content.lastChild.appendChild(document.createElement('div'));
                content.lastChild.lastChild.className = 'spinner';

                content.lastChild.appendChild(document.createElement('img'));

                var imageSrc = RegExp.$2;
                if (imageSrc.indexOf('http://') < 0 &&
                    imageSrc.indexOf('https://') < 0) {
                    imageSrc = this.urlPrefix + imageSrc;
                }

                var imgNode = content.lastChild.lastChild;
                imgNode.src = imageSrc;
                imgNode.width = parseInt(RegExp.$3 || '0');
                imgNode.height = parseInt(RegExp.$4 || '0');
                imgNode.alt = "";
                me = this;
                imgNode.addEventListener('load', function (e) {
                    $('.spinner').remove();
                    me.adjustCanvasSize();
                });

                imgNode.addEventListener('error', function (e) {
                    $('.spinner').remove();
                    var imgContainer = e.target.parentNode;
                    imgContainer.appendChild(document.createElement('div'));
                    imgContainer.lastChild.textContent = 'The image could not be loaded. Check the network setting or refresh.';
                    imgContainer.lastChild.style.fontSize = '24px';
                });

                this.currentImgWidth = Math.max(this.currentImgWidth, parseInt(RegExp.$3 || '0'));
                this.currentImgHeight += parseInt(RegExp.$4 || '0');
            }

            // Styles 普通带 class 文本，不是 link
            else if (/^((?:[^\{]|\{[^\{])+)?\{\{(#([^\|]+)?\|)(.+?)\}\}/.test(line)) {
                uri = RegExp.$4;    // 误导的变量名
                className = RegExp.$3;
                content.lastChild.appendChild(document.createElement('span'));
                content.lastChild.lastChild.innerHTML = escapeHtml(uri);
                content.lastChild.lastChild.className = className;
            }

            // Links
            else if (/^((?:[^\{]|\{[^\{])+)?\{\{(([^\|]+)?\||)([^\}]+)\}\}/.test(line)) {
                uri = RegExp.$4;
                if (uri.indexOf('://') < 0)
                    uri = this.urlPrefix + uri;
                content.lastChild.appendChild(document.createElement('a'));

                content.lastChild.lastChild.innerHTML = escapeHtml(RegExp.$3 || RegExp.$4);
                content.lastChild.lastChild.href = uri;
                content.lastChild.lastChild.title = uri;
                content.lastChild.lastChild.target = '_blank';
                content.lastChild.lastChild.className = 'link-text';
            }

            line = m[9] || '';
        }

        if (line) {
            content.lastChild.appendChild(document.createElement('span'));
            content.lastChild.lastChild.innerHTML = escapeHtml(line);
        }

    },

    nextSlide: function() {
        if (this.current < (this.slides.length - 1)) {
            this.current++;
            this.takahashi();
        }
    },

    prevSlide: function() {
        if (this.current > 0) {
            this.current--;
            this.takahashi();
        }
    },

    firstSlide: function() {
        if (this.current != 0) {
            this.current = 0;
            this.takahashi();
        }
    },

    lastSlide: function() {
        if (this.current != this.slides.length - 1) {
            this.current = this.slides.length - 1;
            this.takahashi();
        }
    },

    showSlide: function(n) {
        n = Math.min(this.slides.length - 1, Math.max(0, n));

        if (this.current != n) {
            this.current = n;
            this.takahashi();
        }
    },

    splitSlides: function(text) {
        var slides = text.
            replace(/\n__END__\r?\n[\s\S]*/m, '\n').
            replace(/&amp;/g, '&').
            replace(/&lt;/g, '<').
            split(/----[\r\n]/);

        for (var i = 0; i < slides.length; i++) {
            var slide = slides[i];

            // 去除 # 开头的 slide
            if (slide.match(/^\n*$/) || slide.match(/^\s*#/)) {
                slides.splice(i, 1);
                i--;
                continue;
            }

            // + 开头的 条目 单独分到页面里去
            var set = [];
            if (slide.match(/^([\s\S]*?\n)\+/)) {
                while (slide.match(/^([\s\S]*?\n)\+/)) {
                    set.push(RegExp.$1);
                    slide = slide.replace(/\n\+/, '\n');
                }
                set.push(slide);
            }
            if (set.length) {
                slides.splice(i, 1, set[0]);
                for (var j = 1; j < set.length; j++) {
                    slides.splice(++i, 0, set[j]);
                }
            }
        }

        for (i = slides.length - 1; i >= 0; i--) {
            slides[i] = slides[i].replace(/\\(["\\])/g, '$1');
        }

        return slides;
    },

    toggleColor: function (btn) {
        var me = this;

        var $btn = $(btn);
        var toDark = $btn.is('.to-dark');
        if (toDark) {
            $btn.removeClass('to-dark');
            $(document.body).addClass('dark-style');
        } else {
            $btn.addClass('to-dark');
            $(document.body).removeClass('dark-style');
        }
    },

    printPdf: function () {
        var me = this;
        var xx = $('<div/>');
        var cont = $(me.content);
        var h = $(me.canvas).height();
        var i = this.slides.length - 1;

        if (adjustTimer) {
            clearInterval(adjustTimer);
            adjustTimer = null;
        }

        if (dispatchTimer) {
            clearInterval(dispatchTimer);
            dispatchTimer = null;
        }

        function step() {
            xx.prepend(cont.clone().attr("_id", me.current).css({
                'height': h,
                'page-break-after': 'always',
                //'align-items': 'center',
                'justify-content': 'center',
                'display': 'flex',
                'flex-direction': 'column',
                'font-family': '"Consola", "微软雅黑", "Candara", "Georgia", "DejaVu Serif Condensed", "Arial", "Bitstream Vera Sans", "Verdana", "Apple LiGothic", "Arial Black", "Bitstream Vera Sans", sans-serif',
            }));
            // console.log(me.content, h);

            if (i > 0) {
                me.current = --i;
                setTimeout(proc, 0);

            } else {
                xx.prependTo(document.body);
                $(document.body).addClass('in-print');
                window.print();
                $(document.body).removeClass('in-print');
            }
        }

        function proc() {
            me.takahashi(step);
        }

        me.current = i;
        proc();
    },

    onToolbarArea: false,
    toolbarHeight: 0,
    isToolbarHidden: false,

    toolbarHandler: function(event) {
        this.onToolbarArea = (event.clientY < this.toolbarHeight);

        if (this.isToolbarHidden && this.onToolbarArea) {
            this.showToolbar();
        } else if (!this.onToolbarArea && !this.isToolbarHidden) {
            this.hideToolbar();
        }
    },

    hideToolbar: function () {
        this.toolbar.style.top = '-100px';
        this.isToolbarHidden = true;
    },

    showToolbar: function () {
        this.toolbar.style.top = '0px';
        this.isToolbarHidden = false;
    },

    onTouchStart: function (event) {
        this.touch.startX = event.touches[0].clientX;
        this.touch.startY = event.touches[0].clientY;
        this.touch.startCount = event.touches.length;
    },

    onTouchMove: function (event) {
        // Each touch should only trigger one action
        if (!this.touch.captured) {
            var currentX = event.touches[0].clientX;
            var currentY = event.touches[0].clientY;

            // There was only one touch point, look for a swipe
            if (event.touches.length === 1 && this.touch.startCount !== 2) {
                var deltaX = currentX - this.touch.startX,
                    deltaY = currentY - this.touch.startY;

                if (deltaX > this.touch.threshold && Math.abs(deltaX) > Math.abs(deltaY)) {
                    this.touch.captured = true;
                    this.prevSlide();
                } else if (deltaX < -this.touch.threshold && Math.abs(deltaX) > Math.abs(deltaY)) {
                    this.touch.captured = true;
                    this.nextSlide();
                }
            }
        }
    },

    onTouchEnd: function (event) {
        this.touch.captured = false;
    },

    updateProgress: function () {
        var current = this.current === 0 ? 0 : this.current + 1;
        var total = this.slides.length;
        this.progressbar.style.width = (current / total) * window.innerWidth + 'px';
    },
}

//------------------------------------------------------------------------------
// Initialization code
//------------------------------------------------------------------------------

var sporx;
var adjustTimer;
var dispatchTimer;

$(window).ready(function () {
    sporx = new Sporx();
    sporx.init();

    adjustTimer = setInterval(function () {
        var sel;
        if (document.getSelection) {
            sel = document.getSelection();
        } else {
            sel = document.selection;
        }

        if (!sel) {
            sporx.adjustCanvasSize();
        }
    }, 200);

    dispatchTimer = setInterval(sporx.dispatch, 500);

    $(document.body).mousemove(function(e){
        sporx.toolbarHandler(e);
    });

    $(document).keydown(function(e){
        //alert("Hi");
        if (String(location.hash).match(/^#edit$/))
            return;

        if (e.altKey || e.ctrlKey) {
            return;
        }

        key = e.keyCode;

        //alert("key: " + key);
        switch(key) {
            case 8:
            case 33:
            case 37:
            case 38:
            case 112:
                e.preventDefault();
                sporx.prevSlide();
                break;
            case 13:
            case 32:
            case 34:
            case 39:
            case 40:
            case 110:
                e.preventDefault();
                sporx.nextSlide();
                break;
            default:
                break;
        }
    });
});

//------------------------------------------------------------------------------
// Sporx String Filters
//------------------------------------------------------------------------------
String.prototype.convertPerl5ToPerl6 = function() {
    return this.replace(/print/g, 'say');
}

String.prototype.current = function(regexp) {
    return this.replace(regexp, '{{#c|$1}}');
}

String.prototype.color = function(regexp) {
    return this.current(regexp);
}


/*

<commandset>
 <command id="cmd_forward" oncommand="if (Sporx.isPresentationMode) Sporx.forward();"/>
 <command id="cmd_back" oncommand="if (Sporx.isPresentationMode) Sporx.back();"/>
 <command id="cmd_home" oncommand="if (Sporx.isPresentationMode) Sporx.home();"/>
 <command id="cmd_end" oncommand="if (Sporx.isPresentationMode) Sporx.end();"/>
</commandset>

<keyset>
 <key key=" "                   command="cmd_forward"/>
 <key keycode="VK_ENTER"        command="cmd_forward"/>
 <key keycode="VK_RETURN"       command="cmd_forward"/>
 <key keycode="VK_PAGE_DOWN"    command="cmd_forward"/>
 <key keycode="VK_RIGHT"        command="cmd_forward"/>
 <key keycode="VK_DOWN"         command="cmd_forward"/>
 <!--key keycode="VK_BACK_SPACE"   command="cmd_back"/-->
 <key keycode="VK_UP"           command="cmd_back"/>
 <key keycode="VK_PAGE_UP"      command="cmd_back"/>
 <!--<key keycode="VK_BACK_UP"    command="cmd_back"/>-->
 <!--<key keycode="VK_BACK_LEFT"  command="cmd_back"/>-->
 <key keycode="VK_HOME"         command="cmd_home"/>
 <!--<key keycode="VK_END"        command="cmd_end"/>-->

 <key key="n" modifiers="accel" oncommand="Sporx.addPage();"/>
 <key key="r" modifiers="accel" oncommand="window.location.reload();"/>
 <key key="e" modifiers="accel" oncommand="Sporx.toggleEditMode();"/>
 <key key="a" modifiers="accel" oncommand="Sporx.toggleEvaMode();"/>
</keyset>



<!-- ***** BEGIN LICENSE BLOCK *****
   - Version: MPL 1.1
   -
   - The contents of this file are subject to the Mozilla Public License Version
   - 1.1 (the "License"); you may not use this file except in compliance with
   - the License. You may obtain a copy of the License at
   - http://www.mozilla.org/MPL/
   -
   - Software distributed under the License is distributed on an "AS IS" basis,
   - WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
   - for the specific language governing rights and limitations under the
   - License.
   -
   - The Original Code is the Takahashi-Method-based Presentation Tool in XUL.
   -
   - The Initial Developer of the Original Code is SHIMODA Hiroshi.
   - Portions created by the Initial Developer are Copyright (C) 2005
   - the Initial Developer. All Rights Reserved.
   -
   - Contributor(s): SHIMODA Hiroshi <piro@p.club.ne.jp>
   -
   - ***** END LICENSE BLOCK ***** -->

*/
// vim: se ts=4 sts=4 sw=4 :
