/**
 *  HDSerials plugin for Showtime
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
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
//ver 0.1 API
(function (plugin) {

    plugin.addHTTPAuth("http://HDSerials.galanov.net.*", function (authreq) {
        authreq.setHeader('User-Agent', 'Android;HD Serials v.1.4.0.draft;en-US;motorola DROIDX;SDK 10;v.2.3.3(REL)');
    });

    var PREFIX = 'HDSerials';
    var BASE_URL = 'http://HDSerials.galanov.net';
    var logo = plugin.path + "img/logo.png"

        function trim(s) {
            s = s.replace(/(\r\n|\n|\r)/gm, "");
            s = s.replace(/(^\s*)|(\s*$)/gi, "");
            s = s.replace(/[ ]{2,}/gi, " ");
            return s;
        }

        function blueStr(str) {
            return '<font color="6699CC"> (' + str + ')</font>';
        }

        function setPageHeader(page, title) {
            if (page.metadata) {
                page.metadata.title = PREFIX + ' : ' + title;
                page.metadata.logo = logo;
            }
            page.type = "directory";
            page.contents = "items";
            page.loading = false;
        }

    var service = plugin.createService("HDSerials.ru", PREFIX + ":start", "video", true, logo);

    function startPage(page) {
        setPageHeader(page, 'фильмы, сериалы и мультфильмы в HD.');

        var JSON = showtime.JSONDecode(showtime.httpGet(BASE_URL + '/backend/model.php?id=common-categories', null, {
            'User-Agent': 'Android;HD Serials v.1.4.0.draft;en-US;motorola DROIDX;SDK 10;v.2.3.3(REL)'
        }));

        for (i in JSON.data) {
            page.appendItem(PREFIX + ':' + JSON.id + ':' + JSON.data[i].id + ':' + escape(JSON.data[i].title_ru), 'directory', {
                title: new showtime.RichText(unescape(JSON.data[i].title_ru) + blueStr(JSON.data[i].video_count)),
                icon: logo
            });
        };

    };

    // Shows genres of the category jump to sub-categories
    plugin.addURI(PREFIX + ":common-categories:(.*):(.*)", function (page, id, title) {
        setPageHeader(page, unescape(title));
        var JSON = showtime.JSONDecode(showtime.httpGet(BASE_URL + '/backend/model.php?id=sub-categories&parent=' + id + '&start=1', null, {
            'User-Agent': 'Android;HD Serials v.1.4.0.draft;en-US;motorola DROIDX;SDK 10;v.2.3.3(REL)'
        }));

        for (i in JSON.data) {
            if (JSON.data[i].video_count !== '0') page.appendItem(PREFIX + ':' + JSON.id + ':' + JSON.data[i].id + ':' + escape(JSON.data[i].title_ru) + ':' + JSON.data[i].video_count, 'directory', {
                title: new showtime.RichText(unescape(JSON.data[i].title_ru) + blueStr(JSON.data[i].video_count)),
                icon: logo
            })
        };
    });

    // Shows sub-categories jump to filter-videos
    plugin.addURI(PREFIX + ":sub-categories:(.*):(.*):(.*)", function (page, category_id, title, video_count) {
        var offset = 0;
        var counter = 0;
        var anchor = 0;
        setPageHeader(page, unescape(title));

        //HDSerials.galanov.net/backend/model.php?id=filter-videos&category=36&fresh=1&start=1&limit=15

        function loader() {
            if (parseInt(video_count) <= counter) return false
            var params = '/backend/model.php?id=filter-videos&category=' + category_id + '&fresh=1&start=' + offset + '&limit=20'
            var JSON = showtime.JSONDecode(showtime.httpGet(BASE_URL + params, null, {
                'User-Agent': 'Android;HD Serials v.1.4.0.draft;en-US;motorola DROIDX;SDK 10;v.2.3.3(REL)'
            }));


            for (var i in JSON.data) {
                page.appendItem(PREFIX + ':' + JSON.id + ':' + JSON.data[i].id + ':' + escape(JSON.data[i].title_ru + (JSON.data[i].season ? " " + showtime.entityDecode(JSON.data[i].season) : "")), "video", {
                    title: showtime.entityDecode(unescape(JSON.data[i].title_ru)) + (JSON.data[i].title_en ? " / " + showtime.entityDecode(JSON.data[i].title_en) : "") + (JSON.data[i].season ? " " + showtime.entityDecode(JSON.data[i].season) : ""),
                    year: +parseInt(JSON.data[i].year),
                    icon: unescape(JSON.data[i].image_file)
                });
                counter++

            };
            offset += 20;

            return true;

        };

        loader();
        page.loading = false;
        page.paginator = loader;
    });

    plugin.addURI(PREFIX + ":filter-videos:(.*):(.*)", function (page, id, title) {
        setPageHeader(page, unescape(title));
        //http://HDSerials.galanov.net/backend/model.php?id=video&video=2070
        var JSON = showtime.JSONDecode(showtime.httpGet(BASE_URL + "/backend/model.php?id=video&video=" + id));

        var genres = "";
        for (var i in JSON.data.genres) {
            var entry = JSON.data.genres[i];
            genres += entry.title_ru;
            if (i < JSON.data.genres.length - 1) genres += ', ';
        }

        var actors = "";
        for (var i in JSON.data.actors) {
            var entry = JSON.data.actors[i];
            actors += entry.title_ru;
            if (i < JSON.data.actors.length - 1) actors += ', ';
        }

        var directors = "";
        for (var i in JSON.data.directors) {
            var entry = JSON.data.directors[i];
            actors += entry.title_ru;
            if (i < JSON.data.directors.length - 1) directors += ', ';
        }



        for (var i in JSON.data.files) {
            page.appendItem(PREFIX + ':' + JSON.id + ':' + escape(JSON.data.files[i].url) + ':' + escape(JSON.data.files[i].title), "video", {
                title: showtime.entityDecode(unescape(JSON.data.files[i].title)),
                season: showtime.entityDecode(unescape(JSON.data.info.season ? JSON.data.info.season : "")),
                description: "Перевод: " + JSON.data.info.translation + "\n" + JSON.data.info.description,
                duration: JSON.data.info.duration,
                genre: genres,
                actor: actors,
                year: +parseInt(JSON.data.info.year),
                icon: unescape(JSON.data.info.image_file)
            });
        };
    });


    // Play links
    plugin.addURI(PREFIX + ":video:(.*):(.*)", function (page, url, title) {
        url = get_video_link(unescape(url));

        page.type = "video";
        page.source = "videoparams:" + showtime.JSONEncode({
            title: unescape(title),
            canonicalUrl: PREFIX + ":video:" + url + ":" + title,
            sources: [{
                url: unescape(url)
            }]
        });
        page.loading = false;
    })

    function get_video_link(url) {
        var result_url = url;
        showtime.trace('php Link for page: ' + url);
        if ((url.indexOf("vk.com") > 0) || (url.indexOf("/vkontakte.php?video") > 0) || (url.indexOf("vkontakte.ru/video_ext.php") > 0) || (url.indexOf("/vkontakte/vk_kinohranilishe.php?id=") > 0)) {
            var v = showtime.httpGet(url).toString();
            var video_host = v.match("var video_host = '(.+?)';")[1];
            var video_uid = v.match("var video_uid = '(.*)'")[1];
            var video_vtag = v.match("var video_vtag = '(.*)'")[1];
            var video_no_flv = v.match("video_no_flv =(.*);")[1];
            var video_max_hd = v.match("var video_max_hd = '(.*)'")[1];
            if (video_no_flv == 1) {
                switch (video_max_hd) {
                    case "0":
                        var fname = "240.mp4";
                        break;
                    case "1":
                        var fname = "360.mp4";
                        break;
                    case "2":
                        var fname = "480.mp4";
                        break;
                    case "3":
                        var fname = "720.mp4";
                        break;
                }
                result_url = video_host + "u" + video_uid + "/videos/" + video_vtag + "." + fname;
            } else {
                var vkid = v.match("vkid=(.*)&" [1]);
                fname = "vk.flv";
                result_url = "http://" + video_host + "/assets/videos/" + video_vtag + vkid + "." + fname;
            }
        }
        showtime.trace("Video Link: " + result_url);
        return result_url;
    }

    plugin.addURI(PREFIX + ":start", startPage);

    plugin.addSearcher("HDSerials.ru", logo,
    //http://HDSerials.galanov.net/backend/model.php?id=filter-videos&category=0&search=happy&start=0&limit=10
    function (page, query) {
        try {
            var offset = 0;
            var counter = 0;
            var anchor = 0;
            setPageHeader(page, query);

            function loader() {
                if (anchor) return false

                var params = '/backend/model.php?id=filter-videos&category=0&search=' + query + '&start=' + offset + '&limit=15'
                var JSON = showtime.JSONDecode(showtime.httpGet(BASE_URL + params));

                for (var i in JSON.data) {
                    page.appendItem(PREFIX + ':' + JSON.id + ':' + JSON.data[i].id + ':' + escape(JSON.data[i].title_ru + (JSON.data[i].season ? " " + showtime.entityDecode(JSON.data[i].season) : "")), "video", {
                        title: showtime.entityDecode(unescape(JSON.data[i].title_ru)) + (JSON.data[i].title_en ? " / " + showtime.entityDecode(JSON.data[i].title_en) : "") + (JSON.data[i].season ? " " + showtime.entityDecode(JSON.data[i].season) : ""),
                        year: +parseInt(JSON.data[i].year),
                        icon: unescape(JSON.data[i].image_file)
                    });
                    page.entries++;

                };
                offset += 15;
                if (JSON.endOfData) {
                    anchor = 1
                    return false;
                }
                return true

            };
            loader();
            page.loading = false;
            page.paginator = loader;

        } catch (err) {
            showtime.trace('HDSerials.ru - Ошибка поиска: ' + err)
        }
    });

})(this);
