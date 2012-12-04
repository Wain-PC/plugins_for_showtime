/*
 *  video.az - Showtime Plugin
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
 */ (function (plugin) {
    var PREFIX = 'videoaz';
    var BASE_URL = 'http://www.video.az';
    var INPUT_IMG = plugin.path + "images/input.png";
    var tos = 'The developer has no affiliation with the sites what so ever.\n' + 'Nor does he receive money or any other kind of benefits for them.\n\n' + 'The software is intended solely for educational and testing purposes,\n' + 'and while it may allow the user to create copies of legitimately acquired\n' + 'and/or owned content, it is required that such user actions must comply\n' + 'with local, federal and country legislation.\n\n' + 'Furthermore, the author of this software, its partners and associates\n' + 'shall assume NO responsibility, legal or otherwise implied, for any misuse\n' + 'of, or for any loss that may occur while using siteviewer.\n\n' + 'You are solely responsible for complying with the applicable laws in your\n' + 'country and you must cease using this software should your actions during\n' + 'siteviewer operation lead to or may lead to infringement or violation of the\n' + 'rights of the respective content copyright holders.\n\n' + "siteviewer is not licensed, approved or endorsed by any online resource\n " + "proprietary. Do you accept this terms?";
    //settings
    var service = plugin.createService("www.video.az", PREFIX + ":start", "video", true, plugin.path + "images/logo.png");
    var settings = plugin.createSettings("www.video.az", plugin.path + "images/logo.png", "OnLine Video Site");
    settings.createInfo("info", plugin.path + "images/logo.png", "Plugin developed by Buksa \n");
    settings.createDivider('Settings:');
    settings.createBool("tosaccepted", "Accepted TOS (available in opening the plugin):", false, function (v) {
        service.tosaccepted = v;
    });
    settings.createBool("debug", "Debug", false, function (v) {
        service.debug = v;
    });
    //start page
    plugin.addURI(PREFIX + ":start", function (page) {
        page.metadata.logo = plugin.path + "images/logo.png";
        page.metadata.title = "www.video.az";
        page.type = "directory";
        page.contents = "list";

        if (!service.tosaccepted) if (showtime.message(tos, true, true)) service.tosaccepted = 1;
        else page.error("TOS not accepted. siteviewer disabled");

        //Азербайджанское кино http://www.video.az/ru/movie/category/azeri
        page.appendItem(PREFIX + ':index:/ru/movie/category/azeri', 'directory', {
            title: 'Азербайджанское кино',
            icon: plugin.path + "images/logo.png"
        });
        // <a href="http://www.video.az/ru/movie/category/foreign">Зарубежное кино</a>
        page.appendItem(PREFIX + ':index:/ru/movie/category/foreign', 'directory', {
            title: 'Зарубежное кино',
            icon: plugin.path + "images/logo.png"
        });
        ////<a href="http://www.video.az/ru/chanel/serials">Сериалы</a>
        //page.appendItem(PREFIX + ':index:/ru/chanel/serials', 'directory', {
        //    title: 'Сериалы',
        //    icon: plugin.path + "images/logo.png"
        //});
        ////get_cat(page, BASE_URL);
	page.loading = false;
    });

    // browser uri
    plugin.addURI(PREFIX + ":index:(.*)", function (page, link) {

        index_page(page, link);

        page.type = "directory";
        page.contents = "contents";
        page.loading = false;
    });

    plugin.addURI(PREFIX + ":page:(.*)", function (page, link) {
	trace('page: Trying to httpGet: ' + unescape(link));
        var html = showtime.httpGet(unescape(link), null, null, {debug: 1}).toString();
	trace("page: Got response from httpGet: " + unescape(link));
	parse_page(page,html);

        page.type = "directory";
        page.contents = "contents";
        page.loading = false;
    });
    plugin.addURI(PREFIX + ":play:(.*):(.*)", function (page, url, title) {
        var video = unescape(url);
        showtime.trace('Video Playback: Reading ' + video);
        page.source = "videoparams:" + showtime.JSONEncode({
            title: new showtime.RichText(unescape(title)),
            sources: [{
                url: video
            }]
        });
        page.type = "video";
        page.loading = false;
    });
    plugin.addSearcher("www.video.az - Videos", plugin.path + "images/logo.png", function (page, query) {
        try {
	    showtime.trace(" Search on Video.az for: "+query);
            query = query.replace(/\s/g, '\+');
            var url = '/ru/movie/search/?q=' + query;
            search(page, url);
        } catch (err) {
            showtime.trace("Searcher for video.az  has Error:" + err)
        }
    });

    function parse_page(page, html) {
	trace("call parse_page function");
	var re = /"og:title" content="([^\"]+)[\S\s]*?description" content="([^\"]+)[\S\s]*?image" content="([^\"]+)/;
        trace('parse_page: Regexing HTML for item 1-title 2-desc 3-img')
	var match = re.exec(html);
	
        if (match) {
            //http://85.132.53.172/hds-vod/content/pub/movie/112012/4/60/839/460839646131.mp4Seg1-Frag3
            //http://cdn5.video.az/pub/thumb/medium/112012/4/60/839/460839646131.jpg
            //http://cdn5.video.az/pub/movie/112012/4/60/839/460839646131.mp4
            var video = match[3].replace('thumb/medium', 'movie').replace('.jpg', '.mp4');
            page.appendItem(PREFIX + ":play:" + escape(video) + ":" + escape(match[1]), "video", {
                title: new showtime.RichText(match[1]),
                icon: match[3],
                description: new showtime.RichText(match[2])
            });
        }
	
    }

    function index_page(page, link) {

        var p = 1;

        function loader() {
            trace('index: Trying to httpGet: ' + BASE_URL + link + '/' + p);
            var html = showtime.httpGet(BASE_URL + link + '/' + p, null, null, {
                debug: 1
            }).toString();
            trace("index: Got response from httpGet: " + link + '/' + p);
            //trace ("HTML CONTENT:\n" + html);

            var re = /class="list_movies">[\S\s]*?href="([^"]+).*title="([^\"]+).*?<img src="([^"]+)/g;
            trace('index: Regexing HTML for item 1-link 2-title 3-img')
            var match = re.exec(html);
            trace('index: Done regexing');
            while (match) {
                page.appendItem(PREFIX + ":page:" + escape(match[1]), "video", {
                    title: new showtime.RichText(match[2]),
                    icon: match[3]
                    // description: new showtime.RichText(match[5])
                });
                showtime.trace('index: Regexing an item inside of the loop...');
                match = re.exec(html);
                showtime.trace('index: Done regexing the item inside of the loop...');
            }
            p++;

            var re = />&gt;<\/a>&nbsp;<\/p><br \/>/;
            showtime.trace('index: Trying to check if the page is last...');
            if (!re.exec(html)) {
                showtime.trace('index: This is a last page...');
                return false
            } else {
                showtime.trace('index: This is not last page...');
                return true;
            }
        }
        loader();
        page.loading = false;
        page.paginator = loader;
        showtime.trace('index: PAGE IS LOADED...');
    }

    function search(page, url) {
	trace('index: Trying to httpGet: ' + BASE_URL + url);
        var html = showtime.httpGet(BASE_URL + url, null, null, {debug:1}).toString();
        trace("index: Got response from httpGet: " + BASE_URL + url);

        var re = /class="list_movies">[\S\s]*?href="([^"]+).*title="([^\"]+).*?<img src="([^"]+)/g;
        trace('index: Regexing HTML for item 1-link 2-title 3-img')
        var match = re.exec(html);
        trace('index: Done regexing');
	var i = 0;

        while (match) {
            page.appendItem(PREFIX + ":page:" + escape(match[1]), "video", {
                title: new showtime.RichText(match[2]),
                icon: match[3]
                // description: new showtime.RichText(match[5])
            });
            showtime.trace('index: Regexing an item inside of the loop...');
            match = re.exec(html);
            showtime.trace('index: Done regexing the item inside of the loop...');
	    i++;
	    
        }
	
	page.entries = i;
    }

    //function get_cat(page, url) {
    //    /**
    //     * Categories Block
    //     * parse block
    //     * <div class="block"><h1>Сериалы по жанрам</h1>', '</div>'
    //     * RegExp: /http:\/\/kino-dom.tv(.*\/)".*">(.*)<\/a>/
    //     * get  match[1] = uri
    //     *      match[2] = name
    //     */
    //    var html = showtime.httpGet(url).toString();
    //    html = win2unicode(html);
    //
    //    var cat = getValue(html, '<div class="block"><h1>Жанры</h1>', '</div>');
    //    cat = cat.split('<br />');
    //
    //    for (var i in cat) {
    //        var match = /<a href="(\/.*?)".*>(.*?)<\//.exec(cat[i]);
    //        if (match) page.appendItem(PREFIX + ":index:" + match[1], "video", {
    //            title: new showtime.RichText(match[2]),
    //            icon: plugin.path + "images/logo.png"
    //        });
    //    }
    //    page.loading = false;
    //}

    function trace(msg) {
        if (service.debug == '1') {
            showtime.trace(PREFIX +':'+ msg);
            //showtime.print(msg);
        }
    }

})(this);