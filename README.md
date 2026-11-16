# Voz do Professor — apresentação interativa

**Apresentação:** https://anddrad3.github.io/voz-do-professor-apresentacao/

20 slides com animações, notas do apresentador e controle pelo celular.

## Usar pela internet

1. Abra o link da apresentação no computador.
2. Pressione **C** e escaneie o QR code com o celular.
3. Deixe a aba do computador aberta. No celular, use **Próximo**, **Anterior**, o menu de slides e os comandos de cada slide. O roteiro acompanha a tela do computador.
4. **F** alterna tela cheia; **O** abre a visão geral; **N** mostra as notas; **H** fixa os controles. As setas e a barra de espaço navegam pelos slides.

Cada aba da apresentação cria uma sessão independente. Compartilhe o link do controle somente com quem vai apresentar. Recarregar a apresentação cria uma nova sessão: escaneie o novo código. Recarregar apenas o controle mantém a sessão e sincroniza o slide atual.

O controle aberto sem QR code em `controle.html` funciona como roteiro de leitura, sem comandar outras sessões.

## Conexão e hospedagem gratuita

O GitHub Pages serve os arquivos estáticos da pasta `docs/`. A conexão entre aparelhos usa PeerJS/WebRTC, com o serviço público PeerServer Cloud para o pareamento. Não há conta adicional, servidor pago ou chave de API no repositório. As bibliotecas JavaScript são distribuídas junto com o site, com versões fixas.

É necessário acesso à internet para parear. Redes que bloqueiam WebRTC, determinadas configurações de NAT ou indisponibilidade do serviço público podem impedir o controle remoto. Nesses casos, use o mesmo Wi-Fi ou o hotspot do celular, ou apresente pelo teclado. O serviço público não tem garantia de disponibilidade. Não há servidor TURN próprio configurado.

O QR code é gerado no próprio navegador. O número do slide e os comandos trafegam pela conexão WebRTC; a hospedagem e o serviço de sinalização recebem os dados de conexão inerentes a esses serviços. O site não deve ser descrito como livre de registros de IP. O conteúdo do slide de privacidade refere-se ao projeto apresentado, não às políticas de infraestrutura do GitHub ou PeerJS.

## Arquivos

- `apresentacao.html` e `controle.html`: originais locais preservados, com todas as imagens e falas.
- `Iniciar apresentacao…` e `sistema/`: programas originais de execução local para Windows, macOS e Linux. O código-fonte desses executáveis não foi fornecido nesta pasta.
- `web/`: conexão e textos específicos da edição online.
- `scripts/build.mjs`: gera a versão do site em `docs/` a partir dos originais.
- `tests/`: validação de conteúdo, JavaScript, isolamento das sessões, mensagens e reconexão.
- `LEIA-ME.txt`: instruções originais para usar sem internet na rede local.

## Desenvolvimento

Requer Node.js 22 ou superior. Para o servidor de prévia abaixo, requer também Python 3.

```sh
npm ci
npm run build
npm test
npm run preview
```

Abra http://127.0.0.1:4173. Edite os HTML originais para alterar o conteúdo; edite `web/` para alterar a conexão online. Gere novamente `docs/` e faça commit também dos arquivos gerados. O GitHub Pages publica automaticamente a pasta `/docs` da branch `main`.

## Referências técnicas

- [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [PeerJS](https://peerjs.com/docs/)
- [QR Code Generator — Kazuhiko Arase](https://github.com/kazuhikoarase/qrcode-generator)

As bibliotecas de terceiros mantêm suas licenças MIT nos arquivos distribuídos. Não foi atribuída uma licença nova ao conteúdo autoral da apresentação.
