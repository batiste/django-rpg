
// evil
Array.prototype.remove = function(from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};

if (!window.console) window.console = {};
if (!window.console.log) window.console.log = function() {};

window.rpg = new Function();

rpg.other_players = [];

rpg.norm_vector = function norm_vector(vect) {
    return Math.sqrt(vect[0]*vect[0]+vect[1]*vect[1]);
};

rpg.normalize_vector = function normalize_vector(vect) {
    var norm = Math.sqrt(vect[0]*vect[0]+vect[1]*vect[1]);
    if(norm==0)
        return false
    vect[0] = vect[0] / norm;
    vect[1] = vect[1] / norm;
    return vect;
};

rpg.get_player = function get_player(key) {
    for(var i=0; i < rpg.other_players.length; i++) {
        if(rpg.other_players[i] && rpg.other_players[i].public_key == key)
            return rpg.other_players[i]
    }
    return false;
}

rpg.postJSON = function(url, args, callback) {
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


rpg.event_cursor = false;
// polling update
rpg.updater = {
    errorSleepTime: 500,
    cursor: null,

    poll: function() {
        var args = {};
        if(rpg.event_cursor)
            args["cursor"] = rpg.event_cursor
        $.ajax({
            url: "/a/room/updates",
            type: "POST",
            dataType: "text",
            data: $.param(args),
            success: rpg.updater.onSuccess,
            error: rpg.updater.onError
        });
    },

    onSuccess: function(response) {
        var json = $.evalJSON(response);
        for(var i=0; i <json.length; i++) {
            rpg.handle_event(json[i]);
        };

        rpg.updater.errorSleepTime = 500;
        window.setTimeout(rpg.updater.poll, 0);
    },

    onError: function(response) {
        rpg.updater.errorSleepTime *= 2;
        console.log("Poll error; sleeping for", rpg.updater.errorSleepTime, "ms");
        window.setTimeout(rpg.updater.poll, rpg.updater.errorSleepTime);
    }
};



// handle event from the server
rpg.handle_event = function handle_event(event) {
    if(event[0] == 'update_player_position') {
        var p = rpg.get_player(event[1][0]);
        if(event[1][0] == window.public_key)
            return;
        p.target_position = event[1][1];
    }
    if(event[0] == 'new_player') {
        var item = event[1];
        if(item['key'] == window.public_key)
            return;
        if(item['position']) {
            var pos = item['position'];
        } else {
            var pos = [50, 60];
        }
        var p = rpg.get_player(item['key']);
        if(p === false) {
            p = new rpg.Player([pos[0], pos[1]], item['key'], item['name']);
            rpg.other_players.push(p);
        }
        p.target_position = [pos[0], pos[1]];
        if(item['new_message']) {
            p.say(item['new_message'])
        }
    };
    if(event[0] == 'player_leave_room') {
        var item = event[1];
        if(item['key'] == window.public_key)
            return;
        for(var i=0; i < rpg.other_players.length; i++) {
            if(rpg.other_players[i] && rpg.other_players[i].public_key == item['key']) {
                rpg.other_players[i].remove();
                rpg.other_players.remove(i);
            };
        };
        var p = rpg.get_player(item['key']);
    };
    if(event[0] == 'last_message') {
        if(event[1][0] == window.public_key)
            return;
        var p = rpg.get_player(event[1][0]);
        p.say(event[1][1]);
    };
    if(event[0] == 'update_cursor') {
        rpg.event_cursor = event[1];
    };
    if(event[0] == 'effect') {
        var item = event[1];
        if(item[0] == window.public_key)
            return;
        var p = rpg.get_player(item[0]);
        if(p) {
            animation = new Animation(item[0], p.position[0], p.position[1]);
            animation.anim();
        };
    };
};

// GRID

function Grid(map, w, h, blocs_init) {
    this.width = w;
    this.height = h;
    this.blocs = [];
    this.dom_blocs = [];
    this.choosen_bloc = [0, 0];
    this.is_loading_room = false;
    this.forbidden = [
        [9, 1],[10, 2],[0, 9],[1, 9],[2, 9],[0, 10],[1, 10],
        [2, 10],[3, 10],[4, 10],[5, 10],[8, 9], [6, 8], [6, 10],
        [7, 9],[7, 8],[7, 10],[6, 7], [6, 9],[9, 7],[10, 7],
        [8, 8], [8 ,10], [9, 8],
        [10, 8],[9, 9],[9, 10],[10, 10]
    ];
    // create the grid
    var top_offest = 0;
    var left_offset = 0;
    for(var i=0; i<this.height; i++) {
        var dom_line = [];
        var line = [];
        var top_offest = i * 16;
        for(var j=0; j<this.width; j++) {
            left_offset = j * 16;
            var dom_bloc = $('<div class="bloc" id="bloc-'+ i
                +'-'+ j +'" style="top:' + top_offest
                + 'px;left:'+ left_offset + 'px;"></div>');
            map.append(dom_bloc);
            dom_line.push(dom_bloc);
            line.push(false);
        };
        this.dom_blocs.push(dom_line);
        this.blocs.push(line);
    };
    //map.append($('<div id="indic"></div>'));
    this.load_new_map(blocs_init);
};

Grid.prototype.get_bloc = function(indexes) {
    return this.blocs[indexes[1]][indexes[0]];
};

Grid.prototype.paint_bloc = function(dom_bloc) {
    //var bloc = $(e.target);
    if(dom_bloc.hasClass('bloc')) {
        var b_string = dom_bloc.attr('id').split('-');
        var tile_pos_css = (-this.choosen_bloc[0]*17-1)+'px ' + (-this.choosen_bloc[1]*17-1)+'px';
        this.blocs[parseInt(b_string[1])][parseInt(b_string[2])] = this.choosen_bloc;
        dom_bloc.css('background-position', tile_pos_css);
    };
};

Grid.prototype.is_bloc_walkable = function(bloc) {
    for(var i=0; i < this.forbidden.length; i++) {
        if(this.forbidden[i][0] == bloc[0]
            && this.forbidden[i][1] == bloc[1])
                return false;
    };
    return true;
};

Grid.prototype.bloc_from_player_pos = function(pos) {
    if(this.is_loading_room)
        return;
    var bloc_indexes = [
        Math.floor((pos[0]) / 16),
        Math.floor((pos[1]) / 16)
    ];
    // check if the player is leaving the map
    var direction = false;
    if(bloc_indexes[0] < 0) {
        direction = "left";
    }
    if(bloc_indexes[0] > (rpg.grid.width-1)) {
        direction = "right";
    };
    if(bloc_indexes[1] < 0) {
        direction = "top";
    }
    if(bloc_indexes[1] > (rpg.grid.height-1)) {
        direction = "bottom";
    }
    // load another map
    if(direction) {
        this.is_loading_room = true;
        rpg.postJSON("/a/change_room", {'direction':direction}, function change_room(response) {
            var others_player_index = rpg.other_players.length - 1;
            while(others_player_index >= 0) {
                if(rpg.other_players[0]) {
                    rpg.other_players[0].remove();
                };
                rpg.other_players.remove(0);
                others_player_index = others_player_index - 1;
            };
            rpg.other_players = [];
            json = $.evalJSON(response);
            var new_room = json["change_room"];
            var map_content = new_room["content"];
            if(map_content)
                map_content = $.evalJSON(map_content);
            rpg.grid.load_new_map(map_content);
            if(direction == "left")
                rpg.me.position[0] = (rpg.grid.width-1) * 16;
            if(direction == "right")
                rpg.me.position[0] = 0;
            if(direction == "top")
                rpg.me.position[1] = (rpg.grid.height-2) * 16;
            if(direction == "bottom")
                rpg.me.position[1] = 0;
            rpg.me.target_position = rpg.me.position;
            rpg.me.move();
            for(var i=0; i <json["events"].length; i++) {
                rpg.handle_event(json["events"][i]);
            };
            $('#room_x').text(new_room['x']);
            $('#room_y').text(new_room['y']);
            $('#room_name').text(new_room['name']);
            rpg.grid.is_loading_room = false;
        });
        return;
    };
    return this.get_bloc(bloc_indexes);
};

Grid.prototype.load_new_map = function(blocs_init) {
    for(var i=0; i < this.height; i++) {
        for(var j=0; j < this.width; j++) {
            var dom_bloc = this.dom_blocs[i][j];
            if(blocs_init)
                var bloc = blocs_init[i][j];
            else
                var bloc = [1, 1];
            this.blocs[i][j] = bloc;
            var tile_pos_css = (-bloc[0]*17-1)+'px ' + (-bloc[1]*17-1)+'px';
            dom_bloc.css('background-position', tile_pos_css);
        };
    };
};

rpg.Grid = Grid;


// PLAYER

function Player(init_position, public_key, pname, private_key) {
    this.position = [init_position[0], init_position[1]];
    this.last_sent_position = [init_position[0], init_position[1]];
    this.target_position = [init_position[0], init_position[1]];
    this.pname = pname;
    this.public_key = public_key;
    this.private_key = private_key;
    this.walking = false;
    // pixels by seconds
    this.speed = 100.0;
    this.element = $('<div class="player">\
        <span class="text"><span class="name">'+this.pname+'</span>\
        <span class="message"></span></span>\
    </div>');
    this.cycle = 0;
    this.start_cycle = 0;
    rpg.map.append(this.element);
    this.message_element = this.element.find('.message')
    this.message_timeout = false;
    this.move(this.position);
};

Player.prototype.say = function(message) {
    clearTimeout(this.message_timeout);
    var el = this.message_element;
    var chat_log_item = $('<li></li>');
    chat_log_item.html('<span>' + this.pname + ':</span> ' + message);
    $('#chat-log').append(chat_log_item)
    $('#chat-log').scrollTop(1000)
    this.message_element.html(message);
    this.message_element.slideDown("slow");
    var _hide_message = function(){el.slideUp("slow");}
    this.message_timeout = setTimeout(_hide_message, 12000);
};

// make the walking animation works
Player.prototype.anim = function() {
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

Player.prototype.move = function(pos) {
    if(!pos)
        pos = this.position;
    /*$('#indic')[0].style.left = (pos[0])+'px';
    $('#indic')[0].style.top = (pos[1])+'px';*/
    this.element[0].style.left = (pos[0] - 12)+'px';
    this.element[0].style.top = (pos[1] - 32)+'px';
};

Player.prototype.init_position = function() {
    this.move();
};

Player.prototype.remove = function() {
    this.element.remove();
};

Player.prototype.update_target_position = function() {
    var vect = rpg.keyboard_vector();
    if(vect) {
        var now = new Date().getTime();
        if(this.last_time) {
            var time_elapsed = now - this.last_time;
        } else {
            var time_elapsed = 20.0;
        }
        this.last_time = now;
        var factor = (time_elapsed / 1000.0) * this.speed;
        
        var next_pos = [
            this.target_position[0] + parseInt(vect[0]*factor),
            this.target_position[1] + parseInt(vect[1]*factor)
        ];

        var bloc = rpg.grid.bloc_from_player_pos(next_pos);
        if(bloc && rpg.grid.is_bloc_walkable(bloc)) {
            this.target_position = next_pos;
        };
    };
};

Player.prototype.set_start_cycle = function(vect) {
    // set the cycle animation according to the direction
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

Player.prototype.move_to_target = function() {
    var vect = [
        this.target_position[0] - this.position[0],
        this.target_position[1] - this.position[1]
    ];
    var norm = rpg.norm_vector(vect);
    if (norm > 0) {
        this.position[0] = this.target_position[0];
        this.position[1] = this.target_position[1];
        this.move();
        this.walking = true;
        this.set_start_cycle(vect);
    } else {
        this.walking = false;
        this.last_time = false;
    };
    /*} else {
        this.walking = true;
        var d = new Date().getTime();
        if(this.last_time) {
            var time_elapsed = Math.min(60.0, Math.max(20.0, d - this.last_time));
        } else {
            var time_elapsed = 20.0;
        }
        var factor = (time_elapsed / 1000.0) * this.speed;
        this.last_time = d;
        this.set_start_cycle(vect);
        vect[0] = vect[0] * factor;
        vect[1] = vect[1] * factor;
        console.log(factor)
        if(factor > 0) {
            this.position[0] += parseInt(vect[0]);
            this.position[1] += parseInt(vect[1]);
            this.move();
        }
        return;*/
};

Player.prototype.send_position = function () {
    if(this.last_sent_position[0] != this.target_position[0]
        || this.last_sent_position[1] != this.target_position[1])
    {
        var pos = $.toJSON(this.target_position)
        this.last_sent_position[0] = this.target_position[0];
        this.last_sent_position[1] = this.target_position[1];
        rpg.postJSON("/a/player/update_position", {
                'body':pos
            },
            function(response) {}
        );
    };
};

rpg.Player = Player

