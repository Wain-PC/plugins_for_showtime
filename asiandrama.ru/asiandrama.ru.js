/*
 *  asiandrama.ru  - Showtime Plugin
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
//ver 0.1
(function(plugin) {
    var PREFIX = 'AsianDrama.ru:';
    // bazovyj adress saita
    var BASE_URL = 'http://www.asiandrama.ru';
    //logo
    var logo = plugin.path + 'logo.png';
    //tos
    var tos = 'The developer has no affiliation with the sites what so ever.\n';
    tos += 'Nor does he receive money or any other kind of benefits for them.\n\n';
    tos += 'The software is intended solely for educational and testing purposes,\n';
    tos += 'and while it may allow the user to create copies of legitimately acquired\n';
    tos += 'and/or owned content, it is required that such user actions must comply\n';
    tos += 'with local, federal and country legislation.\n\n';
    tos += 'Furthermore, the author of this software, its partners and associates\n';
    tos += 'shall assume NO responsibility, legal or otherwise implied, for any misuse\n';
    tos += 'of, or for any loss that may occur while using plugin.\n\n';
    tos += 'You are solely responsible for complying with the applicable laws in your\n';
    tos += 'country and you must cease using this software should your actions during\n';
    tos += 'plugin operation lead to or may lead to infringement or violation of the\n';
    tos += 'rights of the respective content copyright holders.\n\n';
    tos += "plugin is not licensed, approved or endorsed by any online resource\n ";
    tos += "proprietary. Do you accept this terms?";
    // Register a service (will appear on home page)
    var service = plugin.createService("AsianDrama", PREFIX + "start", "video", true, logo);
    //settings
    var settings = plugin.createSettings("AsianDrama", logo, "Online Videos");
    settings.createInfo("info", logo, "Plugin developed by Buksa \n");
    settings.createDivider('Settings:');
    settings.createBool("tosaccepted", "Accepted TOS (available in opening the plugin):", false, function(v) {
        service.tosaccepted = v;
    });
    settings.createBool("debug", "Debug", false, function(v) {
        service.debug = v;
    });
    //First level start page
    plugin.addURI(PREFIX + "start", function(page) {
        page.metadata.logo = plugin.path + "logo.png";
        page.metadata.title = PREFIX;
        //page.type = "directory";
        //page.contents = "list";
        if (!service.tosaccepted) if (showtime.message(tos, true, true)) service.tosaccepted = 1;
        else page.error("TOS not accepted. plugin disabled");
        page.appendItem("", "separator", {
            title: new showtime.RichText('Корея')
        });
        page.appendItem(PREFIX + "index:/%d0%ba%d0%be%d1%80%d0%b5%d0%b9%d1%81%d0%ba%d0%b8%d0%b5-%d1%81%d0%b5%d1%80%d0%b8%d0%b0%d0%bb%d1%8b/", "directory", {
            title: new showtime.RichText('Корейские сериалы'),
            icon: plugin.path + "logo.png"
        });
        page.appendItem(PREFIX + "index:/%d0%ba%d0%be%d1%80%d0%b5%d0%b9%d1%81%d0%ba%d0%b8%d0%b5-%d1%84%d0%b8%d0%bb%d1%8c%d0%bc%d1%8b/", "directory", {
            title: new showtime.RichText('Корейские фильмы'),
            icon: plugin.path + "logo.png"
        });
        page.appendItem("", "separator", {
            title: new showtime.RichText('Япония')
        });
        page.appendItem(PREFIX + "index:/%d1%8f%d0%bf%d0%be%d0%bd%d1%81%d0%ba%d0%b8%d0%b5-%d1%81%d0%b5%d1%80%d0%b8%d0%b0%d0%bb%d1%8b/", "directory", {
            title: new showtime.RichText('Японские сериалы'),
            icon: plugin.path + "logo.png"
        });
        page.appendItem(PREFIX + "index:/%d1%8f%d0%bf%d0%be%d0%bd%d1%81%d0%ba%d0%b8%d0%b5-%d1%84%d0%b8%d0%bb%d1%8c%d0%bc%d1%8b/", "directory", {
            title: new showtime.RichText('Японские фильмы'),
            icon: plugin.path + "logo.png"
        });
        page.appendItem("", "separator", {
            title: new showtime.RichText('Китай')
        });
        page.appendItem(PREFIX + "index:/%d0%ba%d0%b8%d1%82%d0%b0%d0%b9%d1%81%d0%ba%d0%b8%d0%b5-%d1%81%d0%b5%d1%80%d0%b8%d0%b0%d0%bb%d1%8b/", "directory", {
            title: new showtime.RichText('Китайские сериалы'),
            icon: plugin.path + "logo.png"
        });
        page.appendItem(PREFIX + "index:/%d0%ba%d0%b8%d1%82%d0%b0%d0%b9%d1%81%d0%ba%d0%b8%d0%b5-%d1%84%d0%b8%d0%bb%d1%8c%d0%bc%d1%8b/", "directory", {
            title: new showtime.RichText('Китайские фильмы'),
            icon: plugin.path + "logo.png"
        });
        page.type = "directory";
        page.contents = "items";
        page.loading = false;
    });
    //Second level 
    plugin.addURI(PREFIX + "index:(.*)", function(page, link) {
        var re, v, m;
        page.contents = "items";
        page.type = "directory";
        page.metadata.logo = plugin.path + "logo.png";
        v = showtime.httpReq(BASE_URL + link);
        v = /<div class="post">[\S\s]+?<\/div><!-- End Post Content -->/.exec(v.toString());
        page.metadata.title = new showtime.RichText(PREFIX + (/<h2 class="post-title"[\S\s]+?>([^<]+)/.exec(v)[1]));
        re = /<h2 class="post-title"[\S\s]+?>([^<]+)/;
        m = re.exec(v);
        page.appendItem(PREFIX + 'start:' + escape('http:\/\/online.asiandrama.ru.com'), 'directory', {
            title: new showtime.RichText('сортировка по : ' + m[1])
        });
        re = /<a href="http:\/\/www.asiandrama.ru([^"]+)"><img src="http:\/\/www.asiandrama.ru([^"]+)"[\S\s]+?<br \/>([^<]+)/g;
        m = re.execAll(v);
        for (var i = 0; i < m.length; i++) {
            //  p(m[i][1]+'\n'+m[i][2]+'\n'+m[i][3]+'\n')
            page.appendItem(PREFIX + "page:" + m[i][1] + ':' + m[i][2], "video", {
                title: new showtime.RichText(showtime.entityDecode(m[i][3])),
                description: new showtime.RichText(m[i][3]),
                icon: BASE_URL + m[i][2]
            });
        }
        page.loading = false;
        // page.paginator = loader;
    });
    plugin.addURI(PREFIX + "page:(.*):(.*)", function(page, link, icon) {
        var i, v, item;
        p(BASE_URL + link);
        try {
            v = showtime.httpReq(BASE_URL + link).toString();
            v = /<div class="post">[\S\s]+?<\/div><!-- End Post Content -->/.exec(v.toString());
            var data = {};
            data.title = showtime.entityDecode(match(/<h1 class="post-title"[\S\s]+?>([^<]+)/, v));
            data.title = match(/<h1 class="post-title"[\S\s]+?>([^<]+)/, v);
            data.year = parseInt(match(/Год[\S\s]+?<strong>(.+?)<\/strong>/, v), 10);
            data.description = new showtime.RichText(match(/Год[\S\s]+?<\/strong>([\S\s]+?)<\/div/, v));
            p(showtime.JSONEncode(data));
            page.metadata.title = data.title + " (" + data.year + ")";
            var re = /<a class='spoiler-tgl'[\S\s]+?\|\|([^»]+)[\S\s]+?http:\/\/vk[\S\s]+?\/([^"]+)/g;
            var m = re.execAll(v);
            if (m.toString()) {
                for (i = 0; i < m.length; i++) {
                    item = page.appendItem(PREFIX + "play:" + showtime.entityDecode(m[i][2]) + ':' + escape(page.metadata.title), "video", {
                        title: m[i][1].replace('Смотреть', data.title.split('/ ')[1]),
                        year: data.year,
                        description: data.description,
                        icon: BASE_URL + icon
                    });
                }
            } else {
                var video = match(/http:\/\/vk[\S\s]+?\/([^"]+)/, v);
                item = page.appendItem(PREFIX + "play:" + showtime.entityDecode(video) + ':' + escape(data.title.split), "video", {
                    title: data.title,
                    year: data.year,
                    description: data.description,
                    icon: BASE_URL + icon
                });
            }
        } catch (ex) {
            page.error("Failed to process page");
            e(ex);
        }
        page.type = "directory";
        page.contents = "contents";
        page.loading = false;
    });
    // Play links
    plugin.addURI(PREFIX + "play:(.*):(.*)", function(page, url, title) {
        var video = get_video_link(url);
        if (showtime.probe(video).result === 0) {
            page.type = "video";
            page.source = "videoparams:" + showtime.JSONEncode({
                title: unescape(title),
                no_fs_scan: true,
                canonicalUrl: PREFIX + "play:" + url + ":" + title,
                sources: [{
                    url: video,
                    mimetype: 'hls'
                }]
            });
        } else {
            showtime.notify(video, 3);
            // showtime.message(video+"\n"+ "Go Back",1,0)
        }
        page.metadata.logo = logo;
        page.loading = false;
    });
    //
    //plugin.addSearcher(PREFIX + " - Videos", plugin.path + "logo.png", function(page, query) {
    //    try {
    //        showtime.trace("Search asiandrama.ru Videos for: " + query);
    //        var v = showtime.httpReq(BASE_URL + '/index.php?do=search', {
    //            debug: true,
    //            postdata: {
    //                do: 'search',
    //                subaction: 'search',
    //                story: query,
    //                search_start: 1,
    //                full_search: 1,
    //                result_from: 1,
    //                titleonly: 3,
    //                searchuser: '',
    //                replyless: 0,
    //                replylimit: 0,
    //                searchdate: 0,
    //                beforeafter: 'after',
    //                sortby: 'date',
    //                resorder: 'desc',
    //                showposts: 0
    //            }
    //        });
    //        var re = /<div class="title">[\S\s]+?"http:\/\/online.asiandrama.ru.com(.+?)" >(.+?)<[\S\s]+?<img src="(.+?)"/g;
    //        var m = re.execAll(v);
    //        for (var i = 0; i < m.length; i++) {
    //            p(m[i][1] + '\n' + m[i][2] + '\n' + m[i][3] + '\n');
    //            page.appendItem(PREFIX + "page:" + m[i][1], "video", {
    //                title: new showtime.RichText(m[i][2]),
    //                description: new showtime.RichText(m[i][2]),
    //                icon: m[i][3]
    //            });
    //            page.entries = i;
    //        }
    //    } catch (err) {
    //        showtime.trace('asiandrama.ru - Ошибка поиска: ' + err);
    //        e(err);
    //    }
    //});

    function get_video_link(url) {
        var result_url = 'http://vk.com/' + url;
        try {
            showtime.trace('php Link for page: ' + result_url);
            var v = showtime.httpGet(result_url);
            p(v);
            var JSON = (/var vars = (.+)/.exec(v)[1]);
            if (JSON == '{};') {
                result_url = /url: '(.+)'/.exec(v)[1];
                url = result_url.replace('video.rutube.ru', 'rutube.ru/api/play/trackinfo') + '/?format=json';
                JSON = showtime.JSONDecode(showtime.httpGet(url));
                result_url = JSON.video_balancer.m3u8;
                return result_url;
            }
            JSON = showtime.JSONDecode(JSON);
            switch (Math.round(JSON.hd)) {
            case 0:
                result_url = JSON.url240;
                break;
            case 1:
                result_url = JSON.url360;
                break;
            case 2:
                result_url = JSON.url480;
                break;
            case 3:
                result_url = JSON.url720;
                break;
            }
            showtime.trace("Video Link: " + result_url);
        } catch (err) {
            e(err);
        }
        return result_url;
    }
    //
    //extra functions
    //
    // Add to RegExp prototype
    RegExp.prototype.execAll = function(string) {
        var matches = [];
        var match = null;
        while ((match = this.exec(string)) !== null) {
            var matchArray = [];
            for (var i in match) {
                if (parseInt(i, 10) == i) {
                    matchArray.push(match[i]);
                }
            }
            matches.push(matchArray);
        }
        return matches;
    };

    function ucfirst(str) { // Make a string&#039;s first character uppercase
        // 
        // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        var f = str.charAt(0).toUpperCase();
        return f + str.substr(1, str.length - 1);
    }

    function match(re, st) {
        var v;
        if (re.exec(st)) {
            v = re.exec(st)[1];
        } else v = null;
        return v;
    }

    function trim(s) {
        s = s.toString();
        s = s.replace(/(\r\n|\n|\r)/gm, "");
        s = s.replace(/(^\s*)|(\s*$)/gi, "");
        s = s.replace(/[ ]{2,}/gi, " ");
        return s;
    }

    function e(ex) {
        t(ex);
        t("Line #" + ex.lineNumber);
    }

    function t(message) {
        showtime.trace(message, plugin.getDescriptor().id);
    }

    function p(message) {
        showtime.print(message);
    }

    function trace(msg) {
        if (service.debug == '1') {
            t(msg);
            p(msg);
        }
    }
})(this);