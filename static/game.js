$(function() {

    function getCookie(name) {
        var r = document.cookie.match("\\b" + name + "=([^;]*)\\b");
        return r ? r[1] : undefined;
    }

    if (!window.console) window.console = {};
    if (!window.console.log) window.console.log = function() {};


    var event_cursor = false;
    // polling update
    var updater = {
        errorSleepTime: 500,
        cursor: null,

        poll: function() {
            var args = {"_xsrf": getCookie("_xsrf")};
            if(event_cursor)
                args["cursor"] = event_cursor
            if (updater.cursor) args.cursor = updater.cursor;
            $.ajax({
                url: "/a/room/updates",
                type: "POST",
                dataType: "text",
                data: $.param(args),
                success: updater.onSuccess,
                error: updater.onError
            });
        },

        onSuccess: function(response) {
            //try {
                var mapdata = $.evalJSON(response);
                $.receive_data(mapdata)
                //var pos = mapdata['players'][0]['position'].split(',');
                //$.player_target_position[0] = parseInt(pos[0])
                //$.player_target_position[1] = parseInt(pos[1])

            //} catch (e) {
            //    updater.onError();
            //    return;
            //}
            updater.errorSleepTime = 500;
            window.setTimeout(updater.poll, 0);
        },

        onError: function(response) {
            updater.errorSleepTime *= 2;
            console.log("Poll error; sleeping for", updater.errorSleepTime, "ms");
            window.setTimeout(updater.poll, updater.errorSleepTime);
        }
    };

    jQuery.postJSON = function(url, args, callback) {
        args._xsrf = getCookie("_xsrf");
        $.ajax({
            url: url,
            data: $.param(args),
            dataType: "text",
            type: "POST",
            success: function(response) {
                callback(response);
                //console.log("SUCCESS:", response)
            },
            error: function(response) {
                //console.log("ERROR:", response)
            }
        });
    };

    var map = $('#map');
    var tileset = $('#tileset');
    var choosen_tile = [0, 0];
    var mouseDown = false;

    var grid_width = 35;
    var grid_height = 30;
    var map_content = "";
    var top_offest = 0;
    var left_offset = 0;
    var grid = [];

    function get_map(name) {
        var results = window.location.href.split('map=');
        return results[1];
    }

    if($('#grid-serialized').val())
        grid = $.evalJSON($('#grid-serialized').val());
    else if(get_map())
        grid = $.evalJSON(get_map());

    tileset.click(function(e) {
        var tile_pos = tileset.position();
        choosen_tile = [
                Math.floor((e.clientX-tile_pos.left) / 17),
                Math.floor((e.clientY-tile_pos.top) / 17)
            ];
        tile_pos_css = (-choosen_tile[0]*17-1)+'px ' + (-choosen_tile[1]*17-1)+'px';
        $('#select').css('left', choosen_tile[0]*17 + tile_pos.left+'px');
        $('#select').css('top', choosen_tile[1]*17 + tile_pos.top+'px');
    });

    function paint_bloc(e) {
        var bloc = $(e.target);
        if(bloc.hasClass('bloc')) {
            var b_string = bloc.attr('id').split('-');
            grid[parseInt(b_string[1])][parseInt(b_string[2])] = choosen_tile;
            bloc.css('background-position', tile_pos_css);
        }
    };

    map.click(function(e) {
        paint_bloc(e);
        $('#grid-serialized').val($.toJSON(grid));
    });

    map.mousedown(function(e) {
        mouseDown = true;
    });
    map.mouseup(function(e) {
        mouseDown = false;
        $('#grid-serialized').val($.toJSON(grid));
    });

    map.mousemove(function(e){
        if(mouseDown) {
            paint_bloc(e);
            return false;
        }
    });

    // create the grid
    var grid_exist = grid.length > 0;
    if(!grid_exist)
        tile_pos_css = '-18px -18px';

    for(var i=0; i<grid_height; i++) {
        var line = [];
        top_offest = i*16;
        for(var j=0; j<grid_width; j++) {
            left_offset = j*16;
            if(grid_exist) {
                tile_pos_css = (-grid[i][j][0]*17-1)+'px '+(-grid[i][j][1]*17-1)+'px';
            } else {
                line.push([1,1]);
            }

            map_content += ('<div class="bloc" id="bloc-'+ i
                +'-'+ j +'" style="top:' + top_offest
                + 'px;left:'+ left_offset
                + 'px;background-position:'+tile_pos_css+'"></div>');

        };
        if(!grid_exist)
            grid.push(line);
    };
    map.html(map_content);


    function player(init_position, key, pname) {
        this.position = [init_position[0], init_position[1]];
        this.last_sent_position = [init_position[0], init_position[1]];
        this.target_position = [init_position[0], init_position[1]];
        this.pname = pname;
        this.key = key;
        this.walking = false;
        this.speed = 3;
        this.element = $('<div class="player">\
            <span class="text"><span class="name">'+this.pname+'</span>\
            <span class="message"></span></span>\
        </div>');
        this.cycle = 0;
        this.start_cycle = 0;
        map.append(this.element);
        this.message_element = this.element.find('.message')
        this.message_timeout = false;
        this.move(this.position);
    };

    player.prototype.say = function(message) {
        clearTimeout(this.message_timeout);
        var el = this.message_element;
        this.message_element.text(message);
        this.message_element.slideDown("slow");
        var _hide_message = function(){el.slideUp("slow");}
        this.message_timeout = setTimeout(_hide_message, 10000);
    }

    player.prototype.anim = function() {
        if(!this.walking) {
            this.cycle = 1;
        };
        var pos = this.start_cycle + 24 * this.cycle;
        this.element.css('background-position', -pos+'px');
        if(!this.walking) {
            return;
        }
        this.cycle += 1;
        if(this.cycle > 2)
            this.cycle = 0;
    };

    player.prototype.move = function(pos) {
        this.element.css('left', pos[0]+'px');
        this.element.css('top', pos[1]+'px');
    };

    player.prototype.init_position = function() {
        this.move(this.position);
    };

    player.prototype.update_target_position = function() {
        var vect = keyboard_vector();
        if(vect) {
            this.target_position[0] += parseInt(this.speed * vect[0]);
            this.target_position[1] += parseInt(this.speed * vect[1]);
        };
    };

    player.prototype.set_start_cycle = function(vect) {
        //var angle = Math.atan(vect[0]/vect[1]);
        if(vect[1] > 0) {
            this.start_cycle = 24 * 9;
        }
        if(vect[1] < 0) {
            this.start_cycle = 24 * 3;
        }
        if(vect[0] > 0) {
            this.start_cycle = 24 * 6;
        };
        if(vect[0] < 0) {
            this.start_cycle = 0;
        };
    }

    player.prototype.move_to_target = function() {
        var vect = [
            this.target_position[0] - this.position[0],
            this.target_position[1] - this.position[1]
        ];
        var norm = norm_vector(vect);
        if(norm <= 2) {
            this.position[0] = this.target_position[0];
            this.position[1] = this.target_position[1];
            this.move(this.position);
            this.walking = false;
            return;
        };
        if(norm > 2) {
            this.walking = true
            vect[0] = vect[0] / norm;
            vect[1] = vect[1] / norm;
            this.set_start_cycle(vect);
            this.position[0] += parseInt(this.speed * vect[0]);
            this.position[1] += parseInt(this.speed * vect[1]);
            this.move(this.position);
            return;
        }
    };

    player.prototype.send_position = function () {
        if(this.last_sent_position[0] != this.target_position[0]
            || this.last_sent_position[1] != this.target_position[1]) {
                this.last_sent_position[0] = this.target_position[0];
                this.last_sent_position[1] = this.target_position[1];
                $.postJSON("/a/player/update_position", {
                    'body':this.target_position[0]+','+this.target_position[1]
                },
                function(response) {}
            );
        };
    };

    var personnal_key = false;
    var player_name = prompt("Choose your hero name");
    $.postJSON("/a/player/new", {'body':player_name}, function(response) {
        response = $.evalJSON(response);
        personnal_key = response["you"]["key"];
        for(var i=0; i < response["events"].length; i++) {
            handle_event(response["events"][i]);
        };
    });

    var me = new player([30, 100], personnal_key, player_name);
    me.init_position();
    // start polling events
    updater.poll();

    $("#messageform").submit(function(e) {
        e.preventDefault();
        var message = $('#message');
        message.focus();
        $.postJSON("/a/message/new", {'body':message.val()}, function(response) {
            me.say(message.val());
            $('#message').val('');
        });
        return false;
    });

    // animation
    var other_players = [];
    function get_player(key) {
        for(var i=0; i < other_players.length; i++) {
            if(other_players[i].key == key)
                return other_players[i]
        }
        return false;
    }
    
    var _players_move = function() {
        me.update_target_position();
        me.move_to_target();
        for(var i=0; i <other_players.length; i++) {
            other_players[i].move_to_target();
        };
    };
    setInterval(_players_move, 25);

    var _anim = function(){
        me.anim();
        for(var i=0; i <other_players.length; i++) {
            other_players[i].anim();
        };
    };
    me.anim_interval = setInterval(_anim, 120);
    
    // send the new position to the server
    var _player_send = function(){ me.send_position(); }
    setInterval(_player_send, 1000);

    $.receive_data = function(json) {
        for(var i=0; i <json.length; i++) {
            handle_event(json[i]);
        };
    };

    function handle_event(event) {
        if(event[0] == 'update_player_position') {
            var p = get_player(event[1][0]);
            if(event[1][0] == personnal_key)
                return;
            var _pos = event[1][1].split(',');
            var pos = [parseInt(_pos[0]), parseInt(_pos[1])];
            p.target_position = pos;
        }
        if(event[0] == 'new_player') {
            var item = event[1];
            if(item['key'] == personnal_key)
                return;
            if(item['position']){
                var _pos = item['position'].split(',');
                var pos = [parseInt(_pos[0]), parseInt(_pos[1])];
            } else {
                var pos = [50, 60];
            }
            var p = get_player(item['key']);
            if(p === false) {
                p = new player([pos[0], pos[1]], item['key'], item['name']);
                other_players.push(p);
            }
            p.target_position = [pos[0], pos[1]];
            if(item['new_message']) {
                p.say(item['new_message'])
            }
        };
        if(event[0] == 'last_message') {
            if(event[1][0] == personnal_key)
                return;
            var p = get_player(event[1][0]);
            p.say(event[1][1]);
        }
        if(event[0] == 'update_cursor') {
            event_cursor = event[1];
        };
    }

    // keyboard stuff
    var keyboard = {'up':0, 'left':0, 'right':0, 'down':0};

    function norm_vector(vect) {
        return Math.sqrt(vect[0]*vect[0]+vect[1]*vect[1]);
    };

    function normalize_vector(vect) {
        var norm = Math.sqrt(vect[0]*vect[0]+vect[1]*vect[1]);
        if(norm==0)
            return false
        vect[0] = vect[0] / norm;
        vect[1] = vect[1] / norm;
        return vect;
    };

    function keyboard_vector() {
        var vect = [0, 0];
        if(keyboard['up'])
            vect[1] -= 1;
        if(keyboard['left'])
            vect[0] -= 1;
        if(keyboard['down'])
            vect[1] += 1;
        if(keyboard['right'])
            vect[0] += 1;
        return normalize_vector(vect);
    };

    function reset_cycle() {
        if(keyboard['down']) {
            start_cycle = 24 * 9;
        }
        if(keyboard['up']) {
            start_cycle = 24 * 3;
        }
        if(keyboard['right']) {
            start_cycle = 24 * 6;
        }
        if(keyboard['left']) {
            start_cycle = 0;
        };
    };

    function update_keyboard(e, val) {
        if(e.keyCode==40) {
            keyboard['down'] = val;
        }
        if(e.keyCode==38) {
            keyboard['up'] = val;
        }
        if(e.keyCode==39) {
            keyboard['right'] = val;
        }
        if(e.keyCode==37) {
            keyboard['left'] = val;
        };
    };

    var keyboard_events = $('#message')
    /*$('body').click(function(){
        keyboard_events.focus();
    });*/
    keyboard_events.focus();

    keyboard_events.keydown(function(e) {
        update_keyboard(e, 1);
        //reset_cycle();
        player.walking = true;
    });
    keyboard_events.keyup(function(e){
        update_keyboard(e, 0);
        //reset_cycle();
        if( !keyboard["up"] && !keyboard["left"] && !keyboard["right"] && !keyboard["down"] )
            player.walking=false;
    });
    /*keyboard_events.blur(function(e) {
        keyboard = {'up':0, 'left':0, 'right':0, 'down':0};
        keyboard_events.focus();
    });*/
});