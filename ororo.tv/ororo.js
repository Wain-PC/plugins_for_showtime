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
//ver 0.1
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
    var service = plugin.createService("Ororo", PREFIX + "start", "video", true, logo);
    //settings
    var settings = plugin.createSettings("Ororo", logo, "Online Videos");
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
	var v = showtime.httpReq(BASE_URL)
	
        plugin.addItemHook({
            title: "Search in Another Apps",
            itemtype: "video",
            handler: function(obj, nav) {
                var title = obj.metadata.title;
                title = title.replace(/<.+?>/g, "").replace(/\[.+?\]/g, "");
                nav.openURL("search:" + title);
            }
        });
	

        if (!service.tosaccepted) if (showtime.message(tos, true, true)) service.tosaccepted = 1;
        else page.error("TOS not accepted. plugin disabled");
	
	
	
	
	var items = [];
	
	
    page.metadata.title = new showtime.RichText(PREFIX + (/<title>(.*?)<\/title>/.exec(v)[1]));
                
                var re = /<div class='index show'[\S\s]+?href="\/([^"]+)[\S\s]+?original="\/([^"]+)[\S\s]+?title'>([^<]+)<br>(.+?)<[\S\s]+?<p>([^<]+)/g;
                var m = re.execAll(v);
	            
                for (var i = 0; i < m.length; i++) {
                
                var item = page.appendItem(PREFIX + "page:" + m[i][1], "video", {
                        title: new showtime.RichText(trim(m[i][3])+ ' | ' + trim (m[i][4])),
                        description: new showtime.RichText(m[i][5]),
                        icon: BASE_URL + m[i][2]
                    });
		item.title = trim(m[i][3]);
		items.push(item);
                }
		
            var its = [];
	    for (var i in items) {
		items[i].orig_index = i;
		its.push(items[i]);
		}
	    its.sort(function(a,b){return a["title"] > b["title"]});
	    
	    for (var i in its) {
	    items[its[i].orig_index].moveBefore(i);
	    }


        page.type = "directory";
        page.contents = "list";
        page.loading = false;
    });

    plugin.addURI(PREFIX + "page:(.*)", function(page, link) {
	page.flush();
        var i, v, item
        p(BASE_URL + link);
        try {
            v = showtime.httpReq(BASE_URL + link).toString();
	
            //var entries = [];
            var metadata = {};
            metadata.title = trim(match(/<img alt="(.+?)" id="poster"/,v));
	    metadata.year = parseInt(match(/<div id='year'[\S\s]+?([0-9]+(?:\.[0-9]*)?)/,v),10);
	    p(parseInt(match(/<div id='year'[\S\s]+?([0-9]+(?:\.[0-9]*)?)/,v),10))
            ////get_fanart(page,metadata.title)
            metadata.icon = match(/id="poster" src="\/(.+?)"/, v)
            
            //metadata.description = trim(match(/<div itemprop="description">[\S\s]+?(.+?)<div/,v));
            p(showtime.JSONEncode(metadata));
            page.metadata.title = metadata.title + " (" + metadata.year + ")";
                var re = /<a href="#?([^-]+)-([^"]+)" class="episode" data-episode-id="(.+?)" data-href="\/(.+?)">(.+?)<\/a>/g;
                var m = re.execAll(v);
                p(m)
                if (m.toString()) {
                    for (var i = 0; i < m.length; i++) {
		    if (m[i][2] == '1') {page.appendItem("", "separator", {
                        title: new showtime.RichText('Season '+m[i][1])
                    });
		    }

                     item = page.appendItem(PREFIX + "play:" + m[i][4] +':'+ escape(m[i][5]), "video",{
                        title: new showtime.RichText(m[i][5]),
                        icon: BASE_URL + metadata.icon,
                        description: new showtime.RichText(''),
                        year: '' 
                        
                        });

                    //item.bindVideoMetadata({title: metadata.title ,  season : parseInt(m[i][1],10), episode: parseInt(m[i][2],10)}) 
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
    plugin.addURI(PREFIX + "play:(.*):(.*)", function(page, url, title) {
    page.metadata.logo = plugin.path + "logo.png";
    page.loading = false;
    page.type = "video";
    page.source = "videoparams:" + showtime.JSONEncode({
        title: unescape(title),
        canonicalUrl: PREFIX + "play:" + url + ":" + title,
        sources: get_video_link(url)
            });
    });
    


    
    function get_video_link(url) {
        var result_url = BASE_URL+url;
        try {
            showtime.trace('Link for page: ' + result_url);
            var v = showtime.httpReq(result_url);
	    p(v)
        

	    var sources = [{url: BASE_URL+(/video.tag.src = "\/(.+?)"/.exec(v)[1]),
		    subtitles: BASE_URL+(/src: "\/(.+?)"/.exec(v)[1])
                }]

            showtime.trace("Video Link: " + result_url);
        } catch (err) {
            e(err);
        }
        return sources;
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
    

    
    function sort(items, field, reverse) {
        if (items.length == 0) return null;

        var its = [];
        for (var i in items) {
            items[i].orig_index = i;
            its.push(items[i]);
        }

        its.sort(function(a,b){return b[field] > a[field]});
        if (reverse) its.reverse();

        return its;
    }
       function pageUpdateItemsPositions(its) {
        for (var i in its) {
	      p(showtime.JSONEncode(items))
            items[its[i].orig_index].moveBefore(i);
        }
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