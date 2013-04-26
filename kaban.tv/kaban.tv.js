/**
 *  Kaban.tv plugin for Showtime by Buksa
 *
 *  Copyright (C) 2012 Buksa
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

(function(plugin) {
    var PREFIX = "Kaban.tv";
    var BASE_URL = "http://kaban.tv";
    var service = plugin.createService("Kaban.tv", PREFIX + ":start", "video", true, plugin.path + "img/logo.png");

    function startPage(page) {
        var channels = [];

        page.type = "directory";
        page.contents = "items";
        page.loading = false;

        channels = getChannels(BASE_URL);

        show_channels(page, channels);

        page.metadata.logo = plugin.path + "img/logo.png";
        page.metadata.title = "Kaban.tv Main Page";
    }

    plugin.addURI(PREFIX + ":play:(.*)", function(page, link) {

        var stream = getStream(link);
        showtime.trace('Video Playback: Reading ' + stream);

        page.source = stream;
        page.type = "video";



    });

    function getChannels(url) {
        var html = showtime.httpGet(url).toString();
        var channels = [];
        var content = getValue(html, '<ul class="channels-block">', '</ul>');

        var split = content.split('<li>');

        for (var i = 1; i < split.length; i++) {

            var entry = /<a class="(.+?)" href="(.+?)"><span>(.*)<\/span>/.exec(split[i]);

            if (entry) var channel = {
                url: entry[2],
                title: entry[3],
                icon: plugin.path + "img/" + entry[1] + ".png"
            }
            channels.push(channel);

        }

        return channels;

    }

    function show_channels(page, channels) {
        for (var i in channels) {
            var channel = channels[i];
            if (channel.url) page.appendItem(PREFIX + ':play:' + channel.url, 'video', {
                title: new showtime.RichText(channel.title),
                icon: channel.icon
            });
        }
    }

    function getStream(url) {
        //rtmp://213.186.127.42:1935/live/rus1.stream swfUrl=http://kaban.tv/uppod.swf pageUrl=http://kaban.tv/rossiya-1-online
        var stream = /file":"([^"]+)/.exec(showtime.httpGet(BASE_URL + url).toString());
        stream = stream[1];
        stream = getValue(stream, 'http://', '/playlist.m3u8')
        stream = 'rtmp://' + stream + ' swfUrl=http://kaban.tv/uppod.swf pageUrl=' + BASE_URL + url;
        return stream
    }


    //function from dinamic source

    function getValue(doc, start, end) {
        var s = doc.indexOf(start);
        if (s < 0) return null;

        s = s + start.length;

        if (end != null) {
            var e = doc.indexOf(end, s);
            if (e < 0) return null;

            return doc.substr(s, e - s);
        }

        return doc.substr(s);
    }



    plugin.addURI(PREFIX + ":start", startPage);


})(this);