#!/bin/bash
while getopts u:g:b: opt;rc=$?;[ $rc$opt == 0? ] && exit 1; [ $rc == 0 ] || { shift $[OPTIND-1]; false; }; do eval ${opt}=${OPTARG}; done

USER=${u:-"decitre"}
GROUP=${g:-"HERE\Domain Users"}
 
NAME="rpg"
NUM_WORKERS=3 

DJANGODIR=$(dirname $0)/$NAME
DJANGO_SETTINGS_MODULE=$NAME.settings
DJANGO_WSGI_MODULE=$NAME.wsgi

SOCKFILE=$DJANGODIR/gunicorn.sock
BIND=${b:-"unix:$SOCKFILE"}
 
echo "Starting $NAME as $(whoami)"
 
# Create the run directory if it doesn't exist
RUNDIR=$(dirname $SOCKFILE)
test -d $RUNDIR || mkdir -p $RUNDIR
 
exec $(which gunicorn) ${DJANGO_WSGI_MODULE}:application \
  --name $NAME \
  --workers $NUM_WORKERS \
  --user $USER \
  --group "$GROUP" \
  --bind $BIND \
  --log-level debug \
  --log-file -
