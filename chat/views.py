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
        self.new_room_event = Event()

    def main(self, request):
        return render_to_response(
            'index.html',
            {'MEDIA_URL': settings.MEDIA_URL}
        )

    def get_player(self, key):
        for p in self.players:
            if p['key'] == key:
                return p
        return None

    def player_new(self, request):
        key = str(uuid.uuid4())
        name = request.POST['body']
        player = {'name':name, 'key':key}
        self.players.append(player)
        self.new_room_event.set()
        self.new_room_event.clear()
        response = json_response({'new_player':player})
        response.set_cookie('rpg_key', key)
        return response 

    def player_update_position(self, request):
        key = request.COOKIES['rpg_key']
        player = self.get_player(key)
        position = request.POST['body']
        player['position'] = position
        self.new_room_event.set()
        self.new_room_event.clear()
        print "player update pos"
        return json_response({'update_player_position':[key, position]})

    def message_new(self, request):
        key = request.COOKIES['rpg_key']
        msg = request.POST['body']
        player = self.get_player(key)
        player['last_message'] = msg
        self.new_room_event.set()
        self.new_room_event.clear()
        print "player update pos"
        return json_response({'last_message':[key, msg]})

    def room_updates(self, request):
        value = self.new_room_event.wait()
        return json_response({
            'players': self.players
        })


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

