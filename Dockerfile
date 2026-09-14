FROM ros:jazzy-ros-base

SHELL ["/bin/bash", "-c"]
ENV DEBIAN_FRONTEND=noninteractive


# ================================================================
#  FASE 00 — Dependências Iniciais
RUN apt-get update && apt-get upgrade -y && \
    apt install -y ros-jazzy-rosbridge-suite \
        ros-jazzy-web-video-server \ 
        npm uvicorn && \
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN source /usr/local/nvm/nvm.sh && \
    nvm install 24.11.1 && \
    pip install --break-system-packages fastapi pymongo python-dotenv python-multipart "numpy<2" && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*


# ================================================================
#  FASE 01 — Instalação do Workspace
WORKDIR /noblegipar-ihm

RUN git clone https://github.com/GIPAR/noblenara-ihm && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN cd frontend/ && \
    npm install && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN cd backend/ && \
    npm install && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*


# ================================================================
#  FASE 03 — Ambiente e Entrypoint
# .bashrc → garante o ambiente em sessões interativas
RUN echo 'export ROS_DOMAIN_ID=77' >> /root/.bashrc

# entrypoint → garante o ambiente em qualquer situação
RUN echo '#!/bin/bash'                                                              > /ros_entrypoint.sh && \
    echo 'set -e'                                                                  >> /ros_entrypoint.sh && \
    echo 'export ROS_DOMAIN_ID=77'                                                 >> /ros_entrypoint.sh && \
    echo 'exec "$@"'                                                               >> /ros_entrypoint.sh && \
    chmod +x /ros_entrypoint.sh

ENTRYPOINT ["/ros_entrypoint.sh"]
CMD ["/bin/bash"]