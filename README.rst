A browser based Role Playing Game
=================================

A Role Playing Game skeleton that use a gevent powered django application served by a gunicorn application server. 

To start the gunicor application server, run::

    $ python manage.py syncdb
    $ gunicorn rpg.wsgi:application --bind localhost:8088

Alternatively, you can start the Django single-threaded development server::

    $ python manage.py syncdb
    $ python run.py

Example chat room from https://github.com/gevent/gevent/blob/master/examples/webchat/chat/views.py

Tested on Ubuntu Chrome, Firefox, Safari.

Screenshot
==========

.. image:: http://batiste.dosimple.ch/django-rpg-screenshot.png


Requirements
============

git, sqlite3, django 1.8, pip, gevent (1.0.2 or 1.1a1), gunicorn

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
