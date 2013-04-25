/**
 *  Kaban.tv plugin for Showtime by Buksa
 *
 *  Copyright (C) 2013 Buksa
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
// Version 1.4
//
(function(plugin) {
    var PREFIX = "Kaban.tv";
    var BASE_URL = "http://kaban.tv";
    var service = plugin.createService("Kaban.tv", PREFIX + ":start", "video", true, plugin.path + "img/logo.png");
    var jsonCurTime = showtime.JSONDecode(showtime.httpGet(BASE_URL + "/current-time"));
    this.date = jsonCurTime.currentTime.date;
    this.CDL = jsonCurTime.currentTime.millis;
    showtime.print(date + CDL)

    function startPage(page) {
        var channels = [];
        page.type = "directory";
        page.contents = "items";
        page.loading = false;
        channels = getChannels(BASE_URL);
        ch_list(page, channels);
        page.metadata.logo = plugin.path + "img/logo.png";
        page.metadata.title = "Kaban.tv : Список Каналов";
    }
    plugin.addURI(PREFIX + ":play:(.*)", function(page, url) {
        page.type = "video";
        var stream = getStream(url);
        showtime.trace('Video Playback: Reading ' + stream);
        if (showtime.probe(stream).result === 0) {
            page.source = "videoparams:" + showtime.JSONEncode({
                canonicalUrl: PREFIX + ":play:" + url,
                sources: [{
                    url: stream
                }]
            });
        } else page.error("Линк не проигрывается :(");
        page.loading = false;
    });
    plugin.addURI(PREFIX + ":channel:(.*):(.*):(.*)", function(page, link, date, title) {
        page.entries = 0;
        page.type = "directory";
        var url = (BASE_URL + '/tv/' + link.replace('tv5kanal', '5kanal') + '/' + date);
        var v = getDayDifference(date, -1).date;
        page.appendItem(PREFIX + ":channel:" + link + ':' + v + ':' + title, "video", {
            title: new showtime.RichText('Архив Канала за' + '<font color="6699CC"> [' + v + '] </font>'),
            icon: plugin.path + "img/" + link + ".png",
            description: new showtime.RichText('Канал Архив за <font color="6699CC">[' + v + '] </font>')
        });
        var json = showtime.JSONDecode(showtime.httpGet(url).toString());
        shTvPr(page, json, CDL);
        page.metadata.title = title + ": Программа Канала за " + json[0].tvChannelItemUI.dateName;
        page.loading = false;
    });

    function getChannels(url) {
        var html = showtime.httpGet(url).toString();
        var channels = [];
        var content = getValue(html, '<ul class="channels-block">', '</ul>');
        var split = content.split('<li>');
        for (var i = 1; i < split.length; i++) {
            var m = /<a class="(.+?)" href="(.+?)"><span>(.*)<\/span>/.exec(split[i]);
            if (m) var channel = {
                url: m[1],
                title: m[3],
                icon: plugin.path + "img/" + m[1] + ".png"
            };
            channels.push(channel);
        }
        return channels;
    }

    function ch_list(page, channels) {
        for (var i in channels) {
            var channel = channels[i];
            if (channel.url) page.appendItem(PREFIX + ':channel:' + channel.url + ':' + date + ':' + channel.title, 'video', {
                title: new showtime.RichText(channel.title),
                icon: channel.icon
            });
        }
    }

    function getStream(url) {
        var match, tmp, v, stream
        //rtmp: //213.186.127.42:1935/live/first.stream  swfUrl=http://kaban.tv/uppod.swf pageUrl=http://kaban.tv/pervii-kanal/player.jsx
        //rtmp://213.186.127.42:1935/live/rus1.stream swfUrl=http://kaban.tv/uppod.swf pageUrl=http://kaban.tv/rossiya-1-online
        v = showtime.httpGet(BASE_URL + url).toString();
        stream = /file":"([^"]+)"/.exec(v);
        stream = dc(stream[1]);
        if (stream.indexOf('tmp:') !== -1) {
            match = /rtmp:(.+?).stream/g.exec(stream);
            while (match) {
                tmp = match[0];
                tmp += ' swfUrl=http://kaban.tv/uppod.swf';
                tmp += ' pageUrl=' + BASE_URL;
                tmp += ' tcUrl=' + match[0];
                tmp += ' flashVer=\'WIN 11,2,202,235\'';
                showtime.trace("trying open link :" + tmp);
                if (showtime.probe(tmp).result === 0) {
                    stream = tmp;
                    break;
                }
                match = /rtmp:(.+?).stream/g.exec(stream);
            }
        } else {
            match = /http:(.+?).flv/g.exec(stream);
            while (match) {
                showtime.trace("trying open link :" + match[0]);
                if (showtime.probe(match[0]).result === 0) {
                    stream = (match[0]);
                    break;
                }
                match = /http:(.+?).flv/g.exec(stream);
            }
        }
        return trim(stream);
    }
    //function from dinamic source

    function getValue(doc, start, end) {
        var s = doc.indexOf(start);
        if (s < 0) return null;
        s = s + start.length;
        if (end !== null) {
            var e = doc.indexOf(end, s);
            if (e < 0) return null;
            return doc.substr(s, e - s);
        }
        return doc.substr(s);
    }

    function trim(s) {
        s = s.replace(/(\r\n|\n|\r)/gm, "");
        s = s.replace(/(^\s*)|(\s*$)/gi, "");
        s = s.replace(/[ ]{2,}/gi, " ");
        return s;
    }

    function getDayDifference(date, dayDifference) {
        var dateDifference = new Date();
        var partsDifference = date.split('-');
        dateDifference.setFullYear(partsDifference[0], partsDifference[1] - 1, partsDifference[2]); // year, month (0-based), day
        dateDifference.setTime(dateDifference.getTime() + dayDifference * 24 * 60 * 60 * 1000);
        var monthDifference = ((dateDifference.getMonth() + 1) < 10) ? ('0' + (dateDifference.getMonth() + 1)) : (dateDifference.getMonth() + 1);
        var dayMonthDifference = (dateDifference.getDate() < 10) ? ('0' + dateDifference.getDate()) : (dateDifference.getDate());
        var dateDifferenceString = (dateDifference.getYear() + 1900) + "-" + monthDifference + "-" + dayMonthDifference;
        return {
            date: dateDifferenceString,
            dayOfWeek: dateDifference.getDay()
        };
    }

    function shpr(page, json, index, CDL) {
        if (json[index].tvChannelItemUI.startTime < CDL && json[index].tvChannelItemUI.endTime <= CDL) {
            ////Kaban.tv:play:/archive/pervii-kanal/2013-03-07/605993
            //page.appendItem(PREFIX + ":play:" +"/archive/" + json[index].tvChannelItemUI.channelId + "/" + json[index].tvChannelItemUI.date + "/" + json[index].tvChannelItemUI.id, "video", {
            //Kaban.tv:play:/archive/player/pervii-kanal/605989.jsx
            page.appendItem(PREFIX + ":play:" + "/archive/player/" + json[index].tvChannelItemUI.channelId + "/" + json[index].tvChannelItemUI.id + ".jsx", "video", {
                title: new showtime.RichText('(' + json[index].tvChannelItemUI.startTimeMSK + ') ' + json[index].tvChannelItemUI.name),
                icon: plugin.path + "img/" + json[index].tvChannelItemUI.channelId + ".png",
                description: json[index].tvChannelItemUI.description
            });
        } else if (json[index].tvChannelItemUI.startTime <= CDL && json[index].tvChannelItemUI.endTime > CDL) {
            page.appendItem(PREFIX + ":play:" + "/" + json[index].tvChannelItemUI.channelId + "/player.jsx", "video", {
                title: new showtime.RichText('<font color="92CD00">Сейчас! (</font>' + json[index].tvChannelItemUI.startTimeMSK + ')' + json[index].tvChannelItemUI.name),
                icon: plugin.path + "img/" + json[index].tvChannelItemUI.channelId + ".png",
                description: json[index].tvChannelItemUI.description
            });
        } else {
            page.appendItem(PREFIX + ":play:" + "/" + json[index].tvChannelItemUI.channelId + "/player.jsx", "video", {
                title: new showtime.RichText('<font color="b3b3b3">(' + json[index].tvChannelItemUI.startTimeMSK + ') ' + json[index].tvChannelItemUI.name),
                icon: plugin.path + "img/" + json[index].tvChannelItemUI.channelId + ".png",
                description: json[index].tvChannelItemUI.description
            });
        }
    }

    function shTvPr(page, json, CDL) {
        for (var key = 0; key < json.length; key++) {
            page.entries++;
            shpr(page, json, key, CDL);
        }
    }


function dc(a){var b,c,d,e;b="3UIaVxs8z27WwGBXb94RkJe5g=".split("");c="QHo10TdnvilZYfpMyN6DtLmcuj".split("");a=m("\n","",a);for(var g=0;g<b.length;g++)d=c[g],e=b[g],a=m(d,"___",a),a=m(e,d,a),a=m("___",e,a);var f,j,h;c=b=0;g=[];if(a){a+="";do f="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(a.charAt(b++)),j="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(a.charAt(b++)),d="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(a.charAt(b++)), e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(a.charAt(b++)),h=f<<18|j<<12|d<<6|e,f=h>>16&255,j=h>>8&255,h&=255,64==d?g[c++]=String.fromCharCode(f):64==e?g[c++]=String.fromCharCode(f,j):g[c++]=String.fromCharCode(f,j,h);while(b<a.length);f=g.join("")}else f=a;a=[];g=e=c=b=0;for(f+="";b<f.length;)d=f.charCodeAt(b),128>d?(a[c++]=String.fromCharCode(d),b++):191<d&&224>d?(e=f.charCodeAt(b+1),a[c++]=String.fromCharCode((d&31)<<6|e&63),b+=2):(e=f.charCodeAt(b+1),g=f.charCodeAt(b+ 2),a[c++]=String.fromCharCode((d&15)<<12|(e&63)<<6|g&63),b+=3);a=a.join("");return unescape(a)}function m(a,b,c){var d=0,e=0,g="",f="",j=0,h=0;a=[].concat(a);b=[].concat(b);var k="[object Array]"===Object.prototype.toString.call(b),l="[object Array]"===Object.prototype.toString.call(c);c=[].concat(c);d=0;for(j=c.length;d<j;d++)if(""!==c[d]){e=0;for(h=a.length;e<h;e++)g=c[d]+"",f=k?void 0!==b[e]?b[e]:"":b[0],c[d]=g.split(a[e]).join(f)}return l?c:c[0]};
    plugin.addURI(PREFIX + ":start", startPage);
})(this);