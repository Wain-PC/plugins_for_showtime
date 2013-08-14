/*
 *  aMovies  - Showtime Plugin
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
//ver 0.3
(function(plugin) {
    var plugin_info = plugin.getDescriptor();
    var PREFIX = plugin_info.id;
    // bazovyj adress saita
    var BASE_URL = 'http://www.amovies.tv';
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
    var service = plugin.createService(plugin_info.title, PREFIX + ":start", "video", true, logo);
    //settings
    var settings = plugin.createSettings(plugin_info.title, logo, plugin_info.synopsis);
    settings.createInfo("info", logo, "Plugin developed by " + plugin_info.author + ". \n");
    settings.createDivider('Settings:');
    settings.createBool("tosaccepted", "Accepted TOS (available in opening the plugin):", false, function(v) {
        service.tosaccepted = v;
    });
    settings.createBool("debug", "Debug", false, function(v) {
        service.debug = v;
    });
    settings.createBool("thetvdb", "Show more information using thetvdb", false, function(v) {
        service.thetvdb = v;
    });
    //First level start page
    plugin.addURI(PREFIX + ":start", function(page) {
        page.metadata.logo = plugin.path + "logo.png";
        page.metadata.title = PREFIX;
        if (!service.tosaccepted) if (showtime.message(tos, true, true)) service.tosaccepted = 1;
        else page.error("TOS not accepted. plugin disabled");
        //<ul class="menu">
        //    <li><a href="/" class="top-menu-link">Главная</a>     </li>
        //    <li><a href="http://amovies.tv/film/" class="top-menu-link">Фильмы</a></li>
        //    <li><a href="http://amovies.tv/serials/" class="top-menu-link">Сериалы</a></li>
        //    <li><a href="http://amovies.tv/serials-rus-sub/" class="top-menu-link">Сериалы (SUB)</a></li>
        //    <li><a href="http://amovies.tv/cartoons/" class="top-menu-link">Мультфильмы</a></li></ul>
        //        
        page.appendItem(PREFIX + ":index:/", "directory", {
            title: new showtime.RichText("Главная"),
            icon: logo
        });
        page.appendItem(PREFIX + ":index:/film/", "directory", {
            title: new showtime.RichText("Фильмы"),
            icon: logo
        });
        page.appendItem(PREFIX + ":index:/serials/", "directory", {
            title: new showtime.RichText("Сериалы"),
            icon: logo
        });
        page.appendItem(PREFIX + ":index:/serials-rus-sub/", "directory", {
            title: new showtime.RichText("Сериалы (SUB)"),
            icon: logo
        });
        page.appendItem(PREFIX + ":index:/cartoons/", "directory", {
            title: new showtime.RichText("Мультфильмы"),
            icon: logo
        });
        page.type = "directory";
        page.contents = "items";
        page.loading = false;
    });
    //Second level 
    plugin.addURI(PREFIX + ":index:(.*)", function(page, link) {
        //if (!service.tosaccepted)
        //if (showtime.message(tos, true, true)) service.tosaccepted = 1;
        //else page.error("TOS not accepted. plugin disabled");
        var re, v, m;
        page.contents = "items";
        page.type = "directory";
        page.metadata.logo = plugin.path + "logo.png";
        v = showtime.httpReq(BASE_URL + link).toString();
        page.metadata.title = new showtime.RichText(PREFIX + ' | ' + (/<title>(.*?)<\/title>/.exec(v)[1]));
        re = /<title>(.*?)<\/title>/;
        m = re.exec(v);
        page.appendItem(PREFIX + ':start', 'directory', {
            title: new showtime.RichText('сортировка по : ' + m[1])
        });
        var offset = 1;
        var nnext = match(/<div class="navigation[\S\s]+?"http:\/\/amovies.tv(.+?)">Вперед<\/a>/, v, 1);
        //var total_page = parseInt(/<div class="navigation[\S\s]+?nav_ext[\S\s]+?">([^<]+)/.exec(v)[1], 10);

        function loader() {
            //http://amovies.tv/serials/page/2/
            var v = showtime.httpReq(BASE_URL + link + 'page/' + offset + '/');
            //        <div class="main-news">
            //    <h1>Сегодня, 00:07</h1>
            //    <div class="main-news-content">
            //		<div id="news-id-390" style="display:inline;"><!--TBegin:http://amovies.tv/uploads/posts/2013-06/1371919263_bcf48f0724.jpg|--><a href="http://amovies.tv/uploads/posts/2013-06/1371919263_bcf48f0724.jpg" onclick="return hs.expand(this)" ><img src="/uploads/posts/2013-06/thumbs/1371919263_bcf48f0724.jpg" alt='Рэй Донован' title='Рэй Донован'  /></a><!--TEnd--></div><div style="clear: both;"></div>
            //		<div class="main-news-link"><a href="http://amovies.tv/serials/390-rey-donovan-serial-2013-.html"></a></div>
            //	</div>
            //	<h2><a href="http://amovies.tv/serials/390-rey-donovan-serial-2013-.html">Рэй Донован 1 сезон 1-5 серия NewStudio</a></h2>
            re = /<div class="main-news[\S\s]+?<h1>(.+?)<\/h1>[\S\s]+?-><[\S\s]+?"([^"]+)[\S\s]+?2><a href="http:\/\/amovies.tv([^"]+)">([^<]+)/g;
            m = re.execAll(v);
            for (var i = 0; i < m.length; i++) {
                //  p(m[i][1]+'\n'+m[i][2]+'\n'+m[i][3]+'\n')
                page.appendItem(PREFIX + ":page:" + m[i][3] + ":" + m[i][2].replace('http://', ''), "video", {
                    title: new showtime.RichText(m[i][4]),
                    description: new showtime.RichText("Updated:" + m[i][1]),
                    icon: m[i][2]
                });
            }
            //if (nnext) {
            //page.appendItem(PREFIX + ':index:' + nnext, 'directory', {
            //    title: new showtime.RichText('Вперед')
            //});
            //}
            var nnext = match(/<div class="navigation[\S\s]+?"http:\/\/amovies.tv(.+?)">Вперед<\/a>/, v, 1);
            //p('nnext='+nnext+' !nnext='+!nnext+' !!nnext='+!!nnext)
            offset++;
            return !!nnext;
            // return offset < parseInt(/<div class="navigation[\S\s]+?nav_ext[\S\s]+?">([^<]+)/.exec(v)[1], 10)
        }
        if (nnext) loader();
        page.loading = false;
        page.paginator = loader;
    });
    plugin.addURI(PREFIX + ":page:(.*):(.*)", function(page, link, icon) {
        var i, v, item;
        p(BASE_URL + link);
        v = showtime.httpReq(BASE_URL + link).toString();
        try {
            var bg = match(/<div class="big-poster-hidden" style="background: url\((.+?)\);">/, v, 1);
            //var entries = [];
            if (bg) {
                page.metadata.backgroundAlpha = 0.5;
                page.metadata.background = bg;
            }
            var md = {};
            re = /Добавлено: (.+?)\s\|\s(.+?)\s\|\s([0-9]+(?:\.[0-9]*)?) сезон/;
            md.title = showtime.entityDecode(match(/<div class="full-news">[\S\s]+?>([^<]+)/, v, 1));
            md.season = parseInt(match(re, v, 3), 10);
            md.eng_title = showtime.entityDecode(match(re, v, 2));
            md.icon = 'http://www.' + icon;
            md.year = parseInt(match(/Год[\S\s]+?([0-9]{4})/, v, 1), 10);
            md.description = new showtime.RichText(trim(showtime.entityDecode(match(/<div id="news-id-[\S\s]+?>(.+?)<\/div/, v, 1))));
            p(showtime.JSONEncode(md));
            page.metadata.title = md.title + " (" + md.year + ")";
            var re = /value="http:\/\/vk.com\/([^"]+)[\S\s]+?>([^<]+)/g;
            var m = re.execAll(v);
            if (m.toString()) {
                for (i = 0; i < m.length; i++) {
                    item = page.appendItem(PREFIX + ":play:" + m[i][1] + ':' + escape(md.eng_title + ' | ' + md.year + ' | ' + md.season + ' сезон | ' + m[i][2]), "video", {
                        title: md.eng_title + ' | ' + md.season + ' сезон | ' + m[i][2],
                        description: md.description,
                        season: +md.season,
                        year: md.year,
                        icon: md.icon
                    });
                    if (service.thetvdb) {
                        item.bindVideoMetadata({
                            title: md.eng_title,
                            year: md.year,
                            season: +md.season,
                            episode: match(/([0-9]+(?:\.[0-9]*)?)/, m[i][2], 1)
                        });
                    }
                }
            } else {
                var video = match(/<iframe src="http:\/\/vk.com\/([^"]+)/, v, 1);
                item = page.appendItem(PREFIX + ":play:" + video + ':' + escape(md.title.split(' | ')[1] + ' | ' + md.year), "video", md);
                if (service.thetvdb) {
                    item.bindVideoMetadata({
                        title: md.title.split(' | ')[1],
                        year: md.year
                    });
                }
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
    plugin.addURI(PREFIX + ":play:(.*):(.*)", function(page, url, title) {
        var s = unescape(title).split(' | ');
        var video = get_video_link(url);
        p(s); //encodeURIComponent
        var imdbid = match(/http:\/\/www.imdb.com\/title\/(tt\d+).*?<\/a>/, showtime.httpReq('http://www.google.com/search?q=imdb+' + encodeURIComponent(s[0]), {
            debug: true
        }), 1);
        if (showtime.probe(video).result === 0) {
            page.type = "video";
            page.source = "videoparams:" + showtime.JSONEncode({
                //subscan
                title: s[0],
                imdbid: imdbid ? imdbid : '<unknown>',
                year: parseInt(s[1], 10),
                season: match(/([0-9]+(?:\.[0-9]*)?)/, s[2], 1) ? match(/([0-9]+(?:\.[0-9]*)?)/, s[2], 1) : -1,
                episode: match(/([0-9]+(?:\.[0-9]*)?)/, s[3], 1) ? match(/([0-9]+(?:\.[0-9]*)?)/, s[3], 1) : -1,
                no_fs_scan: true,
                canonicalUrl: PREFIX + ":play:" + url + ":" + title,
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
            showtime.trace("Search aMovies Videos for: " + query);
            var v = showtime.httpReq(BASE_URL, {
                debug: true,
                postdata: {
                    do: 'search',
                    subaction: 'search',
                    story: query,
                    x: 0,
                    y: 0
                }
            });
            var re = /main-news-c[\S\s]+?--><a href="([^"]+)[\S\s]+?link[\S\s]+?http:\/\/amovies.tv([^"]+)[\S\s]+?h2>[\S\s]+?>([^<]+)/g;
            var m = re.execAll(v.toString());
            for (var i = 0; i < m.length; i++) {
                p(m[i][1] + '\n' + m[i][2] + '\n' + m[i][3] + '\n');
                page.appendItem(PREFIX + ":page:" + m[i][2] + ":" + escape(m[i][1]), "video", {
                    title: new showtime.RichText(m[i][3]),
                    icon: m[i][1]
                });
                page.entries = i;
            }
        } catch (err) {
            showtime.trace('aMovies - Ошибка поиска: ' + err);
            e(err);
        }
    });

    function get_video_link(url) {
        var result_url = 'http://vk.com/' + url;
        try {
            showtime.trace('php Link for page: ' + result_url);
            var v = showtime.httpGet(result_url).toString();
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
            e(err.stack);
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