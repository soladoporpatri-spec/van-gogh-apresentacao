# Vincent van Gogh — trabalho escolar (site de apresentação)

Site estático (HTML, CSS e JavaScript puros, sem build e sem dependências) que funciona como uma
apresentação em tela cheia sobre Vincent van Gogh. Aluno: Patrício · Turma 3B.

## Como apresentar

| Ação | Como |
| --- | --- |
| Avançar | `→`, `PageDown`, `Espaço` ou botão **Avançar** |
| Voltar | `←`, `PageUp`, `Shift+Espaço` ou botão **Voltar** |
| Primeiro / último slide | `Home` / `End` |
| Tela cheia | `F` ou botão **Tela cheia** (canto superior direito) |
| Ampliar uma pintura | clicar na obra selecionada (ou em qualquer imagem dos slides) |
| Fechar a ampliação | **X** amarelo, `Esc` ou clique no fundo |
| Sair do foco de uma obra | **X** amarelo no painel de informações ou `Esc` |
| Celular / tablet | deslizar para os lados |

Cada slide tem endereço próprio: `…/#7` abre direto o sétimo slide.

> Dica: abra o link uma vez antes da aula, com a internet funcionando, para as imagens ficarem em cache.

## Estrutura

```
index.html        slides e textos
apresentacao.css  modo apresentação (slides, controles, animações)
apresentacao.js   navegação, teclado, abertura, ampliação das imagens dos slides
exposicao.css     exposições interativas (três fases e autorretratos) e tela cheia
exposicao.js      dados e textos das 26 obras, animações e interação
favicon.svg       ícone da aba
vercel.json       cabeçalhos e cache (opcional)
img/              pinturas (versão pequena "-m" e grande "-l")
```

## Publicar

### 1) GitHub

```bash
git init -b main
git add .
git commit -m "Site de apresentação sobre Van Gogh"
gh repo create van-gogh-apresentacao --public --source . --push
```

### 2) Vercel

1. Em <https://vercel.com/new>, escolha **Import Git Repository** e selecione o repositório.
2. Em *Framework Preset* deixe **Other**; não precisa de comando de build nem de diretório de saída.
3. Clique em **Deploy**. O link público será algo como `https://van-gogh-apresentacao.vercel.app`.

Toda vez que você fizer `git push`, a Vercel publica a versão nova sozinha.

Alternativa pela linha de comando: `npx vercel --prod` dentro desta pasta.

### Teste local

```bash
python -m http.server 8000
```

Depois abra <http://localhost:8000>. Abrir o `index.html` direto (duplo clique) também funciona.

## Créditos das imagens

As pinturas de Vincent van Gogh estão em domínio público. As reproduções vêm do Wikimedia Commons, a partir das
imagens dos acervos: Van Gogh Museum (Amsterdã), The Metropolitan Museum of Art, National Gallery (Londres),
Museum of Fine Arts (Boston), Art Institute of Chicago, National Galleries of Scotland, Musée d'Orsay, Musée Rodin,
Kröller-Müller Museum, Yale University Art Gallery, Harvard Art Museums, The Courtauld Gallery, MoMA e Coleção
E. G. Bührle. Cada obra, dentro do site, traz o link para o arquivo de origem.

Os textos de curadoria das exposições foram escritos para este trabalho.
