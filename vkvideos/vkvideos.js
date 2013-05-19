/*
 *  VK Videos  - Showtime Plugin
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
    var PREFIX = 'VKVideos';
    // bazovyj adress saita
    var BASE_URL = 'https://api.vkontakte.ru/method/';
    var logo = plugin.path + 'logo.png';
    var access_token = '2bdd2fc3bc43ed9d1a6d0c45fe22bc9c86a083d883406adc3f9d77403c85b8df4ba1e63d173ca764deb7c';
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
    //settings
    var service = plugin.createService("VK Videos", PREFIX + ":start", "video", true, logo);
    var settings = plugin.createSettings("VK Videos", logo, "OnLine Video Hosting");
    settings.createInfo("info", logo, "Plugin developed by Buksa \n");
    settings.createDivider('Settings:');
    settings.createBool("tosaccepted", "Accepted TOS (available in opening the plugin):", false, function(v) {
        service.tosaccepted = v;
    });
    settings.createBool("debug", "Debug", false, function(v) {
        service.debug = v;
    });
    //Nachalnaya stranica 
    plugin.addURI(PREFIX + ":start", function(page) {
        page.metadata.logo = plugin.path + "logo.png";
        page.metadata.title = PREFIX;
        //page.type = "directory";
        //page.contents = "list";
        if (!service.tosaccepted) if (showtime.message(tos, true, true)) service.tosaccepted = 1;
        else page.error("TOS not accepted. plugin disabled");
    //    //poshel na poisk :)
    //    page.appendItem(PREFIX + ":search", "directory", {
    //        title: "VK Videos Search",
    //        icon: plugin.path + "logo.png"
    //    });
    //    page.type = "directory";
    //    page.contents = "items";
    //    page.loading = false;
    //});
    //plugin.addURI(PREFIX + ":search", function(page) {
        // page.metadata.glwview = plugin.path + "views/lists.view";
        page.type = "directory";
        var search = showtime.textDialog('Search for Video:', true, true);
        if (search.rejected) {
            return;
        }
        var query = search.input;
        if (query.length === 0) {
            return;
        }
        //https://api.vkontakte.ru/method/video.search?q=lost&sort=0&count=50&access_token=2bdd2fc3bc43ed9d1a6d0c45fe22bc9c86a083d883406adc3f9d77403c85b8df4ba1e63d173ca764deb7c
        var v = showtime.httpGet(BASE_URL + "video.search", {
            'q': query,
            'sort': 0,
            'count': 25,
            'access_token': access_token
        });
        var JSON = showtime.JSONDecode(v);
        // var search_video = [];
        for (var i in JSON.response) {
            page.appendItem(PREFIX + ":play:" + escape(JSON.response[i].player) + ':' + escape(JSON.response[i].title), "video", {
                title: JSON.response[i].title,
                icon: JSON.response[i].image_medium,
                duration: JSON.response[i].duration,
                description: JSON.response[i].title
            });
            //search_video.push({
            //    title : item.title,
            //    image : item.image_medium,
            //    url : PREFIX +":play:" + escape(item.player)
            //    })
        }
        //page.appendPassiveItem("list", search_video, { title: "Search Movies" });
        page.loading = false;
    });
    // Play links
    plugin.addURI(PREFIX + ":play:(.*):(.*)", function(page, url, title) {
        var video = get_video_link(unescape(url));
        if (showtime.probe(video).result === 0) {
            page.type = "video";
            page.source = "videoparams:" + showtime.JSONEncode({
                title: unescape(title),
                canonicalUrl: PREFIX + ":video:" + url + ":" + title,
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

    function get_video_link(url) {
        var result_url = url.replace('vkontakte.ru', 'vk.com');
        try {
            showtime.trace('php Link for page: ' + result_url);
            var v = showtime.httpGet(result_url);
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
                switch (JSON.hd) {
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
    plugin.addSearcher(PREFIX + " - Videos", plugin.path + "logo.png", function(page, query) {
        try {
            showtime.trace("Search VK Videos for: " + query);
        var v = showtime.httpGet(BASE_URL + "video.search", {
            'q': query,
            'sort': 0,
            'count': 25,
            'access_token': access_token
        });
        var JSON = showtime.JSONDecode(v);
        // var search_video = [];
        for (var i in JSON.response) {
            page.appendItem(PREFIX + ":play:" + escape(JSON.response[i].player) + ':' + escape(JSON.response[i].title), "video", {
                title: JSON.response[i].title,
                icon: JSON.response[i].image_medium,
                duration: JSON.response[i].duration,
                description: JSON.response[i].title
            });
        }
        p(i)
        
        page.entries = i;
        } catch (err) {
            page.error("Failed to process search");
            e(err);
        }
    });

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