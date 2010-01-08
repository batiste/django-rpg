$(function() {
    
var map = $('#map');
rpg.map = map;
var tileset = $('#tileset');
var mouseDown = false;

if(map_content)
    map_content = $.evalJSON(map_content);

rpg.grid = new rpg.Grid(
    map, 35, 30, map_content
);

tileset.click(function(e) {
    var tile_pos = tileset.position();
    rpg.grid.choosen_bloc = [
            Math.floor((e.clientX-tile_pos.left) / 17),
            Math.floor((e.clientY-tile_pos.top) / 17)
        ];
    var tile_pos_css = (-rpg.grid.choosen_bloc[0]*17-1)+'px ' + (-rpg.grid.choosen_bloc[1]*17-1)+'px';
    $('#select').css('left', rpg.grid.choosen_bloc[0]*17 + tile_pos.left+'px');
    $('#select').css('top', rpg.grid.choosen_bloc[1]*17 + tile_pos.top+'px');
});

map.click(function(e) {
    rpg.grid.paint_bloc($(e.target));
});

map.mousedown(function(e) {
    mouseDown = true;
});

map.mouseup(function(e) {
    mouseDown = false;
    //$('#grid-serialized').val($.toJSON(grid));
});

map.mousemove(function(e) {
    if(mouseDown) {
        rpg.grid.paint_bloc($(e.target));
        return false;
    };
});


// Start of the mundane things

$("#messageform").submit(function(e) {
    e.preventDefault();
    var message = $('#message');
    message.focus();
    rpg.postJSON("/a/message/new", {'body':message.val()}, function(response) {
        me.say(message.val());
        $('#message').val('');
    });
    return false;
});

var me = false;
rpg.other_players = [];

function bootstrap() {

    rpg.me = new rpg.Player(window.player_position, window.private_key, window.player_name);
    rpg.me.init_position();
    // start polling events
    rpg.updater.poll();

    // animation

    var _players_move = function() {
        rpg.me.update_target_position();
        rpg.me.move_to_target();
        for(var i=0; i <rpg.other_players.length; i++) {
            if(rpg.other_players[i])
                rpg.other_players[i].move_to_target();
        };
    };
    setInterval(_players_move, 20);

    var _anim = function() {
        if(!rpg.grid.is_loading_room) {
            rpg.me.anim();
            for(var i=0; i <rpg.other_players.length; i++) {
                if(rpg.other_players[i])
                    rpg.other_players[i].anim();
            };
        };
    };
    setInterval(_anim, 120);

    // send the new position to the server
    var _player_send_position = function() {
        if(!rpg.grid.is_loading_room)
            rpg.me.send_position();
    };
    setInterval(_player_send_position, 2000);
};

if(!window.player_position) {
    var player_name = prompt("Choose your hero name");
    rpg.postJSON("/a/player/new", {'body':player_name}, function(response) {
        response = $.evalJSON(response);
        window.private_key = response["you"]["private_key"];
        window.public_key = response["you"]["key"];
        window.player_position = response["you"]["position"];
        window.player_name = response["you"]["name"];
        for(var i=0; i < response["events"].length; i++) {
            rpg.handle_event(response["events"][i]);
        };
        bootstrap();
    });
} else {
    bootstrap();
}

// keyboard stuff
var keyboard = {'up':0, 'left':0, 'right':0, 'down':0};
rpg.keyboard = keyboard;

rpg.keyboard_vector = function keyboard_vector() {
    var vect = [0, 0];
    if(keyboard['up'])
        vect[1] -= 1;
    if(keyboard['left'])
        vect[0] -= 1;
    if(keyboard['down'])
        vect[1] += 1;
    if(keyboard['right'])
        vect[0] += 1;
    return rpg.normalize_vector(vect);
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
$('body').click(function() {
    keyboard_events.focus();
});
keyboard_events.focus();

keyboard_events.keydown(function(e) {
    update_keyboard(e, 1);
    rpg.me.walking = true;
});
keyboard_events.keyup(function(e) {
    update_keyboard(e, 0);
    if( !keyboard["up"] && !keyboard["left"] && !keyboard["right"] && !keyboard["down"] )
        rpg.me.walking=false;
});

$('#save-map').click(function() {
    var content = $.toJSON(rpg.grid.blocs);
    rpg.postJSON("/a/save_map", {'content':content}, function change_room(response) {
        $('#save-message').show().fadeOut("slow");
    });
})

$('#magic').click(function() {
    rpg.postJSON("/a/effect", {'type':'normal'}, function effect(response) {
        animation = new Animation(public_key, rpg.me.position[0], rpg.me.position[1]);
        animation.anim();
    });

});

});