A browser based Role Playing Game
=================================

A Role Playing Game skeleton that uses django, gevent and gunicorn/supervisor/nginx

To start the gunicorn/supervisor/nginx application server, run::

    $ python manage.py syncdb
    $ ./run.sh

To stop it::

    $ nginx -s stop && supervisorctl -c $(pwd)/supervisor.conf shutdown

Alternatively, you can start the Django single-threaded development server::

    $ python manage.py syncdb
    $ python run.py

Example chat room from https://github.com/gevent/gevent/blob/master/examples/webchat/chat/views.py

Tested on Ubuntu Chrome, Firefox, Safari.

Requirements
============

sqlite3, django 1.8, ujson, gevent (1.0.2 or 1.1a1), gunicorn, supervisor, nginx

Features
========

    * The goal is to be massively multiplayer
    * Room Chat
    * Non player characters example
    * Basic example of spell
    * Map editing

Goals
=====

    * Write down a gameplay
    * Player experience, spells learning, combact mode, quests, crafting
    * Add a second layer on the map for objects
    * Get some graphics designer involved
