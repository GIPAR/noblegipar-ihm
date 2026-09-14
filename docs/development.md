# IHM Server Development

## Development Notes

### Development

* Criado método de Host+Client simultâneos;
* Tornado a conexão do website segura para dispositvos externos (a concluir);
Added: ap-manager.service, ap-manager.sh

Objetivos
    Hostear o próprio wifi por motivos de segurança e de praticidade
    Utilizar aparelhos como o microfone, camera e outros quando conectado na ihm via wifi

Arquitetura
    *Public Domain: DuckDNS ---> noblegipar.duckdns.org
    *Local PC ---> AP + Client (with hostapd + dnsmasq)
    *Caddy / Certbot / Traefik ---> Certifies the Website using the domain and the dnsmasq
    *Device Connected to the AP hit the domain and get redirected to the website (dnsmasq)

Comandos (Depois de verificar o nome da interface do computador e trocar no ap-maanager.sh e 90-ap-sync)
    sudo cp ap-manager.service /etc/systemd/system...
    sudo cp ap-manager.sh /user/bin/...
    sudo cp 90-ap-sync /user/bin/...
    sudo chmod +x /user/bin/
    sudo chmod +x /etc/NetworkManager/dispatcher.d/90-ap-sync

Steps to certificate the website, allowing external devices to connect securely to it, besides a second object that is to make any local device connected to the AP hit the public domain and be redirected to the interface, after configuring the redirection internally in the AP

Estabelecido subdomíno utilizando o DuckDNS em; noblegipar.duckdns.org, a qual espera um ipv4 fixo de 192.168.4.1

### Instalação

#### Pre-requisitos

##### Hardware

Primeiramente é necessário verificar se o driver de wifi suporta AP + Client; Esse comando também pode ser usado para verificar se o AP+Client precisam estar necessariamente no mesmo canal, sendo ideal utilizar canais diferentes

sudo apt install iw -y && \
iw list | grep -A 15 "valid interface combinations" # Verifique se aparece conjuntamente "#{managed} ... {AP}" em uma mesma linha

##### Dependências

Agora instalamos os pacotes responsáveis por hostear o próprio wifi e lidar com a conexão (hostapd) e o que distribui os ips e lida com o DNS (dnsmasq - DNS ultramente necessário para lidar com o DuckDNS e a entrada automática na ihm)

sudo apt install hostapd dnsmasq

Possivelmente é necessário parar os serviços após a instalação inicial

sudo systemctl stop hostapd && \
sudo systemctl stop dnsmasq && \
sudo systemctl unmask hostapd

##### Encontrar o nome da Interface

Agora é necessário conhecer o nome da interface do dispostivo que lida com a rede do seu computador, para isso, rode o seguinte comando

iw dev # Veja á direita da palavra "Interface" como por exemplo: Interface

O script que é utilizado para automatizar o processo precisa receber esse nome, entre em ap-manager.sh e modifique a linha "INTERFACE_NAME=wlp4s0" trocando wlp4s0 pelo nome da interface encontrada no comando anterior

#### Serviços

Agora precisamos instalar o serviço e o script que automatiza todo o processo de configuração de AP+Cliente

Posteriormente também tem uma explicação um pouco mais in-depth do que o script e o serviço

##### Serviço ap-manager

##### Script ap-manager

Retira o gerenciamento da interface NetworkManager

Cria uma segunda interface (software secundário) para permitir que o hardware ative AP+Client simultaneamente nomeada ap0 com um ip fixo

Cria um arquivo de configuração do hostapd e do dnsmasq com printf e o comando tee

Problema, nesse dispositivo é necessário que o canal do cliente seja o mesmo que o do accespoint, por isso, caso o cliente mude de rede é necessário que um script automaticamente atualize o canal do AP

Futuramente: dispatcher - Checka o canal do dispostivo Cliente modifica o canal no script se necessário

##### Comandos úteis

Caso queira testar se o dispositivo realmente não está sendo administrado pelo NetworkManager

nmcli device status # Verifique se o dispostivo selecionado aparece como "unmanaged"

sudo sysctl -w net.ipv4.ip_forward=1
sudo iptables -t nat -A POSTROUTING -o wlp4s0 -j MASQUERADE
sudo iptables -I FORWARD 1 -i ap0 -o wlp4s0 -j ACCEPT
sudo iptables -I FORWARD 2 -i wlp4s0 -o ap0 -m state --state RELATED,ESTABLISHED -j ACCEPT

### Arquitetura

ap-manager.service -> ap-manager.sh

systemd ap-manager.service: starting the execution after the start of hostapd/dnsmasq?
ap-manager.sh: the service will call this script

developer :::
start configuration: finding the interface name (with iw list) and swithiching "INTERFACE_NAME" in the ap-manager.sh

ap-manager.sh :::
adding the configured interface as unmanaged using that command**
restarting NetworkManager
adding the virtual ap0
activating hostapd
fixing the ip
adding the configuration for dnsmasq**

** = Using tee command that replaces the existing content or create a new one, placing all the main logic in one place

## Planos Atuais

* Adição de Funcionalidades:
    Adicionar setting de MaxSpeed no Configuration.tsx

* Mudanças Gerais:
    Talvez fazer o mapa SLAM ficar no meio da tela
    Adicionar forma de colocar câmeras ou mapas adicionais na tela

* Adições Gerais:
    Desenvolver Posteriormente o tutorial em uma versão mais atualizada da IHM

* Agente de IA
    Verificar realmente as opções que temos para servir os agentes além de vLLM e Ollama

## Notas

* Futuramente verificar trocar webvideoserver por:
H.264/H.265 via FFMPEG (ffmpeg_image_transport)
    What it is: Video compression using keyframes with predictive frames encoding only differences between frames; Bandwidth: ~1-5 Mbps typical (configurable via bitrate)
    Use case: Best for teleoperation - high frame rate video over WiFi
        'You need the <video tag: It activates the browser's built-in video player engine (hardware acceleration).'

* Certificação do website para não ser um link inseguro quando conectado na rede local
Importante para o funcionamento dos dispositivos!
Domínio Robusto para Aplicação: DigitalPlat + Cloudflare

## Details (ignore)

node --version 24.11.1
nvm --version 0.39.2
npm --version 11.6.2
