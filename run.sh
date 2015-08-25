thispath=$(pwd -P)
#DJANGO_SETTINGS_MODULE=rpg.settings

supervisord -c $thispath/supervisor.conf && \
(cat <<EOF > _nginx.conf
http {
  upstream rpg_app_server {
    server unix:$thispath/rpg/gunicorn.sock fail_timeout=0;
  }
  server {
    listen 8088;
    client_max_body_size 4G;
    access_log /tmp/nginx-access.log;
    error_log /tmp/nginx-error.log;
    location / {
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header Host \$http_host;
        proxy_redirect off;
        if (!-f \$request_filename) {
            proxy_pass http://rpg_app_server;
            break;
        }
    }
    location /static/ {
        alias   $thispath/rpg/static/;
    }
    location = /50x.html {
        root $thispath/rpg/static/;
    }
    error_page 500 502 503 504 /50x.html;
  }
}
events {
    worker_connections  1024;
}
EOF
) && nginx -c $thispath/_nginx.conf
