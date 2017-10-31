// ==UserScript==
// @name         WME Me
// @version      2017.10.31.01
// @description  Adds a layer to WME that draws ME on the map!
// @author       JustinS83 (Original author: Joshua M. Kriegshauser)
// @include      https://www.waze.com/editor*
// @include      https://www.waze.com/*/editor*
// @include      https://beta.waze.com/*
// @exclude      https://www.waze.com/user/editor*
// @require      https://greasyfork.org/scripts/24851-wazewrap/code/WazeWrap.js
// @namespace    https://greasyfork.org/users/30701
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var WMEMe_Layer = null;
    var WMEMe_Marker = null;
    var WMEMe_TempMarker = null;
    var settings = {};

    var wazerMap = {};

    function WMEMe_ZoomEnd() {
        //console.log('WMEMe_ZoomEnd');
        WMEMe_Marker.moveTo(W.map.getLayerPxFromLonLat(W.map.center));
    }

    function WMEMe_Drag() {
        //console.log('WMEMe_Drag ' + W.map.getCenter());
        WMEMe_TempMarker.moveTo(W.map.getLayerPxFromLonLat(W.map.getCenter()));
    }

    function WMEMe_MoveEnd() {
        //console.log('WMEMe_MoveEnd');
        WMEMe_Layer.removeMarker(WMEMe_TempMarker);
        WMEMe_TempMarker = null;
        WMEMe_Marker.moveTo(W.map.getLayerPxFromLonLat(W.map.center));
    }

    function setIconImage(){
        var r = W.loginManager.user.rank;
        var canvas = document.createElement('canvas');
        $(canvas).attr('width', wazerMap[r].width);
        $(canvas).attr('height', wazerMap[r].height);
            ctx = canvas.getContext('2d');
        ctx.drawImage(image,
                          wazerMap[r].x, wazerMap[r].y,   // X & Y at which to start copying
                          wazerMap[r].width, wazerMap[r].height,   // Width and height to copy
                          0, 0,     // Place the result at 0, 0 in the canvas,
                          wazerMap[r].width, wazerMap[r].height); // Size to draw on the new canvas
        var croppedImage = canvas.toDataURL();

        icon = new OpenLayers.Icon(croppedImage, new OpenLayers.Size(wazerMap[r].width,wazerMap[r].height), new OpenLayers.Pixel(-(wazerMap[r].width/2),-wazerMap[r].height));

        // Me! Text
        if(settings.showName)
            $(icon.imageDiv).append($('<div id="WMEME_name">' + WazeWrap.User.Username() + '</div>').css('position','absolute').css('text-align','center').css('pointer-events','none').css('font-size','12px').css('top','2px').css('color','white'));
        else
            $(icon.imageDiv).append($('<div  id="WMEME_name">Me!</div>').css('position','absolute').css('left','16px').css('pointer-events','none').css('font-size','12px').css('top','2px').css('color','white'));

        if (!W.model.chat.attributes.visible)
            icon.setOpacity(0.5);

        W.model.chat._events["change:visible"].push({callback:function(e) {
            icon.setOpacity(W.model.chat.attributes.visible ? 1.0 : 0.5);
        }});

        $(icon.imageDiv).click(function(){settings.showName=!settings.showName; SetName(settings.showName); saveSettings();});

        W.map.events.register('movestart', null, function(e) {
            var iconClone = icon.clone();
            iconClone.setOpacity(0.2);
            WMEMe_TempMarker = new OpenLayers.Marker(W.map.center, iconClone);
            newLayer.addMarker(WMEMe_TempMarker);
        });

        WMEMe_Marker = new OpenLayers.Marker(W.map.center, icon);
        newLayer.addMarker(WMEMe_Marker);
    }

    function WMEMe_InstallIcon() {
        OpenLayers.Icon=OpenLayers.Class({url:null,size:null,offset:null,calculateOffset:null,imageDiv:null,px:null,initialize:function(a,b,c,d){this.url=a;this.size=b||{w:20,h:20};this.offset=c||{x:-(this.size.w/2),y:-(this.size.h/2)};this.calculateOffset=d;a=OpenLayers.Util.createUniqueID("OL_Icon_");this.imageDiv=OpenLayers.Util.createAlphaImageDiv(a)},destroy:function(){this.erase();OpenLayers.Event.stopObservingElement(this.imageDiv.firstChild);this.imageDiv.innerHTML="";this.imageDiv=null},clone:function(){return new OpenLayers.Icon(this.url,
	this.size,this.offset,this.calculateOffset)},setSize:function(a){null!=a&&(this.size=a);this.draw()},setUrl:function(a){null!=a&&(this.url=a);this.draw()},draw:function(a){OpenLayers.Util.modifyAlphaImageDiv(this.imageDiv,null,null,this.size,this.url,"absolute");this.moveTo(a);return this.imageDiv},erase:function(){null!=this.imageDiv&&null!=this.imageDiv.parentNode&&OpenLayers.Element.remove(this.imageDiv)},setOpacity:function(a){OpenLayers.Util.modifyAlphaImageDiv(this.imageDiv,null,null,null,null,
	null,null,null,a)},moveTo:function(a){null!=a&&(this.px=a);null!=this.imageDiv&&(null==this.px?this.display(!1):(this.calculateOffset&&(this.offset=this.calculateOffset(this.size)),OpenLayers.Util.modifyAlphaImageDiv(this.imageDiv,null,{x:this.px.x+this.offset.x,y:this.px.y+this.offset.y})))},display:function(a){this.imageDiv.style.display=a?"":"none"},isDrawn:function(){return this.imageDiv&&this.imageDiv.parentNode&&11!=this.imageDiv.parentNode.nodeType},CLASS_NAME:"OpenLayers.Icon"});
    }

    var ctx, icon, newLayer;
    var image = new Image();
    function WMEMe_Install() {
        loadSettings();
        var layer = W.map.getLayersBy('uniqueName', '__WMEMe');
        newLayer = new OpenLayers.Layer.Markers('Me!', {
            displayInLayerSwitcher: true,
            uniqueName: '__WMEMe'
        });

        // For some reason, OpenLayers.Icon is missing?!?
        if (!OpenLayers.Icon) {
            WMEMe_InstallIcon();
        }

        wazerMap["0"] = {x:67, y:62, width:67, height:47};
        wazerMap["1"] = {x:0, y:62, width:67, height:51};
        wazerMap["2"] = {x:151, y:0, width:52, height:48};
        wazerMap["3"] = {x:151, y:48, width: 51, height:47};
        wazerMap["4"] = {x:83, y:0, width:68, height:59};
        wazerMap["5"] = {x:0, y:0, width:83, height:62};
        wazerMap["6"] = {x:0, y:0, width:83, height:62};

        WMEMe_Layer = newLayer;
        var tween = new OpenLayers.Tween(OpenLayers.Easing.Linear.easeInOut);

        I18n.translations[I18n.currentLocale()].layers.name['__WMEMe'] = 'Me!';

        W.map.addLayer(newLayer);

        newLayer.setVisibility(settings.layerEnabled);

        WazeWrap.Interface.AddLayerCheckbox("display", "Me", settings.layerEnabled, function(enabled){newLayer.setVisibility(enabled); settings.layerEnabled = enabled; saveSettings();});

        //image.setAttribute('crossOrigin', 'anonymous');
        image.crossOrigin = "anonymous";
        image.onload = setIconImage;

        image.src = 'https://i.imgur.com/nFwdHlw.png';

        function tweenToPoint(e) {
            var newlonlat = W.map.center;
            var newpx = W.map.getLayerPxFromLonLat(newlonlat);
            var begin = {x: WMEMe_Marker.icon.px.x, y:WMEMe_Marker.icon.px.y};
            var end = {x: newpx.x, y:newpx.y};
            console.log('tweenToPoint: '+begin.x+','+begin.y+' '+end.x+','+end.y);
            tween.start(begin, end, 10, { callbacks:{
                eachStep: function(e) {
                    //console.log('eachStep: '+e.x+','+e.y);
                    WMEMe_Marker.icon.moveTo(e);
                },
                done: function(e) {
                    //console.log('done: '+e.x+','+e.y);
                    WMEMe_Marker.moveTo(newpx);
                }}
                                        });
            tween.play();
            if (WMEMe_TempMarker) {
                newLayer.removeMarker(WMEMe_TempMarker);
                WMEMe_TempMarker = null;
            }
        }

        W.map.events.register('zoomend', null, tweenToPoint);
        W.map.events.register('move', null, WMEMe_Drag);
        W.map.events.register('moveend', null, tweenToPoint);

    }

    function SetName(ShowUsername){
        if(ShowUsername){
            $('#WMEME_name')[0].innerHTML = WazeWrap.User.Username();
            $('#WMEME_name').css('position','absolute').css('left','16px').css('position','absolute').css('text-align','center').css('pointer-events','none').css('font-size','12px').css('top','2px').css('color','white').css('left','initial');
        }
        else{
            $('#WMEME_name')[0].innerHTML = "Me!";
            $('#WMEME_name').css('position','absolute').css('position','absolute').css('left','16px').css('pointer-events','none').css('font-size','12px').css('top','2px').css('color','white');
        }
    }

    function WMEMe_Bootstrap() {
        console.log('WMEMe_Bootstrap');
        if ($('#user-info') !== undefined && W && W.map && W.model && W.model.chat && W.model.chat.attributes && OpenLayers && OpenLayers.Layer && WazeWrap.User) {
            // Found the me panel
            WMEMe_Install();
        }
        else {
            // Try again in a second
            setTimeout(WMEMe_Bootstrap, 1000);
        }
    }

    WMEMe_Bootstrap();

    function loadSettings() {
        var loadedSettings = $.parseJSON(localStorage.getItem("WMEME_Settings"));
        var defaultSettings = {
            layerEnabled: false,
            showName: false
        };
        settings = loadedSettings ? loadedSettings : defaultSettings;
        for (var prop in defaultSettings) {
            if (!settings.hasOwnProperty(prop))
                settings[prop] = defaultSettings[prop];
        }

    }

     function saveSettings() {
        if (localStorage) {
            var localsettings = {
                layerEnabled: settings.layerEnabled,
                showName: settings.showName
            };

            localStorage.setItem("WMEME_Settings", JSON.stringify(localsettings));
        }
    }
})();
