import uuid
import simplejson
from django.shortcuts import render_to_response
from django.template.loader import render_to_string
from django.http import HttpResponse
from gevent.event import Event
from gevent import spawn_later
from django.conf import settings
from django.utils.html import escape

from chat.models import Map, Player, Fight
import random

def pub_key(request):
    return request.COOKIES.get('public_key', False)

def priv_key(request):
    return request.COOKIES.get('private_key', False)

class ChatRoom(object):

    def __init__(self, room_id):
        self.pk = room_id
        self.room_map = Map.objects.get(pk=self.pk)
        self.last_message = []
        self.players = []
        spawn_later(5, self.move_pnj)
        self.cache = []
        self.room_event = Event()
        self.event_cursor = 0
        self.event_buffer = []
        self.fights = []
        for v in range(0, 9):
            self.event_buffer.append(None)
        npc = Player(name='Wise man')
        self.npc = npc
        self.players.append(self.npc)
        self.new_event(['new_player', npc.pub()])
        
    def move_pnj(self):
        npc = self.npc
        if npc:
            pos = [npc.position[0], npc.position[1]]
            pos[0] += random.randint(-50, 50)
            pos[1] += random.randint(-50, 50)
            safe = self.room_map.is_safe_position(pos)
            if safe:
                npc.position = pos
                self.new_event(['update_player_position',
                    [npc.public_key, npc.position]])
            spawn_later(5, self.move_pnj)

    def main(self, request):
        key = priv_key(request)
        player = self.get_player(key)
        return render_to_response(
            'index.html',
            {
                'player':player,
                'map':self.room_map,
                'map_content':self.room_map.content.replace("\n", ""),
                'MEDIA_URL': settings.MEDIA_URL
            }
        )

    def new_event(self, value):
        self.event_cursor += 1
        if self.event_cursor >= len(self.event_buffer):
            self.event_cursor = 0
        self.event_buffer[self.event_cursor] = value
        self.room_event.set()
        self.room_event.clear()

    def get_player(self, key):
        for p in self.players:
            if p.public_key == key:
                return p
            if p.private_key == key:
                return p
        return None

    def remove_player(self, key):
        for p in self.players:
            if p.private_key == key:
                self.players.remove(p)
                return p
        return None

    def save_map(self, request):
        self.room_map.ground = request.POST['content']
        self.room_map.save()
        self.new_event({'update_map':self.room_map.serialized()})
        return json_response([1])

    def player_new(self, request):
        key = priv_key(request)
        new_player = self.get_player(key)
        if not new_player:
            name = escape(request.POST['body'])
            new_player = Player(
                name=name,
                position='[20,20]'
            )
            new_player.save()
        event_list = []
        # send all the other player to the new one
        for player in self.players:
            event_list.append(['new_player', player.pub()])
        self.players.append(new_player)
        self.new_event(['new_player', new_player.pub()])
        response = json_response({
            'you':new_player.priv(),
            'events':event_list
        })
        response.set_cookie('private_key', new_player.private_key)
        return response

    def player_update_position(self, request):
        key = priv_key(request)
        player = self.get_player(key)
        pos = request.POST.get('body', False)
        if(pos):
            player.position = pos
            self.new_event([
                'update_player_position',
                [player.public_key, player.position]
            ])
        return json_response([1])

    def message_new(self, request):
        key = priv_key(request)
        player = self.get_player(key)
        msg = escape(request.POST['body'])
        #player.last_message = msg
        self.new_event(['last_message', [player.public_key, msg]])
        return json_response([1])

    def fight_new(self, request):
        key = priv_key(request)
        player = self.get_player(key)
        bad = Player(name='bad')
        self.new_event(['player_leave_room', player.pub()])
        new_room.new_event(['new_player', player.pub()])
        self.remove_player(key)
        adversary = Player(name='Rogue level 1')
        fight = Fight(
            player=player,
            adversary=adversary,
            room_map=self.room_map
        )

        response.set_cookie('fight_key', fight.key)
        
        return json_response([1])

    def room_updates(self, request):

        self.room_event.wait()
        
        cursor = int(request.POST.get('cursor', False))
        # up to date
        if cursor == self.event_cursor:
            return json_response([1])
        if cursor == False:
            cursor = self.event_cursor
        # increment to be at the same level that the last event
        cursor += 1
        if cursor >= len(self.event_buffer):
            cursor = 0
        
        event_list = []
        # if there is more than just on event
        while(cursor != self.event_cursor):
            event = self.event_buffer[cursor]
            if event:
                event_list.append(self.event_buffer[cursor])
            cursor += 1
            if cursor >= len(self.event_buffer):
                cursor = 0

        event_list.append(self.event_buffer[self.event_cursor])
        event_list.append(['update_cursor', self.event_cursor])

        return json_response(event_list)

    def effect(self, request):
        key = priv_key(request)
        player = self.get_player(key)
        effect_type = request.POST.get('type')
        self.new_event(['effect', [player.public_key,
            effect_type]])
        return json_response([1])
        
    def change_room(self, request):
        key = priv_key(request)
        player = self.get_player(key)
        direction = request.POST.get('direction')
        x = 0; y = 0
        pos = player.position
        if direction == 'left':
            pos[0] = 34 * 16
            x = -1
        if direction == 'right':
            pos[0] = 0
            x = +1
        if direction == 'top':
            pos[1] = 28 * 16
            y = -1
        if direction == 'bottom':
            pos[1] = 0
            y = +1
        player.position = pos
        old_map = Map.objects.get(pk=self.pk)
        room_map, created = Map.objects.get_or_create(x=old_map.x+x,
            y=old_map.y+y)
        self.new_event(['player_leave_room', player.pub()])
        new_room = get_room(room_map.id)
        new_room.players.append(player)
        new_room.new_event(['new_player', player.pub()])
        self.remove_player(key)
        # send all the other player
        event_list = []
        for player in new_room.players:
            event_list.append(['new_player', player.pub()])
        response = json_response({'change_room':room_map.serialized(),
            "events":event_list})
        response.set_cookie('room_id', new_room.pk)
        return response

rooms = {}
def get_room(room_id):
    if rooms.has_key(room_id):
        room = rooms[room_id]
    else:
        room = ChatRoom(room_id)
        rooms[room_id] = room
    return room

def room_dispacher(method):
    def _method(request):
        room_id = int(request.COOKIES.get('room_id', 1))
        if rooms.has_key(room_id):
            room = rooms[room_id]
        else:
            room = ChatRoom(room_id)
            rooms[room_id] = room
        return getattr(room, method)(request)
    return _method

# dispatch to rooms
main = room_dispacher('main')
message_new = room_dispacher('message_new')
player_new = room_dispacher('player_new')
player_update_position = room_dispacher('player_update_position')
room_updates = room_dispacher('room_updates')
change_room = room_dispacher('change_room')
save_map = room_dispacher('save_map')
effect = room_dispacher('effect')
fight_new = room_dispacher('fight_new')

def json_response(value, **kwargs):
    kwargs.setdefault('content_type', 'text/javascript; charset=UTF-8')
    return HttpResponse(simplejson.dumps(value), **kwargs)

