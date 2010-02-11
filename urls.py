from django.conf.urls.defaults import *
from django.conf import settings

urlpatterns = patterns('chat.views',
    ('^$', 'main'),
    ('^a/message/new$', 'message_new'),
    ('^a/room/updates$', 'room_updates'),
    ('^a/player/new$', 'player_new'),
    ('^a/player/update_position$', 'player_update_position'),
    ('^a/change_room$', 'change_room'),
    ('^a/save_map', 'save_map'),
    ('^a/effect', 'effect'),
    ('^a/fight/new', 'fight_new'),

)

urlpatterns += patterns('',
    ('^static/(?P<path>.*)$', 'django.views.static.serve',
        {'document_root': settings.MEDIA_ROOT, 'show_indexes':True}),
)

