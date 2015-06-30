#!/usr/bin/env python
import os
import traceback
from django.core.signals import got_request_exception
from rpg.wsgi import application
import tornado.wsgi
import tornado.httpserver

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "settings")

def exception_printer(sender, **kwargs):
    traceback.print_exc()

got_request_exception.connect(exception_printer)

print 'Tornado serving on 8088...'
http_server = tornado.httpserver.HTTPServer(tornado.wsgi.WSGIContainer(application))
http_server.listen(8088)
tornado.ioloop.IOLoop.current().start()

