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
//ver 0.6.6 API
(function(plugin) {
    var PREFIX = 'HDSerials';
    var BASE_URL = 'http://hdserials.galanov.net';
    var logo = plugin.path + "img/logo.png";

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
        var JSON = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/backend/model.php', {
            method: 'POST',
	    caching: true,
            headers: {
                'User-Agent': 'Android;HD Serials v.1.6.3;en-US;motorola DROIDX;SDK 10;v.2.3.3(REL)'
            },
            args: {
                id: 'common-categories'
            }
        }));
        page.appendItem(PREFIX + ':news:news', 'directory', {
            title: 'Сериалы HD новинки',
            icon: logo
        });
        page.appendItem(PREFIX + ':sub-categories:0:Последние 200 обновлений на сайте:200', 'directory', {
            title: 'Последние 200 обновлений на сайте',
            icon: logo
        });
        for (i in JSON.data) {
            page.appendItem(PREFIX + ':' + JSON.id + ':' + JSON.data[i].id + ':' + escape(JSON.data[i].title_ru), 'directory', {
                title: new showtime.RichText(JSON.data[i].title_ru + blueStr(JSON.data[i].video_count)),
                icon: logo
            });
        }
    }
    plugin.addURI(PREFIX + ":news:(.*)", function(page, id) {
        var counter = 0;
        setPageHeader(page, 'Сериалы HD новинки');
        var JSON = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/backend/model.php', {
            method: 'POST',
            caching: true,
            headers: {
                'User-Agent': 'Android;HD Serials v.1.6.3;en-US;motorola DROIDX;SDK 10;v.2.3.3(REL)'
            },
            args: {
                id: id
            }
        }));
        for (var i in JSON.data) {
            page.appendItem(PREFIX + ':filter-videos:' + JSON.data[i].video_id + ':' + escape(JSON.data[i].video_title_ru + (JSON.data[i].video_season ? " " + JSON.data[i].video_season : "")), "video", {
                title: new showtime.RichText(JSON.data[i].video_title_ru + (JSON.data[i].video_title_en ? " / " + JSON.data[i].video_title_en : "") + (JSON.data[i].video_season ? " " + JSON.data[i].video_season : "")),
                description: new showtime.RichText(JSON.data[i].date + ' ' + JSON.data[i].title + '\n' + JSON.data[i].video_title_ru + (JSON.data[i].video_title_en ? " / " + JSON.data[i].video_title_en : "") + (JSON.data[i].video_season ? " " + JSON.data[i].video_season : "")),
                icon: JSON.data[i].video_image_file
            });
            counter++;
        }
    });
    // Shows genres of the category jump to sub-categories
    plugin.addURI(PREFIX + ":common-categories:(.*):(.*)", function(page, id, title) {
        setPageHeader(page, unescape(title));
        var JSON = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/backend/model.php', {
            method: 'POST',
            headers: {
                'User-Agent': 'Android;HD Serials v.1.6.3;en-US;motorola DROIDX;SDK 10;v.2.3.3(REL)'
            },
            args: {
                id: 'sub-categories',
                parent: id,
                start: 1
            }
        }));
        for (i in JSON.data) {
            if (JSON.data[i].video_count !== '0') page.appendItem(PREFIX + ':' + JSON.id + ':' + JSON.data[i].id + ':' + escape(JSON.data[i].title_ru) + ':' + JSON.data[i].video_count, 'directory', {
                title: new showtime.RichText(JSON.data[i].title_ru + blueStr(JSON.data[i].video_count)),
                icon: logo
            });
        }
    });
    // Shows sub-categories jump to filter-videos
    plugin.addURI(PREFIX + ":sub-categories:(.*):(.*):(.*)", function(page, category_id, title, video_count) {
        var offset = 0;
        var counter = 0;
        var anchor = 0;
        setPageHeader(page, unescape(title));

        function loader() {
            if (parseInt(video_count, 10) <= counter) return false;
            var JSON = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/backend/model.php', {
                method: 'POST',
                headers: {
                    'User-Agent': 'Android;HD Serials v.1.6.3;en-US;motorola DROIDX;SDK 10;v.2.3.3(REL)'
                },
                args: {
                    id: 'filter-videos',
                    category: category_id,
                    fresh: 1,
                    start: offset,
                    limit: 25
                }
            }));
            for (var i in JSON.data) {
                page.appendItem(PREFIX + ':' + JSON.id + ':' + JSON.data[i].id + ':' + escape(JSON.data[i].title_ru + (JSON.data[i].season ? " " + showtime.entityDecode(JSON.data[i].season) : "")), "video", {
                    title: showtime.entityDecode(unescape(JSON.data[i].title_ru)) + (JSON.data[i].title_en ? " / " + showtime.entityDecode(JSON.data[i].title_en) : "") + (JSON.data[i].season ? " " + showtime.entityDecode(JSON.data[i].season) : ""),
                    year: +parseInt(JSON.data[i].year, 10),
                    icon: unescape(JSON.data[i].image_file)
                });
                counter++;
            }
            offset += 25;
            return true;
        }
        loader();
        page.loading = false;
        page.paginator = loader;
    });
    plugin.addURI(PREFIX + ":filter-videos:(.*):(.*)", function(page, id, title) {
        var i;
        setPageHeader(page, unescape(title));
        var JSON = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/backend/model.php', {
            method: 'POST',
            headers: {
                'User-Agent': 'Android;HD Serials v.1.6.3;en-US;motorola DROIDX;SDK 10;v.2.3.3(REL)'
            },
            args: {
                id: 'video',
                video: id
            }
        }));
        var genres = "";
        for (i in JSON.data.genres) {
            genres += JSON.data.genres[i].title_ru;
            if (i < JSON.data.genres.length - 1) genres += ', ';
        }
        var actors = "";
        for (i in JSON.data.actors) {
            actors += JSON.data.actors[i].title_ru;
            if (i < JSON.data.actors.length - 1) actors += ', ';
        }
        var directors = "";
        for (i in JSON.data.directors) {
            directors += JSON.data.directors[i].title_ru;
            if (i < JSON.data.directors.length - 1) directors += ', ';
        }
        for (i in JSON.data.files) {
            var item = page.appendItem(PREFIX + ':' + JSON.id + ':' + escape(JSON.data.files[i].url) + ':' + escape(JSON.data.files[i].title), "video", {
                title: showtime.entityDecode(unescape(JSON.data.files[i].title)),
                season: showtime.entityDecode(unescape(JSON.data.info.season ? JSON.data.info.season : "")),
                description: "Перевод: " + JSON.data.info.translation + "\n" + JSON.data.info.description,
                duration: JSON.data.info.duration,
                genre: genres,
                actor: actors,
                director: directors,
                year: +parseInt(JSON.data.info.year, 10),
                icon: unescape(JSON.data.info.image_file)
            });
            //    item.bindVideoMetadata({title: JSON.data.info.title_en, season: 2, episode: parseInt(i)+1,  year: parseInt(JSON.data.info.year)})
        }
    });
    // Play links
    plugin.addURI(PREFIX + ":video:(.*):(.*)", function(page, url, title) {
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
        var result_url = url;
        showtime.trace('php Link for page: ' + url);
        if ((url.indexOf("vk.com") > 0) || (url.indexOf("/vkontakte.php?video") > 0) || (url.indexOf("vkontakte.ru/video_ext.php") > 0) || (url.indexOf("/vkontakte/vk_kinohranilishe.php?id=") > 0)) {
            var v = showtime.httpGet(url).toString();
            if (v.match('This video has been removed from public access.')) {
                result_url = v.match('This video has been removed from public access.');
                return result_url;
            }
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
        } else {
            v = url.match("video\/(.*?)\/iframe")[1];
            var JSON = showtime.JSONDecode(showtime.httpReq('http://moonwalk.cc/sessions/create', {
                debug: true,
                postdata: {
                    video_token: v
                }
            }));
            result_url = 'hls:' + JSON.manifest_m3u8;
        }
        showtime.trace("Video Link: " + result_url);
        return result_url;
    }

    function debug(message) {
        showtime.trace(message, plugin.getDescriptor().id);
        showtime.print(message);
    }
    plugin.addURI(PREFIX + ":start", startPage);
    plugin.addSearcher(PREFIX + " - Videos", plugin.path + "logo.png", function(page, query) {
        try {
            var offset = 0;
            var counter = 0;
            var anchor = 0;
            setPageHeader(page, query);
            var loader = function loader() {
                    if (anchor) return false;
                    var JSON = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/backend/model.php', {
                        method: 'POST',
                        headers: {
                            'User-Agent': 'Android;HD Serials v.1.6.3;en-US;motorola DROIDX;SDK 10;v.2.3.3(REL)'
                        },
                        args: {
                            id: 'filter-videos',
                            category: 0,
                            search: query,
                            start: offset,
                            limit: 25
                        }
                    }));
                    for (var i in JSON.data) {
                        page.appendItem(PREFIX + ':' + JSON.id + ':' + JSON.data[i].id + ':' + escape(JSON.data[i].title_ru + (JSON.data[i].season ? " " + showtime.entityDecode(JSON.data[i].season) : "")), "video", {
                            title: showtime.entityDecode(unescape(JSON.data[i].title_ru)) + (JSON.data[i].title_en ? " / " + showtime.entityDecode(JSON.data[i].title_en) : "") + (JSON.data[i].season ? " " + showtime.entityDecode(JSON.data[i].season) : ""),
                            year: +parseInt(JSON.data[i].year, 10),
                            icon: unescape(JSON.data[i].image_file)
                        });
                        page.entries++;
                    }
                    offset += 25;
                    if (JSON.endOfData) {
                        anchor = 1;
                        return false;
                    }
                    return true;
                };
            loader();
            page.loading = false;
            page.paginator = loader;
        } catch (err) {
            showtime.trace('HDSerials.ru - Ошибка поиска: ' + err);
        }
    });
})(this);