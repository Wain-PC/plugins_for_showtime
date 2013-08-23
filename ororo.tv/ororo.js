/*
 *  ororo.tv  - Showtime Plugin
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
//ver 0.4.3
(function(plugin) {
    var PREFIX = 'ororo:';
    // bazovyj adress saita
    var BASE_URL = 'http://ororo.tv/';
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
    var service = plugin.createService("Ororo.tv", PREFIX + "start", "video", true, logo);
    var main_menu_order = plugin.createStore('main_menu_order', true);
    var items = [];
    var items_tmp = [];
    //if (!main_menu_order.ready) {
    //    main_menu_order.ready = "1";
    //}
    //settings
    var settings = plugin.createSettings("Ororo.tv", logo, "Online Videos");
    settings.createInfo("info", logo, "Plugin developed by Buksa \n");
    settings.createDivider('Settings:');
    settings.createBool("tosaccepted", "Accepted TOS (available in opening the plugin)", false, function(v) {
        service.tosaccepted = v;
    });
    settings.createBool("thetvdb", "Show more information using thetvdb", false, function(v) {
        service.thetvdb = v;
    });
    if (showtime.currentVersionInt >= 4 * 10000000 + 3 * 100000 + 261) {
        plugin.addItemHook({
            title: "Search in Another Apps",
            itemtype: "video",
            handler: function(obj, nav) {
                var title = obj.metadata.title;
                title = title.replace(/<.+?>/g, "").replace(/\[.+?\]/g, "");
                nav.openURL("search:" + title);
            }
        });
    }
    //First level start page
    plugin.addURI(PREFIX + "start", function(page) {
        var i, v;
        page.metadata.glwview = plugin.path + "views/array2.view";
        try {
            page.metadata.logo = plugin.path + "logo.png";
            page.metadata.title = PREFIX;
            pageMenu(page);
            items = [];
            items_tmp = [];
            v = showtime.httpReq(BASE_URL);
            if (!service.tosaccepted) if (showtime.message(tos, true, true)) service.tosaccepted = 1;
            else page.error("TOS not accepted. plugin disabled");
            // p(v.toString())
            page.metadata.title = new showtime.RichText(PREFIX + (/<title>(.*?)<\/title>/.exec(v)[1]));
            //var re = /<div class='index show'[\S\s]+?href="\/([^"]+)[\S\s]+?original="\/([^"]+)[\S\s]+?title'>([^<]+)<br>(.+?)<[\S\s]+?<p>([^<]+)/g;
            //var re = /<div class='index show'[\S\s]+?data-newest='([^']+)[\S\s]+?href="\/([^"]+)[\S\s]+?original="\/([^"]+)[\S\s]+?title'>([^<]+)<br>(.+?)<[\S\s]+?<p>([^<]+)/g
            var re = /<div class='index show'[\S\s]+?data-newest='([^']+)[\S\s]+?href="\/([^"]+)[\S\s]+?original="\/([^"]+)[\S\s]+?icon-star[\S\s]+?([0-9]+(?:\.[0-9]*)?)[\S\s]+?title'>([^<]+)<br>(.+?)<[\S\s]+?<p>([^<]+)/g;
            var m = re.execAll(v);
            for (i = 0; i < m.length; i++) {
                var item = page.appendItem(PREFIX + "page:" + m[i][2], "video", {
                    title: new showtime.RichText(trim(m[i][5]) + ' | ' + trim(m[i][6])),
                    description: new showtime.RichText(m[i][7]),
                    icon: BASE_URL + m[i][3],
                    rating: m[i][4] * 10
                });
                item.title = trim(m[i][5]);
                item.newest = m[i][1];
                item.rating = +m[i][4];
                items.push(item);
                items_tmp.push(item);
            }
            try {
                for (i in items) {
                    items[i].id = i;
                }
                //if (!main_menu_order.order) {
                items_tmp = page.getItems();
                //var its = [];
                //for (i in items) {
                //    items[i].orig_index = i;
                //    its.push(items[i]);
                //}
                //its.sort(function(a, b) {
                //    return a.title > b.title;
                //});
                for (i = 0; i < items_tmp.length; i++) {
                    if (!items_tmp[i].id) delete items_tmp[i];
                }
                items_tmp.sort(function(a, b) {
                    return b.newest > a.newest;
                });
                //       main_menu_order.order = showtime.JSONEncode(items_tmp);
                //    }
                //    main_menu_order.order;
                //var order = showtime.JSONDecode(main_menu_order.order);
                var order = (items_tmp);
                for (i in order) {
                    items[order[i].id].moveBefore(i);
                }
                page.reorderer = function(item, before) {
                    item.moveBefore(before);
                    var items = page.getItems();
                    for (var i = 0; i < items.length; i++) {
                        if (!items[i].id) delete items[i];
                    }
                    main_menu_order.order = showtime.JSONEncode(items);
                };
            } catch (ex) {
                t("Error while parsing main menu order");
                e(ex);
            }
            page.type = "directory";
            page.contents = "items";
        } catch (ex) {
            page.error("Failed to process page");
            e(ex);
        }
        page.loading = false;
    });
    plugin.addURI(PREFIX + "page:(.*)", function(page, link) {
        var i, v, item;
        try {
            v = showtime.httpReq(BASE_URL + link).toString();
            //var entries = [];
            var title = showtime.entityDecode(trim(match(/<img alt="(.+?)" id="poster"/, v, 1)));
            var year = parseInt(match(/<div id='year'[\S\s]+?([0-9]+(?:\.[0-9]*)?)/, v, 1), 10);
            ////get_fanart(page,metadata.title)
            var icon = match(/id="poster" src="\/(.+?)"/, v, 1);
            //metadata.description = trim(match(/<div itemprop="description">[\S\s]+?(.+?)<div/,v));
            page.metadata.title = title + " (" + year + ")";
            //<a href="#1-3" class="episode" data-href="/shows/planet-earth/videos/2946" data-id="2946" data-time="null">№3 Fresh Water</a>
            var re = /<a href="#?([^-]+)-([^"]+)" [\S\s]+?data-href="\/([^"]+)[\S\s]+?>([^<]+)/g;
            var m = re.execAll(v);
            if (m.toString()) {
                for (i = 0; i < m.length; i++) {
                    if (m[i][2] == '1') {
                        page.appendItem("", "separator", {
                            title: new showtime.RichText('Season ' + m[i][1])
                        });
                    }
                    item = page.appendItem(PREFIX + "play:" + m[i][3] + ':' + escape(m[i][4] + '|' + title + '|' + parseInt(m[i][1], 10) + '|' + parseInt(m[i][2], 10)), "video", {
                        title: new showtime.RichText(m[i][4]),
                        icon: BASE_URL + icon,
                        description: new showtime.RichText(''),
                        year: year
                    });
                    if (service.thetvdb) {
                        item.bindVideoMetadata({
                            title: trim(title),
                            season: parseInt(m[i][1], 10),
                            episode: parseInt(m[i][2], 10)
                        });
                    }
                }
            }
        } catch (ex) {
            page.error("Failed to process page");
            e(ex);
        }
        page.type = "directory";
        page.loading = false;
    });
    // Play links
    plugin.addURI(PREFIX + "play:(.*):(.*)", function(page, url, title) {
        page.metadata.logo = plugin.path + "logo.png";
        page.loading = false;
        page.type = "video";
        var s = unescape(title).split('|');
        var video = get_video_link(url);
        var videoparams = {
            no_fs_scan: true,
            title: unescape(s[1]),
            season: s[2],
            episode: s[3],
            canonicalUrl: PREFIX + "play:" + url + ":" + title,
            sources: [{
                url: video.url
            }],
            subtitles: [{
                url: video.sub,
                language: 'English',
                title: match(/subtitle\/.+?\/(.+)/, video.sub)
            }]
        };
        page.source = "videoparams:" + showtime.JSONEncode(videoparams);
    });

    function get_video_link(url) {
        var video = [];
        try {
            var v = showtime.httpReq(BASE_URL + url);
            //p(v.toString())
            video.url = BASE_URL + match(/video.tag.src = webm \? "\/(.+?)"/, v.toString(), 1);
            video.sub = BASE_URL + match(/src: "\/(.+?)"/, v.toString(), 1);
        } catch (err) {
            e(err);
        }
        return video;
    }

    function pageMenu(page) {
        //page.metadata.background = ui.background;
        page.metadata.background = plugin.path + "views/img/background.png";
        page.metadata.backgroundAlpha = 0.5;
        //page.metadata.font = "default";
        // page.appendAction("navopen", "search:", true, { title: "Search", icon: plugin.path + "views/img/search.png" });
        page.appendAction("pageevent", "sortDateDec", true, {
            title: "Sort by Date (Decrementing)",
            icon: plugin.path + "views/img/sort_date_dec.png"
        });
        page.appendAction("pageevent", "sortViewsDec", true, {
            title: "Sort by Views (Decrementing)",
            icon: plugin.path + "views/img/sort_views_dec.png"
        });
        page.appendAction("pageevent", "sortAlphabeticallyInc", true, {
            title: "Sort Alphabetically (Incrementing)",
            icon: plugin.path + "views/img/sort_alpha_inc.png"
        });
        page.appendAction("pageevent", "sortAlphabeticallyDec", true, {
            title: "Sort Alphabetically (Decrementing)",
            icon: plugin.path + "views/img/sort_alpha_dec.png"
        });
        //  page.appendAction("pageevent", "sortDefault", true, { title: "Sort as Default", icon: plugin.path + "views/img/sort_default.png" });
        var sorts = [
            ["sortAlphabeticallyInc", "Alphabetically (A->Z)"],
            ["sortAlphabeticallyDec", "Alphabetically (Z->A)"],
            ["sortViewsDec", "Views (decrementing)"],
            ["sortDateDec", "Published (decrementing)"],
            ["sortDefault", "Default", true]
        ];
        page.options.createMultiOpt("sort", "Sort by...", sorts, function(v) {
            eval(v + "()");
        });

        function sortAlphabeticallyInc() {
            var its = sort(items, "title", true);
            pageUpdateItemsPositions(its);
        }

        function sortAlphabeticallyDec() {
            var its = sort(items, "title", false);
            pageUpdateItemsPositions(its);
        }

        function sortViewsDec() {
            var its = sort(items, "rating", false);
            pageUpdateItemsPositions(its);
        }

        function sortDateDec() {
            var its = sort(items, "newest", false);
            pageUpdateItemsPositions(its);
        }

        function sortDefault() {
            for (var i in items_tmp) {
                items[i].moveBefore(items_tmp[i].orig_index);
            }
        }
        page.onEvent('sortAlphabeticallyInc', function() {
            sortAlphabeticallyInc();
        });
        page.onEvent('sortAlphabeticallyDec', function() {
            sortAlphabeticallyDec();
        });
        page.onEvent('sortViewsDec', function() {
            sortViewsDec();
        });
        page.onEvent('sortDateDec', function() {
            sortDateDec();
        });
        page.onEvent('sortDefault', function() {
            sortDefault();
        });
    }

    function pageUpdateItemsPositions(its) {
        for (var i in its) {
            items[its[i].orig_index].moveBefore(i);
        }
    }

    function sort(items, field, reverse) {
        if (items.length === 0) return null;
        var its = [];
        for (var i in items) {
            items[i].orig_index = i;
            its.push(items[i]);
        }
        its.sort(function(a, b) {
            return b[field] > a[field];
        });
        if (reverse) its.reverse();
        return its;
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