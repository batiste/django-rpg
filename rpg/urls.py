from django.conf.urls import include, url
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static

import views

urlpatterns = [
    url('^$', views.main),
    url('^a/message/new$', views.message_new),
    url('^a/room/updates$', views.room_updates),
    url('^a/player/new$', views.player_new),
    url('^a/player/update_position$', views.player_update_position),
    url('^a/change_room$', views.change_room),
    url('^a/save_map', views.save_map),
    url('^a/effect', views.effect),
    url('^a/fight/new', views.fight_new)
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
