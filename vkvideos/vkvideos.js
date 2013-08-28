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
//ver 0.2
(function(plugin) {
    var PREFIX = 'VKVideos',
        // bazovyj adress saita
        BASE_URL = 'https://api.vkontakte.ru/method/',
        logo = plugin.path + 'logo.png',
        access_token = '2bdd2fc3bc43ed9d1a6d0c45fe22bc9c86a083d883406adc3f9d77403c85b8df4ba1e63d173ca764deb7c';
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
        if (!service.tosaccepted) {
            showtime.message(tos, true, true);
            service.tosaccepted = 1;
        } else page.error("TOS not accepted. plugin disabled");
        //poshel na poisk :)
        page.appendItem(PREFIX + ":index:null", "directory", {
            title: "VK Videos Search",
            icon: plugin.path + "logo.png"
        });
        page.type = "directory";
        page.loading = false;
    });
    plugin.addURI(PREFIX + ":index:(.*)", function(page, query) {
        page.contents = "items";
        page.type = "directory";
        page.metadata.logo = plugin.path + "logo.png";
        var offset = 0;
        query = unescape(query);
        if (query == 'null') {
            var search = showtime.textDialog('Search for Video:', true, true);
            if (search.rejected) {
                return;
            }
            query = search.input;
            if (query.length === 0) {
                return;
            }
        }
        //var args = { q: query,
        //sort: 0,
        //count: 50,
        //offset: offset,
        //access_token: api.access_token
        //}
        //var data = api.video.search(query);
        //showtime.print(data);

        function loader() {
            var num = 0;
            var url = "https://api.vkontakte.ru/method/video.search";
            var args = {
                q: query,
                sort: 0,
                count: 20,
                adult: 0,
                offset: offset,
                access_token: access_token
            };
            //     p(showtime.JSONEncode(args))
            var data = showtime.httpReq(url, {
                debug: true,
                args: args
            });
            var JSON = showtime.JSONDecode(data.toString());
            var c = 0;
            for (var i in JSON.response) {
                c++;
                page.appendItem(PREFIX + ":play:" + escape(JSON.response[i].player) + ':' + escape(JSON.response[i].title), "video", {
                    title: JSON.response[i].title,
                    icon: JSON.response[i].image_medium,
                    duration: JSON.response[i].duration,
                    description: JSON.response[i].title
                });
            }
            page.entries = c;
            num += c;
            offset += c;
            return JSON.response.length !== 0;
        }
        loader();
        page.loading = false;
        page.paginator = loader;
    });
    // Play links
    plugin.addURI(PREFIX + ":play:(.*):(.*)", function(page, url, title) {
        var video = get_video_link(unescape(url));
        t('video url: '+video)

        if (video != unescape(url.replace('vkontakte.ru', 'vk.com'))) {
            page.type = "video";
            page.source = "videoparams:" + showtime.JSONEncode({
                title: unescape(title),
                no_fs_scan: true,
                canonicalUrl: PREFIX + ":play:" + url + ":" + title,
                sources: [{
                    url: video
                }]
            });
        } else {
            showtime.notify('video net ili hoster ne propisan', 3);
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
            p(v)

            //player.molodejj.tv
            //http://api.molodejj.tv/tv/pladform.php?pl=544&pl=544&type=video&site=vkontakte%5Fembed&vid=1725&channel=3
            //http://player.molodejj.tv/player_mjj.swf?pl=544&vid=1725&site=vkontakte_embed&type=video&channel=3
            if (/player.molodejj.tv[^']+/.exec(v)) {
              url =(/player.molodejj.tv[^']+/.exec(v)).toString();
              var res = getUrlArgs(url);
              url = putUrlArgs('http://api.molodejj.tv/tv/pladform.php',res.args)
              v = showtime.httpReq('http://api.molodejj.tv/tv/pladform.php',{debug:true, args: res.args})
              result_url = /videoURL=([^&]+)/.exec(v)[1];
              return result_url;
            }
            //rutube.ru
            if (/rutube.ru\/(?:.*\/)?([a-f0-9]+)/.exec(v)) {
                var id = (/rutube.ru\/(?:.*\/)?([a-f0-9]+)/.exec(v)[1]);
                url = 'http://rutube.ru/api/play/trackinfo/'+id+'?no_404=true&format=json';
                JSON = showtime.JSONDecode(showtime.httpGet(url));
                result_url = JSON.video_balancer.m3u8;
                return result_url;
            }
            //
            //var regex = new RegExp("tu(?:\.be|be\.com)/(?:.*v(?:/|=)|(?:.*/)?)([a-zA-Z0-9-_]+)");
            //var id = regex.exec(tmp);
            //    page.appendItem('youtube:video:simple:' + escape(xml.channel[i].title) + ":" + escape(id[1]), "video", {
            //            title: new showtime.RichText(xml.channel[i].title.replace(/(?:о|О)нлайн/g, "").replace(/(?:С|с)мотреть/g, "")),
            //            description: new showtime.RichText(showtime.entityDecode(xml.channel[i].description)),
            //            icon: xml.channel[i].logo.toString() ? xml.channel[i].logo : xml.channel[i].logo_30x30
            //        });
            //
            //

            var JSON = (/var vars = (.+)/.exec(v)[1]);

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
    plugin.addSearcher(PREFIX + " - Videos", plugin.path + "logo.png", function(page, query) {
        try {
            var offset = 0;
            showtime.trace("Search VK Videos for: " + query);
            var loader = function loader() {
                    var num = 0;
                    var url = "https://api.vkontakte.ru/method/video.search";
                    var args = {
                        q: query,
                        sort: 0,
                        count: 20,
                        offset: offset,
                        access_token: access_token
                    };
                    var data = showtime.httpReq(url, {
                        debug: true,
                        args: args
                    });
                    var JSON = showtime.JSONDecode(data.toString());
                    var c = 0;
                    for (var i in JSON.response) {
                        c++;
                        page.appendItem(PREFIX + ":play:" + escape(JSON.response[i].player) + ':' + escape(JSON.response[i].title), "video", {
                            title: JSON.response[i].title,
                            icon: JSON.response[i].image_medium,
                            duration: JSON.response[i].duration,
                            description: JSON.response[i].title
                        });
                    }
                    page.entries = c;
                    num += c;
                    offset += c;
                    return JSON.response.length !== 0;
                };
            loader();
            page.loading = false;
            page.paginator = loader;
        } catch (err) {
            page.error("Failed to process search");
            e(err);
        }
    });


    function getUrlArgs(url) {
        var link = url;

        var result = {
            url: link,
            args: {}
        };

        var args = {};

        if (link.indexOf('?') != -1) {
            var args_tmp = url.slice(url.indexOf('?') + 1);            
            args_tmp = args_tmp.split('&');

            for (var i in args_tmp) {
                var arg = args_tmp[i];
                var arg_tmp = arg.split('=');
                args[arg_tmp[0]] = arg_tmp[1];
            }

            link = link.slice(0, link.indexOf('?'));
        }

        result.url = link;
        result.args = args;
        return result;
    }
    
    function putUrlArgs(url, args) {
        var link = url + '?';
        var args_end = false;
        
        for (var i in args) {
            link += i + '=' + args[i] + '&';
            args_end = true;
        }

        if (args_end)
            link = link.slice(0, link.length - 1);

        return link;
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