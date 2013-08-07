/*
 *  anidub  - Showtime Plugin
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
//ver 0.2
(function(plugin) {
    var PREFIX = 'anidub:';
    // bazovyj adress saita
    var BASE_URL = 'http://online.anidub.com';
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
    var service = plugin.createService("AniDub", PREFIX + "start", "video", true, logo);
    //settings
    var settings = plugin.createSettings("AniDub", logo, "Online Videos");
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
        page.metadata.backgroundAlpha = 0.5;
        page.metadata.background = 'http://online.anidub.com/templates/Anidub_online/img/bg_1.jpg';
        //page.type = "directory";
        //page.contents = "list";
        if (!service.tosaccepted) if (showtime.message(tos, true, true)) service.tosaccepted = 1;
        else page.error("TOS not accepted. plugin disabled");
        //http://online.anidub.com/
        page.appendItem(PREFIX + "index:/", "directory", {
            title: new showtime.RichText('<font size="5" color="ffffff">' + "Главная" + '</font>'),
            icon: plugin.path + "logo.png"
        });
        //http://online.anidub.com/anime_tv/anime_ongoing/
        page.appendItem(PREFIX + "index:/anime_tv/anime_ongoing/", "directory", {
            title: new showtime.RichText('<font size="5" color="ffffff">' + "Аниме Ongoing" + '</font>'),
            icon: plugin.path + "logo.png"
        });
        page.appendItem(PREFIX + "index:/anime_tv/", "directory", {
            title: new showtime.RichText('<font size="5" color="ffffff">' + "Аниме TV" + '</font>'),
            icon: plugin.path + "logo.png"
        });
        page.appendItem(PREFIX + "index:/anime_movie/", "directory", {
            title: new showtime.RichText('<font size="5" color="ffffff">' + "Аниме Фильмы" + '</font>'),
            icon: plugin.path + "logo.png"
        });
        page.appendItem(PREFIX + "index:/anime_ova/", "directory", {
            title: new showtime.RichText('<font size="5" color="ffffff">' + "Аниме OVA" + '</font>'),
            icon: plugin.path + "logo.png"
        });
        page.appendItem(PREFIX + "index:/dorama/", "directory", {
            title: new showtime.RichText('<font size="5" color="ffffff">' + "Дорамы Онлайн" + '</font>'),
            icon: plugin.path + "logo.png"
        });
        page.appendItem(PREFIX + "select:жанрам", "directory", {
            title: new showtime.RichText('<font size="5" color="ffffff">' + "Аниме по жанрам" + '</font>'),
            icon: plugin.path + "logo.png"
        });
        page.appendItem(PREFIX + "select:даберам", "directory", {
            title: new showtime.RichText('<font size="5" color="ffffff">' + "Аниме по даберам" + '</font>'),
            icon: plugin.path + "logo.png"
        });
        page.appendItem(PREFIX + "select:годам", "directory", {
            title: new showtime.RichText('<font size="5" color="ffffff">' + "Аниме по годам" + '</font>'),
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
        page.metadata.backgroundAlpha = 0.5;
        page.metadata.background = 'http://online.anidub.com/templates/Anidub_online/img/bg_1.jpg';
        v = showtime.httpReq(BASE_URL + link);
        page.metadata.title = new showtime.RichText(PREFIX + (/<title>(.*?)<\/title>/.exec(v)[1]));
        re = /<title>(.*?)<\/title>/;
        m = re.exec(v);
        page.appendItem(PREFIX + 'select:' + escape('http:\/\/online.anidub.com'), 'directory', {
            title: new showtime.RichText('сортировка по : ' + m[1])
        });
        var offset = 1;
        //var total_page = parseInt(/class="last">.*?\/page-(.+?)/.exec(v)[1], 10);
        //    function loader() {
        //        var v = showtime.httpReq(BASE_URL + link + 'page/'+offset+'/', {caching :true}).toString();
        //        offset++;
        // <div class="poster_img"><a href="http://online.anidub.com/anime_tv/anime_ongoing/8668-neuyazvimaya-leviafan-zettai-bouei-leviathan-01-iz-12.html"><img itemprop="image" alt="Неуязвимая Левиафан / Zettai Bouei Leviathan [10 из 13]" class="posters" data-original="http://static3.anidub.com/online/poster/d3d1c7e1f3.jpg" src="/templates/Anidub_online/img/blank.gif"/></a></div>
        // <ul class="reset">
        re = /<div class="poster_img"><a href="http:\/\/online.anidub.com([^"]+)"[\S\s]+?alt="([^"]+)"[\S\s]+?="([^"]+)" src/g;
        m = re.execAll(v);
        for (var i = 0; i < m.length; i++) {
            //  p(m[i][1]+'\n'+m[i][2]+'\n'+m[i][3]+'\n')
            page.appendItem(PREFIX + "page:" + m[i][1], "video", {
                title: new showtime.RichText(m[i][2]),
                description: new showtime.RichText(m[i][2]),
                icon: m[i][3]
            });
        }
        var nnext = match(/<span class="nnext"><a href="http:\/\/online.anidub.com([^"]+)">/, v, 1);
        if (nnext) {
            page.appendItem(PREFIX + 'index:' + nnext, 'directory', {
                title: new showtime.RichText('Вперед')
            });
        }
        //    return !!nnext//offset < parseInt(/class="last">.*?\/page-(.+?)\//.exec(v)[1], 10);
        // }
        // loader();
        // page.paginator = loader;
        page.loading = false;
    });
    plugin.addURI(PREFIX + "page:(.*)", function(page, link) {
        var i, v;
       // p(BASE_URL + link);
        try {
            v = showtime.httpReq(BASE_URL + link).toString();
            //var entries = [];
            var metadata = {};
            metadata.title = trim(match(/<h1 class="titlfull" itemprop="name">(.+?)<\/h1>/, v, 1));
            ////get_fanart(page,metadata.title)
            metadata.icon = match(/<div class="poster_img"><img itemprop="image" src="([^"]+)"alt=/, v, 1);
            metadata.year = parseInt(match(/<li><b>Год: <\/b>[\S\s]+?>([^<]+)</, v, 1), 10);
            metadata.description = new showtime.RichText(trim(match(/<div itemprop="description">[\S\s]+?(.+?)<div/, v, 1)));
           // p(metadata);
            page.metadata.title = metadata.title + "(" + metadata.year + ")";
            var re = /value=.http:\/\/vk.com\/([^|]+)[\S\s]+?>([^<]+)/g;
            var m = re.execAll(v);
            if (m.toString()) {
                for (i = 0; i < m.length; i++) {
                    page.appendItem(PREFIX + "play:" + m[i][1] + ':' + escape(m[i][2]), "video", metadata);
                }
            } else {
                var video = match(/d='film_main' src='http:\/\/vk.com\/(.+?)' width/, v, 1);
                page.appendItem(PREFIX + "play:" + video + ':' + escape(metadata.title), "video", metadata);
            }
        } catch (ex) {
            page.error("Failed to process page");
            e(ex);
        }
        page.type = "directory";
        page.contents = "contents";
        page.loading = false;
    });
    plugin.addURI(PREFIX + "select:(.*)", function(page, url) {
        var re, m, i, html;
        page.metadata.backgroundAlpha = 0.5;
        page.metadata.background = 'http://online.anidub.com/templates/Anidub_online/img/bg_1.jpg';
        try {
            html = showtime.httpReq(BASE_URL);
            if (url == 'годам') {
                re = /<a title="(.+?)" href="(.+?)"/g;
                m = re.execAll(/sublink">Аниме по годам<[\S\s]*?<\/ul>/.exec(html));
                for (i = 0; i < m.length; i++) {
                    page.appendItem(PREFIX + "index:" + (m[i][2]), "video", {
                        title: new showtime.RichText(m[i][1]),
                        description: new showtime.RichText(m[i][2]),
                        icon: plugin.path + "logo.png"
                    });
                }
            }
            if (url == 'даберам') {
                re = /<a title="(.+?)" href="(.+?)"/g;
                m = re.execAll(/sublink">Аниме по даберам<[\S\s]*?<\/ul>/.exec(html));
                for (i = 0; i < m.length; i++) {
                    page.appendItem(PREFIX + "index:" + (m[i][2]), "video", {
                        title: new showtime.RichText(m[i][1]),
                        description: new showtime.RichText(m[i][2]),
                        icon: plugin.path + "logo.png"
                    });
                }
            }
            if (url == 'жанрам') {
                html = showtime.httpReq(BASE_URL);
                re = /<a title="(.+?)" href="(.+?)"/g;
                m = re.execAll(/sublink">Аниме по жанрам<[\S\s]*?<\/ul>/.exec(html));
                for (i = 0; i < m.length; i++) {
                    page.appendItem(PREFIX + "index:" + (m[i][2]), "video", {
                        title: new showtime.RichText(m[i][1]),
                        description: new showtime.RichText(m[i][2]),
                        icon: plugin.path + "logo.png"
                    });
                }
            }
            if (url == 'http%3A//online.anidub.com') {
                page.appendItem(PREFIX + "index:/", "directory", {
                    title: new showtime.RichText('<font size="5" color="ffffff">' + "Главная" + '</font>'),
                    icon: plugin.path + "logo.png"
                });
                //http://online.anidub.com/anime_tv/anime_ongoing/
                page.appendItem(PREFIX + "index:/anime_tv/anime_ongoing/", "directory", {
                    title: new showtime.RichText('<font size="5" color="ffffff">' + "Аниме Ongoing" + '</font>'),
                    icon: plugin.path + "logo.png"
                });
                page.appendItem(PREFIX + "index:/anime_tv/", "directory", {
                    title: new showtime.RichText('<font size="5" color="ffffff">' + "Аниме TV" + '</font>'),
                    icon: plugin.path + "logo.png"
                });
                page.appendItem(PREFIX + "index:/anime_movie/", "directory", {
                    title: new showtime.RichText('<font size="5" color="ffffff">' + "Аниме Фильмы" + '</font>'),
                    icon: plugin.path + "logo.png"
                });
                page.appendItem(PREFIX + "index:/anime_ova/", "directory", {
                    title: new showtime.RichText('<font size="5" color="ffffff">' + "Аниме OVA" + '</font>'),
                    icon: plugin.path + "logo.png"
                });
                page.appendItem(PREFIX + "index:/dorama/", "directory", {
                    title: new showtime.RichText('<font size="5" color="ffffff">' + "Дорамы Онлайн" + '</font>'),
                    icon: plugin.path + "logo.png"
                });
                page.appendItem(PREFIX + "select:жанрам", "directory", {
                    title: new showtime.RichText('<font size="5" color="ffffff">' + "Аниме по жанрам" + '</font>'),
                    icon: plugin.path + "logo.png"
                });
                page.appendItem(PREFIX + "select:даберам", "directory", {
                    title: new showtime.RichText('<font size="5" color="ffffff">' + "Аниме по даберам" + '</font>'),
                    icon: plugin.path + "logo.png"
                });
                page.appendItem(PREFIX + "select:годам", "directory", {
                    title: new showtime.RichText('<font size="5" color="ffffff">' + "Аниме по годам" + '</font>'),
                    icon: plugin.path + "logo.png"
                });
            }
        } catch (ex) {
            page.error("Failed to process categories page (get_cat)");
            e(ex);
        }
        page.loading = false;
        page.type = "directory";
        page.contents = "items";
        page.loading = false;
        page.metadata.logo = logo;
    });
    // Play links
    plugin.addURI(PREFIX + "play:(.*):(.*)", function(page, url, title) {
        var video = get_video_link(url);
        if (showtime.probe(video).result === 0) {
            page.type = "video";
            page.source = "videoparams:" + showtime.JSONEncode({
                title: unescape(title),
                canonicalUrl: PREFIX + "play:" + url + ":" + title,
                sources: [{
                    url: video
                }]
            });
        } else {
            showtime.notify(video, 3);
            // showtime.message(video+"\n"+ "Go Back",1,0)
        }
        page.metadata.logo = logo;
        page.loading = false;
    });
    plugin.addSearcher(PREFIX + " - Videos", plugin.path + "logo.png", function(page, query) {
        try {
            showtime.trace("Search anidub Videos for: " + query);
            var v = showtime.httpReq(BASE_URL + '/index.php?do=search', {
                debug: true,
                postdata: {
                    do: 'search',
                    subaction: 'search',
                    story: query,
                    search_start: 1,
                    full_search: 1,
                    result_from: 1,
                    titleonly: 3,
                    searchuser: '',
                    replyless: 0,
                    replylimit: 0,
                    searchdate: 0,
                    beforeafter: 'after',
                    sortby: 'date',
                    resorder: 'desc',
                    showposts: 0
                }
            });
            var re = /<div class="title">[\S\s]+?"http:\/\/online.anidub.com(.+?)" >(.+?)<[\S\s]+?<img src="(.+?)"/g;
            var m = re.execAll(v);
            for (var i = 0; i < m.length; i++) {
                //p(m[i][1] + '\n' + m[i][2] + '\n' + m[i][3] + '\n');
                page.appendItem(PREFIX + "page:" + m[i][1], "video", {
                    title: new showtime.RichText(m[i][2]),
                    description: new showtime.RichText(m[i][2]),
                    icon: m[i][3]
                });
                page.entries = i;
            }
        } catch (err) {
            showtime.trace('anidub - Ошибка поиска: ' + err);
            e(err);
        }
    });

    function get_video_link(url) {
        var result_url = 'http://vk.com/' + url;
        try {
            showtime.trace('php Link for page: ' + result_url);
            var v = showtime.httpGet(result_url);
            //p(v);
            var JSON = (/var vars = (.+)/.exec(v)[1]);
            if (JSON == '{};') {
                result_url = /url: '(.+)'/.exec(v)[1];
                url = result_url.replace('video.rutube.ru', 'rutube.ru/api/play/trackinfo') + '/?format=json';
                JSON = showtime.JSONDecode(showtime.httpGet(url));
                result_url = JSON.video_balancer.m3u8;
                return result_url;
            }
            JSON = showtime.JSONDecode(JSON);
            if (JSON.no_flv == 1) {
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

    function match(re, st, i) {
        i = typeof i !== 'undefined' ? i : 0;
        if (re.exec(st)) {
            return re.exec(st)[i];
        } else return false;
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
        if (typeof(message) === 'object') message = showtime.JSONEncode(message);
        showtime.print(message);
    }

    function trace(msg) {
        if (service.debug == '1') {
            t(msg);
            p(msg);
        }
    }
})(this);