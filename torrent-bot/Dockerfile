FROM timmson/mbt-platform-v2:node
LABEL maintaner="Krotov Artem <timmson666@mail.ru>"

ARG username
ARG config_server
ARG config_path
ARG torrent_svc

RUN useradd ${username} -s /bin/bash -G sudo -md /home/${username} && \
    sed -i.bkp -e 's/%sudo\s\+ALL=(ALL\(:ALL\)\?)\s\+ALL/%sudo ALL=NOPASSWD:ALL/g' /etc/sudoers && \
    mkdir /app

WORKDIR /app

COPY src/ .

RUN wget ${config_server}${config_path} && npm i && chown -R ${username}:${username} . && chmod +x run.sh

USER ${username}

ENV torrent_svc ${torrent_svc}

CMD ["./run.sh"]