/*
 *  couchtuner.eu  - Showtime Plugin
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
    var plugin_info = plugin.getDescriptor();
    var PREFIX = plugin_info.id;
    var BASE_URL = 'http://www.couchtuner.eu';
    var logo = plugin.path + 'logo.png';
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
    var service = plugin.createService(plugin_info.title, PREFIX + ":index:/", "video", true, logo);
    //settings
    var settings = plugin.createSettings(plugin_info.title, logo, plugin_info.synopsis);
    settings.createInfo("info", logo, "Plugin developed by " + plugin_info.author + ". \n");
    settings.createDivider('Settings:');
    settings.createBool("tosaccepted", "Accepted TOS (available in opening the plugin):", false, function(v) {
        service.tosaccepted = v;
    });
    settings.createBool("thetvdb", "Show more information using thetvdb", false, function(v) {
        service.thetvdb = v;
    });
    settings.createBool("debug", "Debug", false, function(v) {
        service.debug = v;
    });
    //First level start page
    //    plugin.addURI(PREFIX + ":select", function(page) {
    //        page.metadata.logo = plugin.path + "logo.png";
    //        page.metadata.title = PREFIX;
    //        page.appendItem(PREFIX + ":index:/", "directory", {
    //            title: new showtime.RichText("Recent Updated"),
    //            icon: logo
    //        });
    //        page.appendItem(PREFIX + ":index:/all", "directory", {
    //            title: new showtime.RichText("ALL TV LIST"),
    //            icon: logo
    //        });
    //
    //        page.type = "directory";
    //        page.contents = "items";
    //        page.loading = false;
    //    });
    //Second level 
    plugin.addURI(PREFIX + ":index:(.*)", function(page, link) {
        if (!service.tosaccepted) if (showtime.message(tos, true, true)) service.tosaccepted = 1;
        else page.error("TOS not accepted. plugin disabled");
        var re, v, m;
        page.contents = "items";
        page.type = "directory";
        page.metadata.logo = plugin.path + "logo.png";
        v = showtime.httpReq(BASE_URL + link).toString();
        page.metadata.title = new showtime.RichText(PREFIX + ' | ' + (/<title>(.*?)<\/title>/.exec(v)[1]));
        re = /<title>(.*?)<\/title>/;
        m = re.exec(v);
        //page.appendItem(PREFIX + ':select', 'directory', {
        //    title: new showtime.RichText('сортировка по : ' + m[1])
        //});
        var offset = 1;
        //var total_page = parseInt(/<div class="navigation[\S\s]+?nav_ext[\S\s]+?">([^<]+)/.exec(v)[1], 10);

        function loader() {
            //http://www.couchtuner.eu/page/2/
            var v = showtime.httpReq(BASE_URL + link + 'page/' + offset + '/');
            offset++;
            //<span class="tvbox">
            // 
            //<a href="http://www.couchtuner.eu/2013/08/covert-affairs-season-4-episode-4-rock-a-my-soul/" title="Watch Covert Affairs Season 4 Episode 4 &#8211; Rock A My Soul Online" >
            //<span style="background-image: url(/img/frontimg/cttv16.jpg)" class="episode"></span>Covert Affairs<br>Season 4 Episode 4</a>
            //<br /><small>08/07/13 <br />
            //<a href="http://www.couchtuner.eu/2013/08/covert-affairs-season-4-episode-4-rock-a-my-soul/#comments" rel="nofollow"><span class="dsq-postid" rel="23245 http://www.couchtuner.eu/?p=23245">0 comments</span> </a></small>
            //</span>
            re = /<span class="tvbox">[\S\s]+?<a href="http:\/\/www.couchtuner.eu([^"]+)[\S\s]+?background-image: url\(([^)]+)[\S\s]+?class="episode"><\/span>([^<]+)[\S\s]+?Season(.+?)Episode(.+?)<[\S\s]+?([\d]{2}\/[\d]{2}\/[\d]{2})/g;
            m = re.execAll(v);
            for (var i = 0; i < m.length; i++) {
                //  p(m[i][1]+'\n'+m[i][2]+'\n'+m[i][3]+'\n')
                var link1 = m[i][1];
                var icon = m[i][2];
                var title = m[i][3];
                var season = parseInt(m[i][4], 10);
                var episode = parseInt(m[i][5], 10);
                var item = page.appendItem(PREFIX + ":page:" + link1 + ":" + icon + ":" + title + ":" + season + ":" + episode, "video", {
                    title: new showtime.RichText(m[i][3] + ((season < 10) ? ' S0' + season : ' S' + season) + ((episode < 10) ? ' E0' + episode : ' E' + episode)),
                    //title: new showtime.RichText(m[i][3] + " S" + ((season < 10 )? '0' : '' + season) + " E" + ((episode < 10)? '0' : '' + episode)),
                    description: new showtime.RichText("Updated:" + m[i][6]),
                    icon: BASE_URL + m[i][2]
                });
            }
            //<div class="pagination">
            //       <div class="prev-page"><strong><a href="http://www.couchtuner.eu/page/3/">« .:Previous Release</a></strong></div>
            var nnext = match(/<div class="pagination">[\S\s]+?prev-page"><strong><a href="http:\/\/www.couchtuner.eu(.+?)"/, v, 1);
            //if (nnext) {
            //page.appendItem(PREFIX + ':index:' + nnext, 'directory', {
            //    title: new showtime.RichText('Вперед')
            //});
            //}
            return !!nnext;
            // return offset < parseInt(/<div class="navigation[\S\s]+?nav_ext[\S\s]+?">([^<]+)/.exec(v)[1], 10)
        }
        loader();
        page.loading = false;
        page.paginator = loader;
    });
    plugin.addURI(PREFIX + ":page:(.*):(.*):(.*):(.*):(.*)", function(page, link, icon, title, season, episode) {
        var i, v;
        p(BASE_URL + link);
        v = showtime.httpReq(BASE_URL + link).toString();
        try {
            //var entries = [];
            var re = /p>(.+?)<\/p>[\S\s]+?Watch it here[\S\s]+?href="([^"]+)">([^<]+)/;
            var md = {};
            md.title = (match(re, v, 3));
            md.icon = BASE_URL + icon;
            md.description = new showtime.RichText(trim(match(re, v, 1)));
            md.video = match(re, v, 2);
            p(md);
            page.metadata.title = md.title;
            var video = match(/<iframe src="http:\/\/vk.com\/([^"]+)/, showtime.httpReq(md.video).toString(), 1);
            if (video) {
                var item = page.appendItem(PREFIX + ":play:" + showtime.entityDecode(video) + ':' + title + ":" + season + ":" + episode, "video", md);
                if (service.thetvdb) {
                    item.bindVideoMetadata({
                        title: title,
                        season: season,
                        episode: episode
                    });
                }
            } else showtime.notify('no video link from vk servers', 3);
        } catch (ex) {
            page.error("Failed to process page");
            e(ex);
        }
        page.type = "directory";
        page.contents = "contents";
        page.loading = false;
    });
    // Play links
    plugin.addURI(PREFIX + ":play:(.*):(.*):(.*):(.*)", function(page, url, title, season, episode) {
        var video = get_video_link(url);
        if (showtime.probe(video).result === 0) {
            page.type = "video";
            page.source = "videoparams:" + showtime.JSONEncode({
                title: unescape(title),
                season: season,
                episode: episode,
                no_fs_scan: true,
                canonicalUrl: PREFIX + ":play:" + url + ":" + title,
                sources: [{
                    url: video
                }]
            });
        } else {
            showtime.notify('video not avaleble', 3);
            // showtime.message(video+"\n"+ "Go Back",1,0)
        }
        page.metadata.logo = logo;
        page.loading = false;
    });

    function get_video_link(url) {
        var result_url = 'http://vk.com/' + url;
        try {
            showtime.trace('php Link for page: ' + result_url);
            var v = showtime.httpGet(result_url).toString();
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