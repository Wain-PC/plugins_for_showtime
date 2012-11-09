/*
 *  kino-dom.tv - Showtime Plugin
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
 */
(function(plugin) {
    var PREFIX = 'kino-dom';
    var BASE_URL = 'http://kino-dom.tv';
    var INPUT_IMG = plugin.path + "images/input.png";
    var tos = 'The developer has no affiliation with the sites what so ever.\n' + 'Nor does he receive money or any other kind of benefits for them.\n\n' + 'The software is intended solely for educational and testing purposes,\n' + 'and while it may allow the user to create copies of legitimately acquired\n' + 'and/or owned content, it is required that such user actions must comply\n' + 'with local, federal and country legislation.\n\n' + 'Furthermore, the author of this software, its partners and associates\n' + 'shall assume NO responsibility, legal or otherwise implied, for any misuse\n' + 'of, or for any loss that may occur while using siteviewer.\n\n' + 'You are solely responsible for complying with the applicable laws in your\n' + 'country and you must cease using this software should your actions during\n' + 'siteviewer operation lead to or may lead to infringement or violation of the\n' + 'rights of the respective content copyright holders.\n\n' + "siteviewer is not licensed, approved or endorsed by any online resource\n " + "proprietary. Do you accept this terms?";
    //settings
    var service = plugin.createService("www.Kino-Dom.tv", PREFIX + ":start", "video", true, plugin.path + "images/logo.png");
    var settings = plugin.createSettings("www.Kino-Dom.tv", plugin.path + "images/logo.png", "OnLine Video Site");
    settings.createInfo("info", plugin.path + "images/logo.png", "Plugin developed by Buksa \n");
    settings.createDivider('Settings:');
    settings.createBool("tosaccepted", "Accepted TOS (available in opening the plugin):", false, function(v) {
        service.tosaccepted = v;
    });
    settings.createBool("debug", "Debug", false, function(v) {
        service.debug = v;
    });
    //start page
    plugin.addURI(PREFIX + ":start", function(page) {
        page.metadata.logo = plugin.path + "images/logo.png";
        page.metadata.title = "www.Kino-Dom.tv";
        page.type = "directory";
        page.contents = "list";

        if (!service.tosaccepted) if (showtime.message(tos, true, true)) service.tosaccepted = 1;
        else page.error("TOS not accepted. siteviewer disabled");
	
	get_cat(page, BASE_URL);
    });

    // browser uri
    plugin.addURI(PREFIX + ":index:(.*)", function(page, link) {

        index_page(page,link);

        page.type = "directory";
        page.contents = "contents";
        page.loading = false;
    });
    
    plugin.addURI(PREFIX + ":page:(.*)", function(page, link) {
	
	var html = showtime.httpGet(BASE_URL+link).toString();
        html = win2unicode(html);
	var entries = [];
	var metadata = {};

	var match =/<title>*(.*?)&raquo;/.exec(html);
	metadata.title = match[1];
	page.metadata.title = metadata.title;
	
	match = /<td valign="top"><img src="([^"]+)/.exec(html);
	if (match) {
	    var icon = match[1]
		if (icon.indexOf('\/upload') == 0)		
		    metadata.icon = BASE_URL + icon;
		    else metadata.icon = icon;
	}

	var tmp = getValue(html, ':10px;">', '</td></tr></table>');
	match =/Год.*(\d{4})</.exec(tmp);
	if (match)
	metadata.year = parseInt(match[1]);
	tmp = showtime.entityDecode(tmp)
	
	var video = /file=([^&]*)/.exec(html);

	if (video[1].indexOf('flv') !== -1)
	    page.appendItem(PREFIX + ":play:" + escape(video[1]) + ":" + metadata.title, "video", metadata);
	if ((video[1].indexOf('xml') !== -1)){
	    var pl = showtime.httpGet(video[1]).toString();
	    var items = pl.split('<track>');
		
		for (var i = 1; i < items.length; i++) {
		var item = items[i];

		var stitle =/<title>(.*?)</.exec(item);
		var title = /<creator>(.*?)</.exec(item);
		var video = /<location>(.*?)</.exec(item);
		page.appendItem(PREFIX + ":play:" + escape(video[1]) +":"+ escape(title[1]+"\n"+ stitle[1]) , "video",{
		    title: new showtime.RichText(unescape(title[1])+"/"+ stitle[1]),
		    icon : metadata.icon,
		    year : metadata.year,
		    director : metadata.year,
		    description : new showtime.RichText(getValue(html, ':10px;">', '</td></tr></table>'))
		});
	    }
	    
	}





        page.type = "directory";
        page.contents = "contents";
        page.loading = false;
    });
    plugin.addURI(PREFIX + ":play:(.*):(.*)", function(page, url, title) {
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
    plugin.addSearcher("Kino-Dom.tv - Videos", plugin.path + "images/logo.png", function(page, query) {
        try {
	    query = query.replace(/\s/g, '\+');
//http://kino-dom.tv/index.php?do=search&subaction=search&search_start=1&full_search=1&story=naruto&titleonly=3&searchuser=&replyless=0&replylimit=0&searchdate=0&beforeafter=after&sortby=date&resorder=desc&result_num=20&result_from=1&showposts=1&catlist%5B%5D=0	    
    	    var url = '/index.php?do=search&beforeafter=after&catlist%5B%5D=0&do=search&full_search=1&replyless=0&replylimit=0&resorder=desc&result_from=1&search_start=1&searchdate=0&searchuser=&showposts=1&sortby=date&story='+query+'&subaction=search&titleonly=3'
	    search(page, url);
	} catch (err) {
	    showtime.trace("Searcher for Kino-Dom has Error:" + err)
	}
    });    
    

    function get_cat(page, url) {
	/**
	 * Categories Block
	 * parse block
	 * <div class="block"><h1>Сериалы по жанрам</h1>', '</div>'
	 * RegExp: /http:\/\/kino-dom.tv(.*\/)".*">(.*)<\/a>/
	 * get  match[1] = uri
	 *      match[2] = name
	 */
	var html = showtime.httpGet(url).toString();
	    html = win2unicode(html);

	var cat = getValue(html, '<div class="block"><h1>Жанры</h1>', '</div>');
	    cat = cat.split('<br />');

	for (var i in cat) {
            var match = /<a href="(\/.*)" t.*>(.*?)<\/a>/g.exec(cat[i]);
            if (match)
		page.appendItem(PREFIX + ":index:" + match[1], "video", {
		    title: new showtime.RichText(match[2]),
		    icon: plugin.path + "images/logo.png"
		});
	}
          page.loading = false;
    }

    function parse_page (html) {
        if (!html) return false;

	html = getValue(html,"<div id='dle-content'>",'<div class="navigation">');
	var items = html.split('<div class="blocknews">');

	var entries = [];

	    for (var i = 1; i < items.length; i++) {
	        var url_title = /<h1> <a href="http:\/\/kino-dom.tv([^"]+)">([^<]+)/.exec(items[i]);
	        var cover = /<img src="([^"]+)/.exec(items[i]);

		if (cover[1].indexOf('\/upload') == 0)		
		    cover = BASE_URL + cover[1];
		    else cover = cover[1];
	        //var desc = /<div id="news-id.*">([^<]+)/.exec(items[i]);

		if (url_title && cover) {
		    var item = {
		        url: url_title[1],
		        title: url_title[2].replace("смотреть онлайн",''),
		        icon: cover
		 //       description: desc[1]
		    };
   
trace("item:"+i+showtime.JSONEncode(item));
		entries.push(item);
		}
	    }

	return entries;
    }


    function index_page(page, link) {

	var p = 1;

	function loader() {

	    var html = showtime.httpGet(BASE_URL+link+'page/' + p +'/').toString();
	    html = win2unicode(html);

	    var entries = parse_page(html);
	    for (var i in entries) {
		var item = entries[i];

		if (item.url)
		page.appendItem(PREFIX + ':page:' + escape(item.url), 'video', {
		    title: new showtime.RichText(item.title),
		    icon: item.icon
		});
	    }

	p++;

	    var re = /">Далее<\/a><\/div>/;
            if (!re.exec(html)) {
		return false;
		} else {
		    return true;
		    }
		
	}
	loader();
	page.loading = false;
	page.paginator = loader;
    }

    function search(page, url) {
	var html = showtime.httpGet(BASE_URL + url).toString();
	html = win2unicode(html);
//	html = getValue(html,'<span class="sresult">',"</div><div id=");
	var items = html.split('<span class="ntitle');

	page.entries = items.length;
	for (var i = 1; i < items.length; i++) {
	    var match = /: <a href="http:\/\/kino-dom.tv(.*)" >(.*)<\/a>/.exec(items[i]);
	    if (match)
	    page.appendItem(PREFIX + ':page:' + escape(match[1]), 'video', {
		    title: new showtime.RichText(match[2]),
		    icon: plugin.path + "images/logo.png"
		});
	    
	}
    }

    function getValue(doc, start, end) {
    /**
     * function from dinamic's source
     * get value betwen start end
     */
        var s = doc.indexOf(start);
        if (s < 0) return null;
        s = s + start.length;
        if (end !== null) {
            var e = doc.indexOf(end, s);
            if (e < 0) return null;
            return doc.substr(s, e - s);
        }
        return doc.substr(s);
    }


    function win2unicode(str) {
     /**
     * Windows-1251 to Unicode converter
     * Useful when having to use GET query parameters.
     * e.g. unescaped "%F2%E5%EA%F1%F2", "òåêñò" becomes "текст"
     * Source: http://xpoint.ru/know-how/JavaScript/PoleznyieFunktsii?38#PerekodirovkaIzWindows1251IKOI
     */
        var charmap = unescape("%u0402%u0403%u201A%u0453%u201E%u2026%u2020%u2021%u20AC%u2030%u0409%u2039%u040A%u040C%u040B%u040F" + "%u0452%u2018%u2019%u201C%u201D%u2022%u2013%u2014%u0000%u2122%u0459%u203A%u045A%u045C%u045B%u045F" + "%u00A0%u040E%u045E%u0408%u00A4%u0490%u00A6%u00A7%u0401%u00A9%u0404%u00AB%u00AC%u00AD%u00AE%u0407" + "%u00B0%u00B1%u0406%u0456%u0491%u00B5%u00B6%u00B7%u0451%u2116%u0454%u00BB%u0458%u0405%u0455%u0457");
        var code2char = function(code) {
                if (code >= 0xC0 && code <= 0xFF) return String.fromCharCode(code - 0xC0 + 0x0410);
                if (code >= 0x80 && code <= 0xBF) return charmap.charAt(code - 0x80);
                return String.fromCharCode(code);
            }
        var res = "";
        for (var i = 0; i < str.length; i++) res = res + code2char(str.charCodeAt(i));
        return res;
    }
    
    function trace(msg) {
        if (service.debug == '1') {
	    showtime.trace(PREFIX + msg);
	    showtime.print(msg);
	}
    }
    
})(this);