import uuid
import simplejson
from django.shortcuts import render_to_response
from django.template.loader import render_to_string
from django.http import HttpResponse
from gevent.event import Event
from django.conf import settings


class ChatRoom(object):

    def __init__(self):
        self.last_message = []
        self.players = []
        self.cache = []
        self.room_event = Event()
        self.event_cursor = 0
        self.event_buffer = []
        for v in range(0, 9):
            self.event_buffer.append(None)

    def main(self, request):
        return render_to_response(
            'index.html',
            {'MEDIA_URL': settings.MEDIA_URL}
        )

    def new_room_event(self, value):
        self.event_cursor += 1
        if self.event_cursor >= len(self.event_buffer):
            self.event_cursor = 0
        self.event_buffer[self.event_cursor] = value
        self.room_event.set()
        self.room_event.clear()

    def get_player(self, key):
        for p in self.players:
            if p['key'] == key:
                return p
        return None

    def player_new(self, request):
        key = request.COOKIES.get('rpg_key', False)
        new_player = self.get_player(key)
        if  not new_player:
            key = str(uuid.uuid4())
            name = request.POST['body']
            new_player = {'name':name, 'key':key}
        event_list = []
        # send all the other player
        for player in self.players:
            event_list.append(['new_player', player])
        self.players.append(new_player)
        self.new_room_event(['new_player', new_player])
        response = json_response({'you':new_player, 'events':event_list})
        response.set_cookie('rpg_key', key)
        return response

    def player_update_position(self, request):
        key = request.COOKIES['rpg_key']
        player = self.get_player(key)
        position = request.POST['body']
        player['position'] = position
        self.new_room_event(['update_player_position', [key, position]])
        return json_response([1])

    def message_new(self, request):
        key = request.COOKIES['rpg_key']
        msg = request.POST['body']
        player = self.get_player(key)
        player['last_message'] = msg
        self.new_room_event(['last_message', [key, msg]])
        return json_response([1])

    def room_updates(self, request):

        self.room_event.wait()
        
        cursor = int(request.POST.get('cursor', False))
        # up to date
        if cursor == self.event_cursor:
            return json_response([1])
        if cursor == False:
            cursor = self.event_cursor
        # increment to be at the same level at the event
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


room = ChatRoom()
main = room.main
message_new = room.message_new
player_new = room.player_new
player_update_position = room.player_update_position
room_updates = room.room_updates

def create_message(from_, body):
    data = {'id': str(uuid.uuid4()), 'from': from_, 'body': body}
    data['html'] = render_to_string('message.html', dictionary={'message': data})
    return data

def json_response(value, **kwargs):
    kwargs.setdefault('content_type', 'text/javascript; charset=UTF-8')
    return HttpResponse(simplejson.dumps(value), **kwargs)

