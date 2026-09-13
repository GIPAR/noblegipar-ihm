# ap-manager

Tutorial para permitir que o próprio computador hosteie o próprio wifi, enquanto simultaneamente conecta-se com uma rede externa

Futuramente este passo-a-passo seré necessário para permitir que dispositivos externos consigam se conectar de forma segura (permite a utilização do microfone e câmera)

## Pre-requisitos

### Dependências Iniciais

Primeiramente, baixe e instale as dependências básicas

``` bash
sudo apt install hostapd dnsmasq iw && \
sudo systemctl stop hostapd dnsmasq && \
sudo systemctl disable hostapd && \
sudo systemctl mask hostapd
```

Posteriormente, é necessário verificar se o driver de wifi suporta a configuração AP + Client

``` bash
sudo apt install iw -y && \
iw list | grep -A 15 "valid interface combinations" # Verifique se aparece conjuntamente "#{managed} ... {AP}" em uma mesma linha
```

### Encontrar o nome da Interface

Por fim, é necessário verificar o nome da interface do dispositivo que lida com a rede do seu computador, para isso, rode o seguinte comando

``` bash
iw dev # Veja á direita da palavra "Interface" como por exemplo: Interface wlp4s0
```

Com o nome da interface verificada, substitua os campos respectivos "INTERFACE_NAME=***wlp4s0***" nos arquivos "ap-manager.sh" e "90-ap-sync"

## Preparando o ap-manager

Para a utilização automática do ap-manager, mova os arquivos para as pastas esperadas, além de concedê-las permissão para executar. Nota-se que os seguintes comandos esperam que o seu terminal esteja no diretório noblenara-ihm

``` bash
sudo cp docs/ap-manager/ap-manager.service /etc/systemd/system/ap-manager.service && \
sudo cp docs/ap-manager/ap-manager.sh /usr/bin/ap-manager.sh && \
sudo cp docs/ap-manager/90-ap-sync /etc/NetworkManager/dispatcher.d/90-ap-sync
```

Conceda permissão de execução aos arquivos, necessário para o serviço conseguir rodá-los 

``` bash
sudo chmod +x /usr/bin/ap-manager.sh && \
sudo chmod +x /etc/NetworkManager/dispatcher.d/90-ap-sync
```

Por último, devemos habilitar a inicialização automática do serviço no iniciar

``` bash
sudo systemctl enable ap-manager.service # Caso queira iniciar sem reiniciar o computador, faça o comando "sudo systemctl start ap-manager.service"
```

## Funcionamento (Opcional)

Esta seção apresentará de forma breve o funcionamento e a arquitetura do ap-manager

Existem três arquivos centrais de funcionamento, o serviço, o script e o atualizador

### Serviço

O ap-manager.service é o arquivo principal de serviço do sistema. Sua função principal consiste em rodar o script quando inicializado e o de remover as principais modificações realizadas na saída

### Script

O script ap-manager.sh é o maior componente com o maior número de funções. Ele segue o seguinte passo-a-passo:

1. Verifica a frequência e o DNS principal da rede conectada (a maioria dos dispositivos precisam que o AP tenha o mesmo canal que o Cliente)
2. Cria uma interface secundária para o AP, retirando também o seu gerenciamento do NetworkManagaer (que é feito pelo hostapd)
3. Configura o AP a partir da frequência e do DNS analisado anteriormente
4. Configura o dnsmasq (lida com os IPs e com o DNS), incluindo o DNS principal resolvido na primeira etapa
5. Configurações finais para permitir que o AP utilize a internet da interface principal
6. Inicializa o hostapd com o arquivo de configurações criado anteriormente

### Atualizador

Por fim, este último arquivo 90-ap-sync permite que o ap-manager funcione completamente quando a rede da interface principal mude. Seu papel é o de parar o serviço do ap-manager temporariamente, necessário para a reconfiguração do sistema com uma nova rede conectada
