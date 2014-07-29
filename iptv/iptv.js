/*
 *  Copyright (C) 2014 Wain
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
//ver 0.3
(function(plugin) {
  var plugin_info = plugin.getDescriptor();
  var PREFIX = plugin_info.id;
  var logo = plugin.path + 'logo.png';
  var timetableAhead = 3;
  
  var service = plugin.createService(plugin_info.title, PREFIX + ":start", "video", true, logo);
  var settings = plugin.createSettings(plugin_info.title, logo, plugin_info.synopsis);
  settings.createInfo("info", logo, "Plugin developed by " + plugin_info.author + ". \n");
  settings.createDivider('Settings:');
  
  var multiOptHours = [
    [1,'1 час'],
    [3,'3 часа'],
    [6,'6 часов'],
    [12,'12 часов',true]
  ]
  
  settings.createMultiOpt("ttAhead", "Показывать расписание на:", multiOptHours, function(v) {
    service.ttAhead = v;  
  });
  
  settings.createBool("advTitles", "Показывать текущую программу в списке каналов", 1, function(v) {
    service.advTitles = v;
  });
  
  settings.createBool("timeBefore", "Показывать время до программы", 1, function(v) {
    service.timeBefore = v;
  });
  
  settings.createString("M3u Playlist", "playlist Source", 'http://tv.degunino.net/m3u/utv.m3u', function(v) {
    service.pl = v;
  });
  
  settings.createString("Channels info", "info Source", 'http://tv.yandex.ru/ajax/i-tv-region/get?params={%22limit%22:1000,%22duration%22:'+(service.ttAhead*3600)+'}&resource=schedule&userRegion=213', function(v) {
    service.info = v;
  });
  
  //global object
  var channels,ttChannels;
  
  //First level start page
  plugin.addURI(PREFIX + ":start", function(page) {
    page.metadata.logo = plugin.path + "logo.png";
    page.metadata.title = "IPTV";
    var v = showtime.httpReq(service.pl).toString();
	v = v.replace(/tv\.local/g,'192.168.1.1:1212');
    
    var re = /#EXTINF:.*,\s*(.*)\s*(http:\/\/.+\s*)/g;
    
    service.info = 'http://tv.yandex.ru/ajax/i-tv-region/get?params={%22limit%22:1000,%22duration%22:'+service.ttAhead*3600+'}&resource=schedule&userRegion=213';
    
    //my code here ------------------------
    
    showtime.print("Loading timetable: "+service.info);
var yandexPage = showtime.httpReq(service.info).toString();
yandexPage = yandexPage.replace(/"160"/g,'"big"');
yandexPage = yandexPage.replace(/"400"/g,'"huge"');

var ttJson = showtime.JSONDecode(yandexPage);
ttChannels = ttJson.schedules;
var j = 0,chLogo,chDescription,chTitle,channelFound;



channels = re.execAll(v.toString());

for (var i = 0; i < channels.length; i++) {
  chLogo = '';
  chDescription = '';
  chTitle = channels[i].title;
  channelFound = false;
  //m[i][2] is a link, m[i][1] is channel NAME
  for(j=0;j<ttChannels.length;j++) {
    if ( channels[i].title == ttChannels[j].channel.title ) {
      //we have timetable for this channel
      if(ttChannels[j].channel.logo.sizes.big) {
	chLogo = ttChannels[j].channel.logo.sizes.big.src;
      }
      if(ttChannels[j].channel.description) {
	chDescription = ttChannels[j].channel.description;
      }
      channelFound = true;
      channels[i].tt = ttChannels[j];
      
      if(service.advTitles) {
	chTitle+=" - "+channels[i].tt.events[0].episode.title;
	
	if(channels[i].tt.events[0].program.images) {
	  chLogo = channels[i].tt.events[0].program.images[0].sizes.big.src;
	} 
	chDescription = channels[i].tt.events[0].episode.description;
      }
      page.appendItem(PREFIX+':channel'+i, "video", {
	title: chTitle,
	icon: chLogo,
	description: chDescription
      })
      break;
    }
    
  }
  if(!channelFound) {
    page.appendItem(channels[i].url, "video", {
      title: chTitle,
      icon: chLogo,
      description: chDescription
    });
  }
}
page.type = "directory";
page.contents = "items";
page.loading = false;
  });

plugin.addURI(PREFIX + ":channel(.*)", function(page,channelId) {
  
  var channel = channels[channelId].tt.channel
  var events = channels[channelId].tt.events,event;
  var numEvents = events.length;
  var chLogo = '', chDescription = '',eventImage,eventDuration = 0;
  
  if(channel.logo.sizes.big) {
    chLogo = channel.logo.sizes.big.src;
  }
  if(channel.description) {
    chDescription = channel.description;
  }
  
  event = events[0];
  var time = makeTime(event.start,event.finish,true);
  if(event.program.images) {
    eventImage = event.program.images[0].sizes.big.src;
  }
  else {
    eventImage = chLogo;			
  }
  
  //event duration
  eventDuration = makeTime(event.start,event.finish,false);
  var date1 = new Date(eventDuration.start.year, eventDuration.start.month-1, eventDuration.start.day,eventDuration.start.hour,eventDuration.start.min,eventDuration.start.sec,0),
      date2 = new Date(eventDuration.finish.year, eventDuration.finish.month-1, eventDuration.finish.day,eventDuration.finish.hour,eventDuration.finish.min,eventDuration.finish.sec,0);
  eventDuration = getTimeDifference(date1,date2,false);
  eventDuration = eventDuration.hour*60+eventDuration.min;
  
  //show the time before the program END
  if(service.timeBefore) {
    //get current time
    //this will probably help to workaround a bug with the wrong current time on PS3
      var currTime = new Date((showtime.time()+4*3600)*1000);
      //get program end
      var endTime = makeTime(event.start,event.finish,false);
      endTime = new Date(endTime.finish.year, endTime.finish.month-1, endTime.finish.day,endTime.finish.hour,endTime.finish.min,endTime.finish.sec,0);
      var diffTime = getTimeDifference(currTime,endTime,true);
    time+= " - Еще "+diffTime;
  }
  
  page.appendItem(channels[channelId].url, "video", {
    title: time+" - "+event.episode.title,
    genre: event.program.type.name,
    description: event.episode.description,
    duration: showtime.durationToString(eventDuration),
    icon: eventImage
  });
  
  
  
  for(var i=1;i<numEvents;i++) {
    event = events[i];
    time = makeTime(event.start,event.finish,true);
    if(event.program.images) {
      eventImage = event.program.images[0].sizes.big.src;
    }
    else {
      eventImage = chLogo;			
    }
    
    
      //event duration
  eventDuration = makeTime(event.start,event.finish,false);
  var date1 = new Date(eventDuration.start.year, eventDuration.start.month-1, eventDuration.start.day,eventDuration.start.hour,eventDuration.start.min,eventDuration.start.sec,0),
      date2 = new Date(eventDuration.finish.year, eventDuration.finish.month-1, eventDuration.finish.day,eventDuration.finish.hour,eventDuration.finish.min,eventDuration.finish.sec,0);
  eventDuration = getTimeDifference(date1,date2,false);
  eventDuration = eventDuration.hour*60+eventDuration.min;
    
    //show the time before the program BEGIN
  if(service.timeBefore) {
    //get current time
      var currTime = new Date((showtime.time()+4*3600)*1000);
      //get program end
      var startTime = makeTime(event.start,event.finish,false);
      startTime = new Date(startTime.start.year, startTime.start.month-1, startTime.start.day,startTime.start.hour,startTime.start.min,startTime.start.sec,0);
      var diffTime = getTimeDifference(currTime,startTime,true);
    time+= " - Через "+diffTime;
  }
    
    
    page.appendPassiveItem('video',0, {
      title: time+" - "+event.episode.title,
      genre: event.program.type.name,
      description: event.episode.description,
      duration: eventDuration,
      icon: eventImage
    });
  }
  
  page.metadata.logo = channel.logo.sizes.big.src;
  page.metadata.title = channel.title+" - "+events[0].episode.title;
  page.type = "directory";
  page.contents = "items";
  page.loading = false;
});

//
//extra functions

function makeTime(start,end, asString) {
  var regExp = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\+(\d{2}):(\d{2})/;
  start = regExp.exec(start);
  end = regExp.exec(end);
  
  var startHour =start[4];
  startHour = startHour<=24?startHour:startHour-24;
  var endHour = end[4];
  endHour = endHour<=24?endHour:endHour-24;
  
  var retObject = '';
  
  if(asString) retObject = startHour+":"+start[5]+"-"+endHour+":"+end[5];
  else { 
    retObject =  {
      start:{
	year:start[1],
	month:start[2],
	day:start[3],
	hour:startHour,
	min:start[5],
	sec:start[6]
      },
      finish:{
	year:end[1],
	month:end[2],
	day:end[3],
	hour:endHour,
	min:end[5],
	sec:end[6]
      }  
    }}
    
    return retObject;
}


function getTimeDifference(start,end,asString) {
  var startUnix = start.getTime();
  var endUnix = end.getTime();
  var resDiff = (endUnix-startUnix)/1000; //in seconds now
  var res = {hour:0,min:0,sec:0};
  var lastChar,unitText;
  
  res.min = parseInt(resDiff/60);
  res.hour = parseInt(res.min/60);
  res.min-=res.hour*60;
  
  if(!asString) {return res;}
  else {
    var strRes = '';
    if(res.hour) {
	strRes+=res.hour;
	lastChar = strRes+'';
	lastChar = lastChar.charAt(lastChar.length-1);
	switch(lastChar) {
	  case '1': {unitText = ' час '; break;}
	  case '2':
	  case '3':
	  case '4': {unitText = ' часа '; break;}
	  case '5':
	  case '6':
	  case '7':
	  case '8':
	  case '9':
	  case '0': {unitText = ' часов '; break;}
	}
	strRes+=unitText;
    }
    
    if(res.min>0) {
	strRes+=res.min;
	lastChar = strRes+'';
	lastChar = lastChar.charAt(lastChar.length-1);
	switch(lastChar) {
	  case '1': {unitText = ' минуту'; break;}
	  case '2':
	  case '3':
	  case '4': {unitText = ' минуты'; break;}
	  case '5':
	  case '6':
	  case '7':
	  case '8':
	  case '9':
	  case '0': {unitText = ' минут'; break;}
	}
	strRes+=unitText;
    }
      return strRes;

  }
}


// Add to RegExp prototype
RegExp.prototype.execAll = function(string) {
  var matches = [];
  var match = null;
  while ((match = this.exec(string)) !== null) {
    var matchArray = {title:'',url:''};
    matchArray.title = match[1];
    matchArray.url = match[2];
    matches.push(matchArray);
  }
  return matches;
};
})(this);
