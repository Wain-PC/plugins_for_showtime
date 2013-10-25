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
//ver 0.4
(function(plugin) {
    var plugin_info = plugin.getDescriptor();
    var PREFIX = plugin_info.id;
    // bazovyj adress saita
    var BASE_URL = 'http://amovies.tv';
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
        var v = showtime.httpReq(BASE_URL).toString();
        var re = /h2 class="title_d_dot"[\S\s]+?<span>([^<]+)[\S\s]+?href="([^"]+)[\S\s]+?<ul class=([\S\s]+?)<\/ul/g;
        //var re2 =/date">([^<]+)[\S\s]+?src="([^"]+)[\S\s]+?href="http:\/\/amovies.tv([^"]+)">([^<]+)[\S\s]+?<span>(.+?)<\/span>/g
        //var re2 =/date">(.+?)<[\S\s]+?src="([^"]+)[\S\s]+?href="http:\/\/amovies.tv([^"]+)">([^<]+)/g
        //var re2 =/date">(.+?)<[\S\s]+?[\S\s]+?src="(.+?)"[\S\s]+?href="http:\/\/amovies.tv(.+?)">(.+?)<[\S\s]+?span>(.+?)<[\S\s]+?class="zvyk">(.+?)</g
        var re2 = /date">(.+?)<[\S\s]+?src="(.+?)"[\S\s]+?href="http:\/\/amovies.tv(.+?)">(.+?)<[\S\s]+?<span>(.*)/g;
        var m = re.execAll(v);
        var data = [];
        for (var i = 0; i < /*m.length*/ 3; i++) {
            page.appendItem("", "separator", {
                title: new showtime.RichText(m[i][1])
            });
            data.push({
                title: m[i][1],
                href: m[i][2]
            });
            var m2 = re2.execAll(m[i][3].trim());
            for (var j = 0; j < m2.length; j++) {
                page.appendItem(PREFIX + ":page:" + m2[j][3] + ":" + escape(m2[j][2]), "video", {
                    title: new showtime.RichText(m2[j][4] + ' | ' + m2[j][5].replace('<br />', ' | ')),
                    description: new showtime.RichText(m2[j][5] + '\n' + "Updated: " + m2[j][1]),
                    icon: m2[j][2]
                });
                data.push({
                    title: (m2[j][4]),
                    description: (m2[j][5] + '\n' + "Updated: " + m2[j][1]),
                    icon: m2[j][2]
                });
            }
            page.appendItem(PREFIX + ":index:" + m[i][2], "directory", {
                title: ('Дальше больше') + ' ►',
                icon: logo
            });
        }
        //Мультфильмы
        page.appendItem("", "separator", {
            title: new showtime.RichText('Мультфильмы')
        });
        v = showtime.httpReq(BASE_URL + '/cartoons/').toString();
        re = /<div class="date">(.+?)<[\S\s]+?img src="([^"]+)[\S\s]+?<a href="http:\/\/amovies.tv([^"]+)">([^<]+)[\S\s]+?<span>(.+?)<\/span>/g;
        m = re.execAll(v);
        for (i = 0; i < 6; i++) {
            // p(m[i][1]+'\n'+m[i][2]+'\n'+m[i][3]+'\n')
            page.appendItem(PREFIX + ":page:" + m[i][3] + ":" + escape(m[i][2]), "video", {
                title: new showtime.RichText(m[i][4] + ' | ' + m[i][5].replace('<br />', ' | ')),
                description: new showtime.RichText(m[i][5] + '\n' + "Updated: " + m[i][1]),
                icon: m[i][2]
            });
        }
        page.appendItem(PREFIX + ":index:" + '/cartoons/', "directory", {
            title: ('Дальше больше') + ' ►',
            icon: logo
        });
        //Мультфильмы
        //Серии ENG
        page.appendItem("", "separator", {
            title: new showtime.RichText('Серии ENG')
        });
        v = showtime.httpReq(BASE_URL + '/eng/').toString();
        re = /<div class="date">(.+?)<[\S\s]+?img src="([^"]+)[\S\s]+?<a href="http:\/\/amovies.tv([^"]+)">([^<]+)[\S\s]+?<span>(.+?)<\/span>/g;
        m = re.execAll(v);
        for (i = 0; i < 6; i++) {
            // p(m[i][1]+'\n'+m[i][2]+'\n'+m[i][3]+'\n')
            page.appendItem(PREFIX + ":page:" + m[i][3] + ":" + escape(m[i][2]), "video", {
                title: new showtime.RichText(m[i][4] + ' | ' + m[i][5].replace('<br />', ' | ')),
                description: new showtime.RichText(m[i][5] + '\n' + "Updated: " + m[i][1]),
                icon: m[i][2]
            });
        }
        page.appendItem(PREFIX + ":index:" + '/eng/', "directory", {
            title: ('Дальше больше') + ' ►',
            icon: logo
        });
        //Серии ENG
        //p(data)
        page.type = "directory";
        page.contents = "items";
        page.loading = false;
    });
    //Second level 
    plugin.addURI(PREFIX + ":index:(.*)", function(page, link) {
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
        var nnext = match(/<ul class="ul_clear navigation">[\S\s]+?"http:\/\/amovies.tv(.+?)"><li>Вперед<\/li><\/a>/, v, 1);
        //var total_page = parseInt(/<div class="navigation[\S\s]+?nav_ext[\S\s]+?">([^<]+)/.exec(v)[1], 10);

        function loader() {
            //http://amovies.tv/serials/page/2/
            var v = showtime.httpReq(BASE_URL + link + 'page/' + offset + '/');
            re = /<div class="date">(.+?)<[\S\s]+?img src="([^"]+)[\S\s]+?<a href="http:\/\/amovies.tv([^"]+)">([^<]+)[\S\s]+?<span>(.+?)<\/span>/g;
            m = re.execAll(v);
            for (var i = 0; i < m.length; i++) {
                // p(m[i][1]+'\n'+m[i][2]+'\n'+m[i][3]+'\n')
                page.appendItem(PREFIX + ":page:" + m[i][3] + ":" + escape(m[i][2]), "video", {
                    title: new showtime.RichText(m[i][4] + ' | ' + m[i][5].replace('<br />', ' | ')),
                    description: new showtime.RichText(m[i][5] + '\n' + "Updated: " + m[i][1]),
                    icon: m[i][2]
                });
            }
            //if (nnext) {
            //page.appendItem(PREFIX + ':index:' + nnext, 'directory', {
            //    title: new showtime.RichText('Вперед')
            //});
            //}
            var nnext = match(/<ul class="ul_clear navigation">[\S\s]+?"http:\/\/amovies.tv(.+?)"><li>Вперед<\/li><\/a>/, v, 1);
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
        var i, v, item, re, re2, m, m2;
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
            re = /:.+?\|\s([^|]+?)\|\s+([0-9]+(?:\.[0-9]*)?) сезон/;
            //<div class="title_d_dot"><span> Викинги 1 сезон  1-9 серия ENG</span>
            md.title = showtime.entityDecode(match(/<div class="title_d_dot"><span>([^<]+)/, v, 1));
            md.season = parseInt(match(re, v, 2), 10);
            md.eng_title = showtime.entityDecode(match(re, v, 1));
            md.icon = unescape(icon);
            //                md.icon = match(/<div class="prev_img"><img src="(.+?)" alt=/, v, 1);               
            md.year = +match(/Год[\S\s]+?([0-9]+(?:\.[0-9]*)?)/, v, 1);
            md.status = match(/<li><strong>Статус:<\/strong><span>(.+?)</, v, 1);
            md.genre = match(/<li><strong>Жанр:<\/strong><span>(.+?)</, v, 1);
            md.duration = +match(/<li><strong>Время[\S\s]+?([0-9]+(?:\.[0-9]*)?)/, v, 1);
            md.country = match(/<li><strong>Страна:<\/strong><span>(.+?)</, v, 1);
            md.rating = +match(/<li><strong>Рейтинг[\S\s]+?([0-9]+(?:\.[0-9]*)?)<\/strong>/, v, 1);
            md.director = match(/<li><strong>Режиссер:<\/strong><span>(.+?)<\/span>/, v, 1);
            md.actor = match(/<li><strong>Актеры:<\/strong><span>(.+?)<\/span><\/li>/, v, 1);
            md.description = match(/<div class="post_text">([\S\s]+?)<\/div><\/div>/, v, 1);
            //p(md)
            page.metadata.title = md.title;
            //Трейлер:
            var trailer = match(/Трейлер[\S\s]+?video_begin:(.+?)--/, v, 1);
            if (trailer) {
                page.appendItem(trailer, "video", {
                    title: 'Трейлер: ' + md.title,
                    season: +md.season,
                    year: md.year,
                    imdbid: md.imdbid,
                    icon: md.icon,
                    genre: md.genre,
                    duration: +md.duration,
                    rating: +md.rating * 10,
                    description: new showtime.RichText((md.status ? 'Статус: ' + md.status + '\n' : '') + (md.director ? 'Режиссер: ' + md.director + '\n' : '') + (md.actor ? 'Актеры: ' + md.actor + '\n' : '') + '\n' + md.description)
                });
            }
            //var re = /value="http:\/\/vk.com\/([^"]+)[\S\s]+?>([^<]+)/g;
            //var m = re.execAll(v);
            if (link.indexOf('katalog-serialov') != -1) {
                p('katalog-serialov' + '\n' + link);
                re = /<strong>(\w сезон) <\/strong>(.*)/g;
                re2 = /href="http:\/\/amovies.tv(.+?)" >(.+?)<\/a>/g;
                m = re.execAll(v.match(/<div class="arhive_news">[\S\s]+?<div class="treiler">/));
                for (i = 0; i < m.length; i++) {
                    page.appendItem("", "separator", {
                        title: new showtime.RichText(m[i][1])
                    });
                    m2 = re2.execAll(m[i][2].trim());
                    for (var j = 0; j < m2.length; j++) {
                        page.appendItem(PREFIX + ":page:" + m2[j][1] + ":" + escape(md.icon), "video", {
                            title: new showtime.RichText(md.title + ' | ' + m2[j][2]),
                            year: md.year,
                            icon: md.icon,
                            genre: md.genre,
                            duration: +md.duration,
                            rating: +md.rating * 10,
                            description: new showtime.RichText((md.status ? 'Статус: ' + md.status + '\n' : '') + (md.director ? 'Режиссер: ' + md.director + '\n' : '') + (md.actor ? 'Актеры: ' + md.actor + '\n' : '') + '\n' + md.description)
                        });
                    }
                }
            }
            if (link.indexOf('serials') != -1 || link.indexOf('cartoons') != -1) {
                p('serials' + '\n' + link);
                re = /value=(?:"http:\/\/vk.com\/|"http:\/\/rutube.ru\/)([^"]+)[\S\s]+?>([^<]+)/g;
                m = re.execAll(v);
                if (m.toString()) {
                    for (i = 0; i < m.length; i++) {
                        item = page.appendItem(PREFIX + ":play:" + m[i][1] + ':' + escape(md.eng_title + ' | ' + md.year + ' | ' + md.season + ' сезон | ' + m[i][2]), "video", {
                            title: md.eng_title + ' | ' + md.season + ' сезон | ' + m[i][2],
                            season: +md.season,
                            imdbid: md.imdbid,
                            year: md.year,
                            icon: md.icon,
                            genre: md.genre,
                            duration: +md.duration,
                            rating: +md.rating * 10,
                            description: new showtime.RichText((md.status ? 'Статус: ' + md.status + '\n' : '') + (md.director ? 'Режиссер: ' + md.director + '\n' : '') + (md.actor ? 'Актеры: ' + md.actor + '\n' : '') + '\n' + md.description)
                        });
                        if (service.thetvdb) {
                            item.bindVideoMetadata({
                                title: md.eng_title,
                                season: +md.season,
                                episode: +match(/([0-9]+(?:\.[0-9]*)?)/, m[i][2], 1)
                            });
                        }
                    }
                }
                //Перейти к каталогу сериала
                re = /<div class="link_catalog">.+?"http:\/\/amovies.tv(.+?)">(.+?)</;
                m = re.exec(v);
                if (m) {
                    page.appendItem(PREFIX + ":page:" + m[1] + ':' + escape(md.icon), "directory", {
                        title: m[2]
                    });
                }
                //page.appendItem("", "separator", {
                //    title: new showtime.RichText('Перейти к каталогу сериала')
                //});
            }
            if (link.indexOf('/film/') != -1) {
                p('film' + '\n' + link);
                var video = match(/<iframe src="http:\/\/vk.com\/([^"]+)/, v, 1);
                item = page.appendItem(PREFIX + ":play:" + video + ':' + escape(md.title.split(' | ')[1] + ' | ' + md.year), "video", {
                    title: md.title,
                    season: +md.season,
                    year: md.year,
                    imdbid: md.imdbid,
                    icon: md.icon,
                    genre: md.genre,
                    duration: +md.duration,
                    rating: +md.rating * 10,
                    description: new showtime.RichText((md.status ? 'Статус: ' + md.status + '\n' : '') + (md.director ? 'Режиссер: ' + md.director + '\n' : '') + (md.actor ? 'Актеры: ' + md.actor + '\n' : '') + '\n' + md.description)
                });
                if (service.thetvdb) {
                    item.bindVideoMetadata({
                        title: md.title.split(' | ')[1],
                        year: md.year
                    });
                }
            }
            //http://amovies.tv/eng
            if (link.indexOf('/eng/') != -1) {
                p('eng' + '\n' + link);
                re = /value="http:\/\/vk.com\/([^"]+)[\S\s]+?>([^<]+)/g;
                m = re.execAll(v);
                if (m.toString()) {
                    for (i = 0; i < m.length; i++) {
                        m2 = /(.+?)([0-9]+(?:\.[0-9]*)?) сезон ([0-9]+(?:\.[0-9]*)?) серия/.exec(m[i][2]);
                        p(m[i][2] + m2);
                        item = page.appendItem(PREFIX + ":play:" + m[i][1] + ':' + escape(m2[1].trim() + ' | S' + (+m2[2]) + ' |  Ep' + (+m2[3])), "video", {
                            title: m2[1].trim() + ' | S' + (+m2[2]) + ' Ep' + m2[3]
                        });
                        if (service.thetvdb) {
                            item.bindVideoMetadata({
                                title: m2[1].trim(),
                                season: +m2[2],
                                episode: +m2[3]
                            });
                        }
                    }
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
        p(s);
        //var imdbid = getIMDBid(s[0] + ' S'+match(/([0-9]+(?:\.[0-9]*)?)/, s[2], 1) + ' Ep'+match(/([0-9]+(?:\.[0-9]*)?)/, s[3], 1))
        // p(imdbid)
        var video = get_video_link(url);
        //var imdbid = match(/http:\/\/www.imdb.com\/title\/(tt\d+).*?<\/a>/, showtime.httpReq('http://www.google.com/search?q=imdb+' + encodeURIComponent(s[0]).toString(), {
        //    debug: true
        //}), 1);
        if (showtime.probe(video).result === 0) {
            page.type = "video";
            page.title = unescape(title);
            page.source = "videoparams:" + showtime.JSONEncode({
                //subscan
                title: s[0],
                //imdbid: imdbid ? imdbid : '<unknown>',
                year: match(/([0-9]+(?:\.[0-9]*)?)/, s[1], 1) ? match(/([0-9]+(?:\.[0-9]*)?)/, s[1], 1) : 0,
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
            var v = showtime.httpReq(BASE_URL + '/index.php?do=search', {
                debug: true,
                postdata: {
                    do: 'search',
                    subaction: 'search',
                    search_start: 1,
                    full_search: 0,
                    result_from: 1,
                    story: encodeURIComponent(showtime.entityDecode(query))
                }
            });
            var re = /fullresult_search[\S\s]+?date.+?>(.+?)<[\S\s]+?src="(.+?)"[\S\s]+?href="http:\/\/amovies.tv(.+?)" >(.+?)<[\S\s]+?<span>(.*)<\//g;
            var m = re.execAll(v.toString());
            for (var i = 0; i < m.length; i++) {
                p(m[i][1] + '\n' + m[i][2] + '\n' + m[i][3] + '\n' + m[i][5].length);
                page.appendItem(PREFIX + ":page:" + m[i][3] + ":" + escape(m[i][2]), "video", {
                    title: new showtime.RichText(m[i][4] + (m[i][5].length === 0 ? '' : ' | ' + m[i][5])),
                    icon: m[i][2],
                    description: new showtime.RichText(m[i][5] + '\n' + "Updated: " + m[i][1])
                });
                page.entries = i;
            }
        } catch (err) {
            showtime.trace('aMovies - Ошибка поиска: ' + err);
            e(err);
        }
    });

    function get_video_link(url) {
        var JSON, v, result_url;
        try {
            if (url.indexOf('video/embed/') != -1) {
                //http://rutube.ru/video/embed/6624804?p=DGxawOxbCDPdbNOEB3Cpww
                //http://rutube.ru/api/play/trackinfo/6624804?p=DGxawOxbCDPdbNOEB3Cpww&no_404=true&format=json
                result_url = url.replace('video/embed/', 'http://rutube.ru/api/play/trackinfo/') + '&no_404=true&format=json';
                JSON = showtime.JSONDecode(showtime.httpGet(result_url));
                result_url = JSON.video_balancer.m3u8;
                return result_url;
            }
            var result_url = 'http://vk.com/' + url;
            showtime.trace('php Link for page: ' + result_url);
            v = showtime.httpGet(result_url).toString();
            JSON = (/var vars = (.+)/.exec(v)[1]);
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

    function getIMDBid(title) {
        p(encodeURIComponent(showtime.entityDecode(unescape(title))).toString());
        var resp = showtime.httpReq('http://www.google.com/search?q=imdb+' + encodeURIComponent(showtime.entityDecode(unescape(title))).toString()).toString();
        var re = /http:\/\/www.imdb.com\/title\/(tt\d+).*?<\/a>/;
        var imdbid = re.exec(resp);
        if (imdbid) imdbid = imdbid[1];
        else {
            re = /http:\/\/<b>imdb<\/b>.com\/title\/(tt\d+).*?\//;
            imdbid = re.exec(resp);
            if (imdbid) imdbid = imdbid[1];
        }
        return imdbid;
    }
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
    if (!String.prototype.trim) {
        String.prototype.trim = function() {
            return this.replace(/^\s+|\s+$/g, '');
        };
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