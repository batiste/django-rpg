from django.conf.urls.defaults import *
from game import settings

urlpatterns = patterns('game.chat.views',
    ('^$', 'main'),
    ('^a/message/new$', 'message_new'),
    ('^a/room/updates$', 'room_updates'),
    ('^a/player/new$', 'player_new'),
    ('^a/player/update_position$', 'player_update_position')
)

urlpatterns += patterns('django.views.static',
    (r'^%s(?P<path>.*)$' % settings.MEDIA_URL.lstrip('/'), 
      'serve', {
      'document_root': settings.MEDIA_ROOT,
      'show_indexes': True })
)

