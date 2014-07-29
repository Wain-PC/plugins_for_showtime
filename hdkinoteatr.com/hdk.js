/**
 *  HDK plugin for Showtime
 *
 *  Copyright (C) 2014, Wain
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
//ver 0.8 API
(function(plugin) {
    var plugin_info = plugin.getDescriptor();
    var PREFIX = plugin_info.id;
    var BASE_URL = 'http://www.hdkinoteatr.com';
    var logo = plugin.path + "img/logo.png";
    var USER_AGENT = 'Mozilla/5.0 (X11; Ubuntu; Linux i686; rv:16.0) Gecko/20120815 Firefox/16.0';


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
    
    var service = plugin.createService("HDK", PREFIX + ":start", "video", true, logo);
    var settings = plugin.createSettings("HDK", logo, "HDKinoteatr.ru");
    settings.createInfo("info", logo, "Developed by " + plugin_info.author + ". \n");
    
    settings.createInt("Min.Delay", "Интервал запросов к серверу (default: 3 сек)", 3, 1, 10, 1, 'сек', function(v) {
        service.requestMinDelay = v;
    });
    
    
    function startPage(page) {
	
        page.appendItem(PREFIX + ':movies:all:Фильмы', 'directory', {
            title: 'Фильмы',
            icon: logo
        });
	
	page.appendItem(PREFIX + ':movies:series:Сериалы', 'directory', {
            title: 'Cериалы',
            icon: logo
        });
	

        setPageHeader(page, 'HDK');
    }
    
    
    function moviesListPage(page,genre, genreName) {
      
      
      var respond = '';
      var url = '';
      
      if(!genre || genre=='all') {
	//make genre list
	debug(BASE_URL + '/catalog/');
              respond = showtime.httpReq(BASE_URL + '/catalog/', {
            method: 'GET',
            headers: {
                'User-Agent': USER_AGENT
            } 
        }).toString();
	      
	var re = /<ul class="cats">([\s\S]*)<\/ul>/; //finding menu			
      var menuHTML = respond.match(re)[1];
      
      re = /<li><a href="\/([\S]*)\/">(\S*)<\/a><\/li>/g;
      var menu = re.exec(menuHTML);
      
      while(menu) {
	debug("M:"+menu);
	page.appendItem(PREFIX + ':movies:'+menu[1]+':'+menu[2], 'directory', {
            title: menu[2],
            icon: logo
        });
	
	menu = re.exec(menuHTML);
      }
      
      
	      
      } //endif
      //genre defined
      else {
	var pageNumber = 1;
	var list;
	var requestFinished = true,
	lastRequest = 0;
	
	
	        function loader() {
            if (!requestFinished) {
                debug("Request not finished yet, exiting");
                return false;
            }

            var delay = countDelay(service.requestMinDelay * 1000,lastRequest);
            var loadItems = function() {
                    try {
                        lastRequest = showtime.time();
                        requestFinished = false;
			debug("Time to make some requests now!");
			//make request here
			
			debug('L:'+BASE_URL+'/'+genre+'/page/'+pageNumber);
			list = listScraper(BASE_URL+'/'+genre+'/page/'+pageNumber+'/',false);
			pageNumber++;
			
                        requestFinished = true;
                        showtime.print("Request finished!");
                        return list;
                    } catch (err) {
		      //end of pages
		      if(err.message == 'HTTP error: 404') {
			showtime.notify("Достигнут конец директории.", 5);
			return false;
		      }
		      //most probably server overload
		      else {
                        showtime.notify("Подгрузка не удалась. Возможно, сервер перегружен.", 5);
			//trying to reload the page
			pageNumber--;
			return true;
		      }
		     }
                };
            showtime.print("Let's wait " + delay + " msec before making a request!");
            showtime.sleep(delay);
	    var list = loadItems();
	    
	    for(var i=0;i<list.length;i++) {
	  page.appendItem(PREFIX + ':movie:'+escape(list[i].title)+':'+escape(list[i].url)+':'+escape(list[i].image), 'video', {
            title: list[i].title,
            icon: BASE_URL+list[i].image
        });
	}
	    
            return true;
        }
	
	
	loader();
	
	page.paginator = loader;
	
      }  
      
      setPageHeader(page, genreName);
    }
    
    function moviePage(page,title,url,imageURL) {
      var i=0,
	  j=0;
	  var videoURL;
      
      title = unescape(title);
      url = unescape(url);
      imageURL = unescape(imageURL);
      
      page.loading = true;
      
      //'url' here is a FULL one. There's no need to add BASE_URL.
	  debug('Going for:'+url);
          var respond = showtime.httpReq(url, {
            method: 'GET',
            headers: {
                'User-Agent': USER_AGENT
            } 
        }).toString();
	
	var re = /makePlayer\('([\S\s]{0,300})'\);/;
	
	var code = re.exec(respond);
	// ONLY ONE ITEM-----------------------------------------------------
	if(code) {
	  code = code[1];
	
	debug("CODE:"+code);
	
	re = /code=code\.replace\(([\s\S]{0,300})\);/;
	var replacing = re.exec(respond);
	replacing = 'code.replace('+replacing[1]+');'
	
	
	var videoURL = code;

	page.appendItem(PREFIX + ':playvideo:'+escape(videoURL)+':'+ escape(title) + ':' + escape(replacing), 'video', {
	  title: title,
	  icon: BASE_URL + imageURL
	});
	}
	// END ONE ITEM---------------------------------------
	
	// MORE ITEMS-----------------------------------------
	else {
	  re = /var vkArr=\[\{([\s\S]*)\}\];/;
	  var videoList = re.exec(respond);
	  if(videoList) {
	    debug("VL:"+videoList);
	   videoList = eval('[{'+videoList[1]+'}]'); 
	   

	   re = /code=code\.replace\(([\s\S]{0,300})\);/;
	   var replacing = re.exec(respond);
	   debug("RL:"+replacing);
	   
	   replacing = 'code.replace('+replacing[1]+');' 
	   
	   for(i=0;i<videoList.length;i++) {
	   
	     //playlist contains several seasons--------------------------------
	     if(videoList[i].playlist) {
	       
	       page.appendItem("", "separator", {
                title: new showtime.RichText(videoList[i].comment)
            });
	       //looping through series in a season
	       for(j=0;j<videoList[i].playlist.length;j++) {
		 videoURL = videoList[i].playlist[j].file;
		 
		 page.appendItem(PREFIX + ':playvideo:'+escape(videoURL)+':'+ escape(videoList[i].playlist[j].comment)+':'+escape(replacing), 'video', {
		title: new showtime.RichText(videoList[i].playlist[j].comment),
		icon: BASE_URL + imageURL
	      });
	       }
	       
	     }
	     
	     //it's a series (without seasons)---------------------------------
	     else {
	       
	       videoURL = videoList[i].file
	       
	      page.appendItem(PREFIX + ':playvideo:'+escape(videoURL)+':'+ escape(title + ' ' + videoList[i].comment)+':'+escape(replacing), 'video', {
		title: new showtime.RichText(title + ' ' + videoList[i].comment),
		icon: BASE_URL + imageURL
	      });
	      
	     }
	      
	      
	      
	    }
	  }
	}
	
	
      
	setPageHeader(page,title);
    }
    
    
    function listScraper (url,respond) {
      
      if(!respond) {
      respond = showtime.httpReq(url, {
            method: 'GET',
            headers: {
                'User-Agent': USER_AGENT
            } 
        }).toString();

      }
	
	
	var re = /<h.? class="btl"><a href="([\S]*)"[\s\S]{0,300}.?>([\S\s]{0,300})<\/a><\/h.?>/g;
	
	var items = new Array(),
	    i=0;
	
	var item = re.exec(respond);
	
	while(item) {
	  debug("Found title:"+item[2]);
	  items.push( {
	    url: item[1],
	    title:item[2]
	  });
	  item = re.exec(respond);
	}
	
	re = /<div class="img">[\S\s]{0,300}<img src="(\S*)"/g;
	
	item = re.exec(respond);
	
	while(item) {
	  debug(item[1]);
	  items[i].image = item[1];
	  i++;

	  item = re.exec(respond);
	}
	
	
	debug('Returning list with '+items.length+' items');
	
	return items;
      
    }
    
    
    function playVideo (page, url, title, replacer) {
        //no loading circle was present, forcing
        page.loading = true;
	url = unescape(url);
	title = unescape(title);
	replacer = unescape(replacer);
	
	var video = getPlayerURL(url,replacer);
	      debug("Got VURL:"+url);
	      
	 if(!video) {
	   page.error("Это видео недоступно для просмотра");
	   return false;
	 }

        if (showtime.probe(video).result === 0) {
            page.type = "video";
            page.source = "videoparams:" + showtime.JSONEncode({
                title: unescape(title),
                no_fs_scan: true,
                canonicalUrl: PREFIX + ":playvideo:" + url + ":" + title,
                sources: [{
                    url: video
                }]
            });
        } else if (video.search('youtube') != -1) {
	  
	  page.redirect(video);
        }
        page.metadata.logo = logo;
        page.loading = false;
	return true;
    }
    
    
    function searcher(page, query) {
      
      var respond = showtime.httpReq(BASE_URL + '/', {
                debug: true,
                postdata: {
                    do: 'search',
                    subaction: 'search',
                    story: query
                }
            }).toString();
	    
     var list = listScraper(false,respond);
      
     for(var i=0;i<list.length;i++) {
	  page.appendItem(PREFIX + ':movie:'+escape(list[i].title)+':'+escape(list[i].url)+':'+escape(list[i].image), 'video', {
            title: new showtime.RichText(list[i].title),
            icon: BASE_URL+list[i].image
        });
	}
	page.entries = i;
     
    }
    
    function debug(message) {
        showtime.trace(message, plugin.getDescriptor().id);
        showtime.print(message);
    }

    function countDelay(delay,lastRequest) {
            //showtime.print('Getting difference between:' + lastRequest + " and " + showtime.time());
            var timeDiff = getTimeDifference(lastRequest, showtime.time()) * 1000;
            //showtime.print("time sinse last call:" + timeDiff);
            if (timeDiff < delay) {
                //wait for the delay time to end
                return delay - timeDiff;
            } else {
                return 0;
            }
        }
    
    function getTimeDifference(startUnix, endUnix) {
        return endUnix - startUnix; //in milliseconds
    }
    
    
    
    function getPlayerURL(code, replacing) {
  var video_url = false;
  
	if (code.search(/^oid=/) != -1) {
	debug("RP:"+replacing);	  
	  code = eval(replacing);
		video_url = 'http://www.vk.com/video_ext.php?' + code;
		
		//this CAN be empty (false returned if the video is not available)
		video_url = getVideoLink(video_url);
		 debug("LINK:"+video_url);
		
		return video_url;
		
	}
	
	
	else if(code.search(/moonwalk/) != -1) {
	  debug("MW");
	    video_url = getVideoLink(code);
	    return video_url; 
	}
	
	else if (code.search(/kset.kz/i) != -1) {
		code = code.replace(/([^a-z]{1})width=(['"\\]*)[0-9]+(['"\\]*)/gi, "$1width=$2" + viWidth + "$3").replace(/height=(['"\\]*)[0-9]+(['"\\]*)/gi, "height=$1" + viHeight + "$2");
		video_url = '<iframe src="http://www.autobonus.kz/kset.php?code=' + encodeURIComponent(code) + '" ' + ' frameborder="0"></iframe>';
	}
	else if (code.search(/<(object|embed) /i) == 0) {
		code = code.replace(/([^a-z]{1})width=(['"\\]*)[0-9]+(['"\\]*)/gi, "$1width=$2" + viWidth + "$3").replace(/height=(['"\\]*)[0-9]+(['"\\]*)/gi, "height=$1" + viHeight + "$2");
		video_url = code;
	}
	else if (code.search(/\.(3gp|aac|f4v|flv|m4a|mp3|mp4)/i) != -1) {
		if (!document.getElementById('uppod_player')) {
			
			video_url = code;
		}
		else {
			video_url = code;
		}
	}
	else if (code.search(/video\.rutube\.ru/i) != -1) {
		code = code.replace(/^.*?(http:[^"]+).*?$/, '$1');
		video_url = code;
	}
	else if(code.search('youtube') != -1){
	  //youtube video
	  code = code.match(/.*youtube.*\/embed\/([\S]*)\?autoplay/)[1];
	  debug('YOUTUBE!: '+code);
	  video_url = 'youtube:video:'+code;
	
	}
	
	return video_url;
}

    function getVideoLink(url) {
      debug("VL FOR:"+url);
        var result_url = url,
            fname, v;
        showtime.trace('php Link for page: ' + url);
        if ((url.indexOf("vk.com") > 0) || (url.indexOf("/vkontakte.php?video") > 0) || (url.indexOf("vkontakte.ru/video_ext.php") > 0) || (url.indexOf("/vkontakte/vk_kinohranilishe.php?id=") > 0)) {
            v = showtime.httpGet(url).toString();

            var video_host = v.match("var video_host = '(.+?)';");
	    
	    //video is not available for some reason
	    if(!video_host) { return false; }
	    else { video_host = video_host[1]; }
	    
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
                    fname = "360.mp4";
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
	    debug("Moonwalk video! "+url);
            var JSON = showtime.JSONDecode(showtime.httpReq('http://moonwalk.cc/sessions/create_session', {
                debug: true,
                postdata: {
                    video_token: v
                }
            }));
	    
	    debug(JSON.manifest_m3u8);
            result_url = 'hls:' + JSON.manifest_m3u8;
            //var m = /.*index.m3u8.*/g.exec(showtime.httpReq(JSON.manifest_m3u8));
            //result_url = 'hls:' + JSON.manifest_m3u8;

        }
        //showtime.print("Video Link: " + result_url);
        return result_url;
    }


    plugin.addURI(PREFIX + ":start", startPage);
    plugin.addURI(PREFIX + ":movies:(.*):(.*)", moviesListPage);
    plugin.addURI(PREFIX + ":movie:(.*):(.*):(.*)", moviePage);
        // Play links
    plugin.addURI(PREFIX + ":playvideo:(.*):(.*):(.*)", playVideo);
    plugin.addSearcher(PREFIX + " - Videos", plugin.path + "logo.png", searcher);
    
    
    
})(this);