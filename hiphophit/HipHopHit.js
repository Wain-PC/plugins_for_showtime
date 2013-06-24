/*
 *  HipHopHit  - Showtime Plugin
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
    var PREFIX = 'HipHopHit:';
    // bazovyj adress saita
    var BASE_URL = 'http://www.hiphophit.tv/';
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
    var service = plugin.createService("HipHopHit", PREFIX + "start", "video", true, logo);
    //settings
    var settings = plugin.createSettings("HipHopHit", logo, "Online Videos");
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
        //http://www.hiphophit.tv/novelties/    
        page.appendItem(PREFIX + "index:novelties", "directory", {
            title: "Музновинки",
            icon: plugin.path + "logo.png"
        });
        //http://www.hiphophit.tv/video/
        page.appendItem(PREFIX + "index:video", "directory", {
            title: "Клипы",
            icon: plugin.path + "logo.png"
        });
        //http://www.hiphophit.tv/artists/all/
/*       page.appendItem(PREFIX + "index:artists/all/", "directory", {
            title: "Артисты",
            icon: plugin.path + "logo.png"
        });*/
        page.type = "directory";
        page.contents = "items";
        page.loading = false;
    });
    //Second level 
    plugin.addURI(PREFIX + "index:(.*)", function(page, link) {
        page.contents = "items";
        page.type = "directory";
        page.metadata.logo = plugin.path + "logo.png";

        var v = showtime.httpReq(BASE_URL + link + '/');
        page.metadata.title = PREFIX + (/<title>(.*?)<\/title>/.exec(v)[1]);
        var offset = 1;
        var total_page = parseInt(/class="last">.*?\/page-(.+?)/.exec(v)[1], 10);

            function loader() {
                var v = showtime.httpReq(BASE_URL + link + '/page-' + offset + '/').toString();
                offset++;
                var re = /<a href="\/(.*?)" title="(.*?)"><img  alt="(.*?)" src="\/(.*?)"><\/a>/g;
                var m = re.execAll(v);
                for (var i = 0; i < m.length; i++) {
                    page.appendItem(PREFIX + "play:" + escape(m[i][1]) + ':' + escape(m[i][2]), "video", {
                        title: new showtime.RichText(m[i][2]),
                        description: new showtime.RichText(m[i][2]),
                        icon: BASE_URL + m[i][4]
                    });
                }
                return offset < parseInt(/class="last">.*?\/page-(.+?)\//.exec(v)[1], 10);
            }
        loader();
        page.loading = false;
        page.paginator = loader;
    });
    // Play links
    plugin.addURI(PREFIX + "play:(.*):(.*)", function(page, url, title) {
        var video = get_video_link(unescape(url));
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

    function get_video_link(url) {
        var result_url = url;
        try {
            result_url = BASE_URL + (/file": "\/(.+?)"/.exec(showtime.httpReq(BASE_URL + url))[1]);
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