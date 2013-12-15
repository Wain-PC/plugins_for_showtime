/**
 *  HDSerials plugin for Showtime
 *
 *  Copyright (C) 2013 Buksa, Wain
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
//ver 0.7.0 API
(function(plugin) {
    var PREFIX = 'HDSerials';
    var BASE_URL = 'http://hdserials.galanov.net';
    var logo = plugin.path + "img/logo.png";
    var USER_AGENT = 'Android;HD Serials v.1.7.0;ru-RU;google Nexus 4;SDK 10;v.2.3.3(REL)';

    function trim(s) {
        s = s.replace(/(\r\n|\n|\r)/gm, "");
        s = s.replace(/(^\s*)|(\s*$)/gi, "");
        s = s.replace(/[ ]{2,}/gi, " ");
        return s;
    }

    function blueStr(str) {
        return '<font color="6699CC"> (' + str + ')</font>';
    }

    //this MUST be used at the end of the corresponding function
    //else there is no loading circle
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
    var settings = plugin.createSettings("HDSerials", logo, "HDSerials: Integration of the website HDSerials.ru into Showtime");
    settings.createInfo("info", logo, "Plugin developed by Buksa \n");
    settings.createDivider('Settings:');
    var Resolution = [
        ['0', 'Auto', true],
        ['1', '720p'],
        ['2', '480p'],
        ['3', '360p']
    ];
    
    settings.createBool("Show_finished", "Показывать сообщение о достижении конца директории", true, function(v) {
        service.showEndOfDirMessage = v;
    });
    
    settings.createMultiOpt("Resolution", "Разрешение", Resolution, function(v) {
        service.Resolution = v;
    });
    
    var requestMinDelay = [
      [1000,'1 сек'],
      [2000,'2 сек'],
      [3000,'3 сек',true]
    ];
    
    settings.createMultiOpt("Min.Delay", "Интервал запросов к серверу", requestMinDelay, function(v) {
        service.requestMinDelay = v;
    });
    settings.createInfo("info2",'', "Чем меньше значение - тем быстрее подгрузка списков в директориях с большим количеством файлов, но тем больше вероятность ошибки сервера. \n");
    
    var requestQuantity = [
      [10,'10'],
      [15,'15'],
      [20,'20',true],
 
    ];
    
    settings.createMultiOpt("requestQuantity", "Количество запрашиваемых данных в одном запросе", requestQuantity, function(v) {
        service.requestQuantity = v;
    });
    
    var qualityNotAvailableError = "Невозможно открыть видео в "+Resolution[service.Resolution][1]+", используется максимально доступное качество";

    function startPage(page) {
        
        var JSON = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/backend/model.php', {
            method: 'POST',
            headers: {
                'User-Agent': USER_AGENT
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
        setPageHeader(page, 'фильмы, сериалы и мультфильмы в HD.');
    }
    plugin.addURI(PREFIX + ":news:(.*)", function(page, id) {
        var counter = 0;
        var JSON = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/backend/model.php', {
            method: 'POST',
            headers: {
                'User-Agent': USER_AGENT
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
        setPageHeader(page, 'Сериалы HD новинки');
    });
    // Shows genres of the category jump to sub-categories
    plugin.addURI(PREFIX + ":common-categories:(.*):(.*)", function(page, id, title) {
        var JSON = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/backend/model.php', {
            method: 'POST',
            headers: {
                'User-Agent': USER_AGENT
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
        setPageHeader(page, unescape(title));
    });
    // Shows sub-categories jump to filter-videos
    plugin.addURI(PREFIX + ":sub-categories:(.*):(.*):(.*)", function(page, category_id, title, video_count) {
        var offset = 0;
        var counter = 0;
        var anchor = 0;
	var lastRequest = 0,
	    requestFinished = true,
	    requestNumber=0;
	
	
	//trying to implement a delay function to prevent server overload when fast scrolling
	//returns value of time before next request can be made, or zero if the request can be made immediately
	function countDelay(delay) {
	  //showtime.print('Getting difference between:'+lastRequest+" and "+showtime.time());
	  var timeDiff = getTimeDifference(lastRequest,showtime.time())*1000;
	  //showtime.print("time sinse last call:"+timeDiff);
	  if(timeDiff<delay) {
	    //wait for the delay time to end
	    return delay-timeDiff;
	  }
	  else {
	   return 0; 
	  }
	  
	}


        function loader() {
	  if(!requestFinished) {
	    //showtime.print("Request not finished yet, exiting");
	    return false;
	  }
	  //showtime.print(video_count+" "+counter);
            if (parseInt(video_count) <= counter) {
	      if(service.showEndOfDirMessage && requestNumber>2) {
		showtime.notify("Достигнут конец директории",2);
	      }
	      return false;
	    }
	    var JSON;
	      
	      var delay = countDelay(service.requestMinDelay);
	      
	      var loadJSON = function() {
		try {
		lastRequest = showtime.time();
		requestFinished = false;
		//showtime.print("Time to make some requests now!");
		var JSON = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/backend/model.php', {
		    method: 'POST',
		    headers: {
			'User-Agent': USER_AGENT
		    },
		    args: {
			id: 'filter-videos',
			category: category_id,
			fresh: 1,
			start: offset,
			limit: service.requestQuantity
		    }
		}));
		requestFinished = true;
		requestNumber++;
		//showtime.print("Request finished!. Got "+JSON.data.length);
		return JSON;
		}
		catch(err) {
		 showtime.notify("Подгрузка контента не удалась. Возможно, сервер не ответил вовремя.",5);
		 return false;
		}
	      };
	      
		  //showtime.print("Let's wait "+delay+" msec before making a request!");
		  showtime.sleep(delay);
		  JSON = loadJSON();
		  
		  if(!JSON) return false;
	      
	      
            for (var i in JSON.data) {
                page.appendItem(PREFIX + ':' + JSON.id + ':' + JSON.data[i].id + ':' + escape(JSON.data[i].title_ru + (JSON.data[i].season ? " " + showtime.entityDecode(JSON.data[i].season) : "")), "video", {
                    title: showtime.entityDecode(unescape(JSON.data[i].title_ru)) + (JSON.data[i].title_en ? " / " + showtime.entityDecode(JSON.data[i].title_en) : "") + (JSON.data[i].season ? " " + showtime.entityDecode(JSON.data[i].season) : ""),
                    year: +parseInt(JSON.data[i].year, 10),
                    icon: unescape(JSON.data[i].image_file)
                });
                counter++;
            }
            offset += JSON.data.length;
            return true;
        }
        loader();
        setPageHeader(page, unescape(title));
        page.paginator = loader;
    });
    
    
    plugin.addURI(PREFIX + ":filter-videos:(.*):(.*)", function(page, id, title) {
        var i, genres, actors, directors;
        var JSON = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/backend/model.php', {
            method: 'POST',
            headers: {
                'User-Agent': USER_AGENT
            },
            args: {
                id: 'video',
                video: id
            }
        }));
        if (JSON.data.genres) {
            genres = "";
            for (i in JSON.data.genres) {
                genres += JSON.data.genres[i].title_ru;
                if (i < JSON.data.genres.length - 1) genres += ', ';
            }
        }
        if (JSON.data.actors) {
            actors = "";
            for (i in JSON.data.actors) {
                actors += JSON.data.actors[i].title_ru;
                if (i < JSON.data.actors.length - 1) actors += ', ';
            }
        }
        if (JSON.data.directors) {
            directors = "";
            for (i in JSON.data.directors) {
                directors += JSON.data.directors[i].title_ru;
                if (i < JSON.data.directors.length - 1) directors += ', ';
            }
        }
        for (i in JSON.data.files) {
            var item = page.appendItem(PREFIX + ':' + JSON.id + ':' + escape(JSON.data.files[i].url) + ':' + escape(JSON.data.files[i].title), "video", {
                title: showtime.entityDecode(unescape(JSON.data.files[i].title)),
                season: showtime.entityDecode(unescape(JSON.data.info.season ? JSON.data.info.season : "")),
                description: JSON.data.info.translation ? "Перевод: " + JSON.data.info.translation + "\n" + JSON.data.info.description : JSON.data.info.description,
                duration: JSON.data.info.duration ? JSON.data.info.duration : '',
                genre: genres ? genres : '',
                actor: actors ? actors : '',
                director: directors ? directors : '',
                year: JSON.data.info.year ? parseInt(JSON.data.info.year, 10) : '',
                icon: JSON.data.info.image_file ? unescape(JSON.data.info.image_file) : ''
            });
            //item.bindVideoMetadata({title: JSON.data.info.title_en, season: 2, episode: parseInt(i)+1,  year: parseInt(JSON.data.info.year)})
        }
        setPageHeader(page, unescape(title));
    });
    // Play links
    plugin.addURI(PREFIX + ":video:(.*):(.*)", function(page, url, title) {
	//no loading circle was present, forcing
	page.loading = true;
        var video = get_video_link(unescape(url));
        if (showtime.probe(video).result === 0) {
            page.type = "video";
            page.source = "videoparams:" + showtime.JSONEncode({
                title: unescape(title),
                no_fs_scan: true,
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
        var result_url = url,
            fname, v;
        showtime.trace('php Link for page: ' + url);
        if ((url.indexOf("vk.com") > 0) || (url.indexOf("/vkontakte.php?video") > 0) || (url.indexOf("vkontakte.ru/video_ext.php") > 0) || (url.indexOf("/vkontakte/vk_kinohranilishe.php?id=") > 0)) {
            v = showtime.httpGet(url).toString();
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
                    fname = "240.mp4";
                    break;
                case "1":
                    vfname = "360.mp4";
                    break;
                case "2":
                    fname = "480.mp4";
                    break;
                case "3":
                    fname = "720.mp4";
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
            var JSON = showtime.JSONDecode(showtime.httpReq('http://moonwalk.cc/sessions/create_session', {
                debug: true,
                postdata: {
                    video_token: v
                }
            }));
            result_url = 'hls:' + JSON.manifest_m3u8;
            var m = /.*index.m3u8.*/g.execAll(showtime.httpReq(JSON.manifest_m3u8));
            switch (service.Resolution) {
            case '0':
                result_url = 'hls:' + JSON.manifest_m3u8;
                break;
            case '1':
	      //not each and every video contains 720p link
	      //as a workaround, play best quality available
	      //or m[2] will be undefined. This will give us 403 error on playback.
	      if(m[2]) {
		//well, same here
		//except I've never seen such videos. Just in case...
                result_url = 'hls:' + JSON.manifest_m3u8.split('mbr')[0] + m[2];
	      }
	      else {
		result_url = 'hls:' + JSON.manifest_m3u8.split('mbr')[0] + m[m.length-1];
		showtime.notify(qualityNotAvailableError,5);
	      }
                break;
            case '2':
	      if(m[1]) {
                result_url = 'hls:' + JSON.manifest_m3u8.split('mbr')[0] + m[1];
	      }
	      else {
		result_url = 'hls:' + JSON.manifest_m3u8.split('mbr')[0] + m[m.length-1];
	      }
                break;
            case '3':
	      //let's assume that at least one item is available
                result_url = 'hls:' + JSON.manifest_m3u8.split('mbr')[0] + m[0];
                break;
            }
        }
        showtime.print("Video Link: " + result_url);
        return result_url;
    }

    function debug(message) {
        showtime.trace(message, plugin.getDescriptor().id);
        showtime.print(message);
    }

    function p(message) {
        if (typeof(message) === 'object') message = showtime.JSONEncode(message);
        showtime.print(message);
    }
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
    plugin.addURI(PREFIX + ":start", startPage);
    plugin.addSearcher(PREFIX + " - Videos", plugin.path + "logo.png", function(page, query) {
        try {
            var offset = 0;
            var loader = function loader() {
                    var JSON = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/backend/model.php', {
                        method: 'POST',
                        headers: {
                            'User-Agent': USER_AGENT
                        },
                        args: {
                            id: 'filter-videos',
                            category: 0,
                            search: query,
                            start: offset,
                            limit: 20
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
                    offset += 20;
                    return !JSON.endOfData;
                };
	    setPageHeader(page, query);
            loader();
            page.paginator = loader;
        } catch (err) {
            showtime.trace('HDSerials.ru - Ошибка поиска: ' + err);
        }
    });
    
    function getTimeDifference(startUnix,endUnix) {
  return endUnix-startUnix; //in milliseconds
}
    
})(this);